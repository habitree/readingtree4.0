"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeSearchQuery, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { Database } from "@/types/database";

const ITEMS_PER_PAGE = 20;

export interface SearchParams {
  query?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  types?: string[];
  page?: number;
}

export interface SearchResults {
  results: Database["public"]["Tables"]["notes"]["Row"][];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

/**
 * 기록 검색
 * Full-text Search 및 필터 기능 제공
 * 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
 */
export async function searchNotes(params: SearchParams): Promise<SearchResults> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // bookId가 user_books.id인 경우, books.id를 조회해야 함
  let actualBookId = params.bookId;
  if (params.bookId) {
    const { data: userBook, error: userBookError } = await supabase
      .from("user_books")
      .select("book_id")
      .eq("id", params.bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userBookError && userBook) {
      // user_books.id를 받았으므로 books.id로 변환
      actualBookId = userBook.book_id;
    }
    // userBook이 없으면 bookId가 이미 books.id일 수 있으므로 그대로 사용
  }

  // 검색어 필터 (한글 지원을 위해 ILIKE 사용)
  // review_issues.md Issue 6 참고: 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
  const sanitizedQuery = sanitizeSearchQuery(params.query || "");
  
  // 검색어가 있으면 books 테이블에서 title, author로 검색하여 book_id 목록 얻기
  let matchingBookIds: string[] = [];
  if (sanitizedQuery) {
    // books 테이블에서 title 또는 author로 검색
    const { data: matchingBooks } = await supabase
      .from("books")
      .select("id")
      .or(`title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%`);
    
    if (matchingBooks) {
      matchingBookIds = matchingBooks.map((book) => book.id);
    }
  }

  // 기본 쿼리 구성
  let supabaseQuery = supabase
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
    `,
      { count: "exact" }
    )
    .eq("user_id", user.id);

  // 검색어 필터 적용
  if (sanitizedQuery) {
    // notes.content에서 검색하거나, books.title/author로 검색된 book_id를 가진 notes 검색
    if (matchingBookIds.length > 0) {
      // content에서 검색하거나 matchingBookIds에 포함된 book_id를 가진 notes
      supabaseQuery = supabaseQuery.or(
        `content.ilike.%${sanitizedQuery}%,book_id.in.(${matchingBookIds.join(",")})`
      );
    } else {
      // content에서만 검색 (books에서 매칭된 것이 없을 때)
      supabaseQuery = supabaseQuery.ilike("content", `%${sanitizedQuery}%`);
    }
  }

  // 책 필터
  if (actualBookId) {
    supabaseQuery = supabaseQuery.eq("book_id", actualBookId);
  }

  // 날짜 필터
  if (params.startDate) {
    supabaseQuery = supabaseQuery.gte("created_at", params.startDate);
  }
  if (params.endDate) {
    // 종료일은 하루 끝까지 포함
    const endDateTime = new Date(params.endDate);
    endDateTime.setHours(23, 59, 59, 999);
    supabaseQuery = supabaseQuery.lte("created_at", endDateTime.toISOString());
  }

  // 태그 필터
  if (params.tags && params.tags.length > 0) {
    supabaseQuery = supabaseQuery.contains("tags", params.tags);
  }

  // 유형 필터
  if (params.types && params.types.length > 0) {
    supabaseQuery = supabaseQuery.in("type", params.types);
  }

  // 페이지네이션
  const page = params.page || 1;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  supabaseQuery = supabaseQuery.range(from, to);

  // 정렬: 페이지 번호 순, 그 다음 생성일 순
  supabaseQuery = supabaseQuery
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data, error, count } = await supabaseQuery;

  if (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("검색 오류:", safeError);
    throw new Error(sanitizeErrorMessage(error));
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  return {
    results: (data || []) as Database["public"]["Tables"]["notes"]["Row"][],
    total: count || 0,
    page,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

