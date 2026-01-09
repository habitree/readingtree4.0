"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Bookshelf,
  BookshelfWithStats,
  CreateBookshelfInput,
  UpdateBookshelfInput,
} from "@/types/bookshelf";

/**
 * 사용자의 모든 서재 목록 조회
 */
export async function getBookshelves(): Promise<Bookshelf[]> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", user.id)
    .order("is_main", { ascending: false })
    .order("order", { ascending: true });

  if (error) {
    throw new Error(`서재 목록 조회 실패: ${error.message}`);
  }

  return (data || []) as unknown as Bookshelf[];
}

/**
 * 사용자의 메인 서재 조회
 */
export async function getMainBookshelf(): Promise<Bookshelf | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (error) {
    throw new Error(`메인 서재 조회 실패: ${error.message}`);
  }

  return (data as Bookshelf) || null;
}

/**
 * 서재 상세 조회 (통계 포함)
 */
export async function getBookshelfWithStats(
  bookshelfId: string
): Promise<BookshelfWithStats | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 서재 정보 조회
  const { data: bookshelf, error: bookshelfError } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookshelfError) {
    throw new Error(`서재 조회 실패: ${bookshelfError.message}`);
  }

  if (!bookshelf) {
    return null;
  }

  // 서재별 책 통계 조회
  const { data: stats, error: statsError } = await supabase
    .from("user_books")
    .select("status")
    .eq("bookshelf_id", bookshelfId);

  if (statsError) {
    throw new Error(`통계 조회 실패: ${statsError.message}`);
  }

  const bookCount = stats?.length || 0;
  const readingCount = stats?.filter((s) => s.status === "reading").length || 0;
  const completedCount =
    stats?.filter((s) => s.status === "completed").length || 0;
  const pausedCount = stats?.filter((s) => s.status === "paused").length || 0;
  const notStartedCount =
    stats?.filter((s) => s.status === "not_started").length || 0;
  const rereadingCount =
    stats?.filter((s) => s.status === "rereading").length || 0;

  return {
    ...(bookshelf as Bookshelf),
    book_count: bookCount,
    reading_count: readingCount,
    completed_count: completedCount,
    paused_count: pausedCount,
    not_started_count: notStartedCount,
    rereading_count: rereadingCount,
  };
}

/**
 * 새 서재 생성
 */
export async function createBookshelf(
  input: CreateBookshelfInput
): Promise<Bookshelf> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 사용자의 최대 order 값 조회
  const { data: maxOrderData } = await supabase
    .from("bookshelves")
    .select("order")
    .eq("user_id", user.id)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrderData?.order !== undefined ? maxOrderData.order + 1 : 0;

  const { data, error } = await supabase
    .from("bookshelves")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      order: input.order !== undefined ? input.order : nextOrder,
      is_public: input.is_public || false,
      is_main: false, // 메인 서재는 자동 생성만 가능
    })
    .select()
    .single();

  if (error) {
    throw new Error(`서재 생성 실패: ${error.message}`);
  }

  revalidatePath("/bookshelves");
  revalidatePath("/books");

  return data as unknown as Bookshelf;
}

/**
 * 서재 정보 수정
 */
export async function updateBookshelf(
  bookshelfId: string,
  input: UpdateBookshelfInput
): Promise<Bookshelf> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 서재 소유권 확인
  const { data: existing } = await supabase
    .from("bookshelves")
    .select("id, is_main")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  // 메인 서재는 is_main을 변경할 수 없음
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.order !== undefined) updateData.order = input.order;
  if (input.is_public !== undefined) updateData.is_public = input.is_public;

  const { data, error } = await supabase
    .from("bookshelves")
    .update(updateData)
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`서재 수정 실패: ${error.message}`);
  }

  revalidatePath("/bookshelves");
  revalidatePath(`/bookshelves/${bookshelfId}`);
  revalidatePath("/books");

  return data as unknown as Bookshelf;
}

/**
 * 서재 삭제
 */
export async function deleteBookshelf(bookshelfId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 서재 소유권 및 메인 서재 여부 확인
  const { data: existing } = await supabase
    .from("bookshelves")
    .select("id, is_main")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  if (existing.is_main) {
    throw new Error("메인 서재는 삭제할 수 없습니다.");
  }

  // 메인 서재 조회
  const { data: mainBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (!mainBookshelf) {
    throw new Error("메인 서재를 찾을 수 없습니다.");
  }

  // 삭제할 서재의 모든 책을 메인 서재로 이동
  const { error: moveError } = await supabase
    .from("user_books")
    .update({ bookshelf_id: mainBookshelf.id })
    .eq("bookshelf_id", bookshelfId);

  if (moveError) {
    throw new Error(`책 이동 실패: ${moveError.message}`);
  }

  // 서재 삭제
  const { error: deleteError } = await supabase
    .from("bookshelves")
    .delete()
    .eq("id", bookshelfId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`서재 삭제 실패: ${deleteError.message}`);
  }

  revalidatePath("/bookshelves");
  revalidatePath("/books");
}

/**
 * 책을 다른 서재로 이동
 */
export async function moveBookToBookshelf(
  userBookId: string,
  targetBookshelfId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 책 소유권 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userBook) {
    throw new Error("책을 찾을 수 없거나 권한이 없습니다.");
  }

  // 대상 서재 소유권 확인
  const { data: targetBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("id", targetBookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!targetBookshelf) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  // 책 이동
  const { error } = await supabase
    .from("user_books")
    .update({ bookshelf_id: targetBookshelfId })
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`책 이동 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/bookshelves/${targetBookshelfId}`);
}
