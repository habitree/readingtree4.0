"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReadingStatus } from "@/types/book";

export interface AddBookInput {
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  cover_image_url?: string | null;
}

/**
 * 책 추가
 * Books 테이블에 없으면 생성하고, UserBooks에 추가
 * ISBN이 있으면 기존 책을 재사용 (review_issues.md 5번 이슈 참고)
 */
export async function addBook(
  bookData: AddBookInput,
  status: ReadingStatus = "reading"
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  let bookId: string;

  // ISBN이 있고 기존 책이 있는지 확인
  if (bookData.isbn) {
    const { data: existingBook } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", bookData.isbn)
      .single();

    if (existingBook) {
      // 기존 책 재사용
      bookId = existingBook.id;
    } else {
      // 새 책 생성
      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          published_date: bookData.published_date,
          cover_image_url: bookData.cover_image_url,
        })
        .select("id")
        .single();

      if (insertError || !newBook) {
        throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
      }

      bookId = newBook.id;
    }
  } else {
    // ISBN이 없으면 새 책 생성
    const { data: newBook, error: insertError } = await supabase
      .from("books")
      .insert({
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        published_date: bookData.published_date,
        cover_image_url: bookData.cover_image_url,
      })
      .select("id")
      .single();

    if (insertError || !newBook) {
      throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
    }

    bookId = newBook.id;
  }

  // 사용자가 이미 이 책을 추가했는지 확인
  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();

  if (existingUserBook) {
    throw new Error("이미 추가된 책입니다.");
  }

  // UserBooks에 추가
  const { error: userBookError } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    status,
    started_at: new Date().toISOString(),
  });

  if (userBookError) {
    throw new Error(`책 추가 실패: ${userBookError.message}`);
  }

  revalidatePath("/books");
  revalidatePath("/");

  return { success: true, bookId };
}

/**
 * 독서 상태 변경
 * @param userBookId UserBooks 테이블의 ID
 * @param status 새로운 상태
 */
export async function updateBookStatus(
  userBookId: string,
  status: ReadingStatus
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 사용자의 책인지 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (!userBook) {
    throw new Error("권한이 없습니다.");
  }

  // 상태 변경 데이터 준비
  const updateData: {
    status: ReadingStatus;
    completed_at?: string | null;
  } = {
    status,
  };

  // 완독 시 completed_at 자동 기록
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else {
    // 완독이 아닌 상태로 변경 시 completed_at 초기화
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("id", userBookId);

  if (error) {
    throw new Error(`상태 변경 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 사용자 책 목록 조회
 * @param status 필터링할 상태 (선택)
 */
export async function getUserBooks(status?: ReadingStatus) {
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
    .from("user_books")
    .select(
      `
      *,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`책 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 책 상세 조회
 * @param userBookId UserBooks 테이블의 ID
 */
export async function getBookDetail(userBookId: string) {
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
    .from("user_books")
    .select(
      `
      *,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url
      )
    `
    )
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error(`책 상세 조회 실패: ${error?.message || "책을 찾을 수 없습니다."}`);
  }

  return data;
}

