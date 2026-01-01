"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeErrorMessage } from "@/lib/utils/validation";
import { isValidUUID } from "@/lib/utils/validation";
import type { NoteWithBook } from "@/types/note";
import type { User } from "@supabase/supabase-js";

/**
 * 책의 기록 목록 조회 (공유용)
 * 공개 기록 또는 본인 기록만 조회
 * @param bookId 책 ID (user_books.id 또는 books.id)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @returns 기록 목록 (books 정보 포함)
 */
export async function getBookNotesForShare(
  bookId: string,
  user?: User | null
): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      // 게스트 사용자는 공개 기록만 조회
      return getPublicNotesByBook(bookId, supabase);
    }
    currentUser = fetchedUser;
  }

  // bookId가 user_books.id인 경우 books.id로 변환
  let actualBookId = bookId;
  if (isValidUUID(bookId) && currentUser) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("book_id")
      .eq("id", bookId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (userBook) {
      actualBookId = userBook.book_id;
    }
  }

  // 기록 조회: 공개 기록 또는 본인 기록
  const { data: notes, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        publisher,
        cover_image_url
      )
    `
    )
    .eq("book_id", actualBookId)
    .or(`is_public.eq.true,user_id.eq.${currentUser.id}`)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (notes || []) as unknown as NoteWithBook[];
}

/**
 * 공개 기록만 조회 (게스트용)
 */
async function getPublicNotesByBook(
  bookId: string,
  supabase: any
): Promise<NoteWithBook[]> {
  const { data: notes, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        publisher,
        cover_image_url
      )
    `
    )
    .eq("book_id", bookId)
    .eq("is_public", true)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (notes || []) as unknown as NoteWithBook[];
}

/**
 * 공유 가능한 기록 검증
 * @param noteIds 기록 ID 배열
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @returns 검증된 기록 ID 배열
 */
export async function validateNotesForShare(
  noteIds: string[],
  user?: User | null
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      // 게스트 사용자는 공개 기록만 검증
      const { data: publicNotes } = await supabase
        .from("notes")
        .select("id")
        .in("id", noteIds)
        .eq("is_public", true);

      return (publicNotes || []).map((note) => note.id);
    }
    currentUser = fetchedUser;
  }

  // 기록 검증: 공개 기록 또는 본인 기록
  const { data: validNotes, error } = await supabase
    .from("notes")
    .select("id")
    .in("id", noteIds)
    .or(`is_public.eq.true,user_id.eq.${currentUser.id}`);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (validNotes || []).map((note) => note.id);
}

/**
 * 여러 기록 조회 (공유용)
 * @param noteIds 기록 ID 배열
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @returns 기록 목록 (books 정보 포함)
 */
export async function getNotesForShare(
  noteIds: string[],
  user?: User | null
): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      // 게스트 사용자는 공개 기록만 조회
      const { data: notes, error } = await supabase
        .from("notes")
        .select(
          `
          *,
          books (
            id,
            title,
            author,
            publisher,
            cover_image_url
          )
        `
        )
        .in("id", noteIds)
        .eq("is_public", true)
        .order("page_number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(sanitizeErrorMessage(error));
      }

      return (notes || []) as unknown as NoteWithBook[];
    }
    currentUser = fetchedUser;
  }

  // 기록 조회: 공개 기록 또는 본인 기록
  const { data: notes, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        publisher,
        cover_image_url
      )
    `
    )
    .in("id", noteIds)
    .or(`is_public.eq.true,user_id.eq.${currentUser.id}`)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (notes || []) as unknown as NoteWithBook[];
}

