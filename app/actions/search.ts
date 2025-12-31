"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeSearchQuery, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

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
 * @param params 검색 파라미터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function searchNotes(params: SearchParams, user?: User | null): Promise<SearchResults> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 검색어 필터 (한글 지원을 위해 ILIKE 사용)
  // review_issues.md Issue 6 참고: 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
  const sanitizedQuery = sanitizeSearchQuery(params.query || "");
  
  // bookId 변환과 books 검색을 병렬로 시작
  const [userBookResult, matchingBooksResult] = await Promise.all([
    // bookId가 user_books.id인 경우, books.id를 조회
    params.bookId
      ? supabase
          .from("user_books")
          .select("book_id")
          .eq("id", params.bookId)
          .eq("user_id", currentUser.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // 검색어가 있으면 사용자가 소유한 책(user_books) 중에서 title, author로 검색
    sanitizedQuery
      ? supabase
          .from("user_books")
          .select(`
            book_id,
            books!inner (
              id,
              title,
              author
            )
          `)
          .eq("user_id", currentUser.id)
          .or(`books.title.ilike.%${sanitizedQuery}%,books.author.ilike.%${sanitizedQuery}%`)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // userBook 결과에 따라 bookId 설정
  let actualBookId = params.bookId;
  if (userBookResult.data) {
    actualBookId = userBookResult.data.book_id;
  }

  // matchingBookIds 추출 (사용자가 소유한 책만)
  let matchingBookIds: string[] = [];
  if (matchingBooksResult.data) {
    matchingBookIds = matchingBooksResult.data
      .map((item: any) => item.book_id || item.books?.id)
      .filter((id: string | undefined): id is string => !!id);
  }

  // notes 쿼리 구성
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
    .eq("user_id", currentUser.id);

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

