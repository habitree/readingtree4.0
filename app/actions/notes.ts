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
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", data.book_id)
    .eq("user_id", user.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`책 소유 확인 실패: ${bookCheckError.message}`);
  }

  if (!userBook) {
    throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
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
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`기록 조회 실패: ${noteCheckError.message}`);
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 수정할 권한이 없습니다.");
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
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id, image_url")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`기록 조회 실패: ${noteCheckError.message}`);
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 삭제할 권한이 없습니다.");
  }

  // 이미지가 있으면 Storage에서 삭제
  if (note.image_url) {
    try {
      // Supabase Storage 경로 추출
      // URL 형식: https://[project].supabase.co/storage/v1/object/public/images/photos/[userId]/[fileName]
      const url = new URL(note.image_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/");
      
      if (pathParts.length === 2) {
        const fullPath = pathParts[1];
        const pathSegments = fullPath.split("/");
        
        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0]; // "images"
          const filePath = pathSegments.slice(1).join("/"); // "photos/[userId]/[fileName]"

          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (removeError) {
            console.error("이미지 삭제 오류:", removeError);
            // 이미지 삭제 실패해도 기록은 삭제 진행
          }
        }
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
 * 게스트 사용자의 경우 샘플 데이터 반환
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

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !user) {
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
      .eq("is_sample", true)
      .order("created_at", { ascending: false })
      .limit(50); // 샘플 데이터는 최대 50개

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: sampleNotes, error: sampleError } = await query;

    if (sampleError) {
      // 샘플 데이터가 없어도 빈 배열 반환 (에러 발생하지 않음)
      return [];
    }

    return sampleNotes || [];
  }

  // 인증된 사용자는 기존 로직 사용
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
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (error && error.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`기록 상세 조회 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("기록을 찾을 수 없거나 권한이 없습니다.");
  }

  return data;
}

