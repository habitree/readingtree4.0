"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateNoteInput, UpdateNoteInput, NoteType } from "@/types/note";

/**
 * 기록 생성
 * @param data 기록 데이터
 */
export async function createNote(data: CreateNoteInput) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 책 소유 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", data.book_id)
    .eq("user_id", user.id)
    .single();

  if (!userBook) {
    throw new Error("권한이 없습니다.");
  }

  // 기록 생성
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      book_id: data.book_id,
      type: data.type,
      content: data.content || null,
      image_url: data.image_url || null,
      page_number: data.page_number || null,
      is_public: data.is_public ?? false,
      tags: data.tags || null,
    })
    .select()
    .single();

  if (error || !note) {
    throw new Error(`기록 생성 실패: ${error?.message || "알 수 없는 오류"}`);
  }

  revalidatePath("/notes");
  revalidatePath(`/books/${data.book_id}`);
  revalidatePath(`/notes/${note.id}`);

  return { success: true, noteId: note.id };
}

/**
 * 기록 수정
 * @param noteId 기록 ID
 * @param data 수정할 데이터
 */
export async function updateNote(noteId: string, data: UpdateNoteInput) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기록 소유 확인
  const { data: note } = await supabase
    .from("notes")
    .select("id, book_id")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (!note) {
    throw new Error("권한이 없습니다.");
  }

  // 기록 수정
  const { error } = await supabase
    .from("notes")
    .update({
      content: data.content !== undefined ? data.content : undefined,
      page_number: data.page_number !== undefined ? data.page_number : undefined,
      is_public: data.is_public !== undefined ? data.is_public : undefined,
      tags: data.tags !== undefined ? data.tags : undefined,
    })
    .eq("id", noteId);

  if (error) {
    throw new Error(`기록 수정 실패: ${error.message}`);
  }

  revalidatePath("/notes");
  revalidatePath(`/books/${note.book_id}`);
  revalidatePath(`/notes/${noteId}`);

  return { success: true };
}

/**
 * 기록 삭제
 * @param noteId 기록 ID
 */
export async function deleteNote(noteId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기록 소유 확인
  const { data: note } = await supabase
    .from("notes")
    .select("id, book_id, image_url")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (!note) {
    throw new Error("권한이 없습니다.");
  }

  // 이미지가 있으면 Storage에서 삭제
  if (note.image_url) {
    try {
      // Supabase Storage 경로 추출
      const url = new URL(note.image_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/");
      if (pathParts.length === 2) {
        const [bucket, ...filePathParts] = pathParts[1].split("/");
        const filePath = filePathParts.join("/");

        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
      // 이미지 삭제 실패해도 기록은 삭제 진행
    }
  }

  // 기록 삭제
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(`기록 삭제 실패: ${error.message}`);
  }

  revalidatePath("/notes");
  revalidatePath(`/books/${note.book_id}`);

  return { success: true };
}

/**
 * 기록 목록 조회
 * @param bookId 책 ID (선택)
 * @param type 기록 유형 필터 (선택)
 */
export async function getNotes(bookId?: string, type?: NoteType) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (bookId) {
    query = query.eq("book_id", bookId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`기록 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 기록 상세 조회
 * @param noteId 기록 ID
 */
export async function getNoteDetail(noteId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error(
      `기록 상세 조회 실패: ${error?.message || "기록을 찾을 수 없습니다."}`
    );
  }

  return data;
}

