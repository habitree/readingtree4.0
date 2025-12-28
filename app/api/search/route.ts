import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isValidUUID,
  isValidPage,
  isValidDate,
  isValidTags,
  sanitizeSearchQuery,
  sanitizeErrorMessage,
  sanitizeErrorForLogging,
} from "@/lib/utils/validation";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

const ITEMS_PER_PAGE = 20;

/**
 * 검색 API
 * Full-text Search 및 필터 기능 제공
 * 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
 */
export async function GET(request: NextRequest) {
  // Rate limiting 체크 (분당 100회 제한)
  const rateLimitResult = await checkRateLimit(request, 100);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const bookId = searchParams.get("bookId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tags = searchParams.get("tags");
    const types = searchParams.get("types");
    const pageParam = searchParams.get("page") || "1";
    const page = parseInt(pageParam, 10);

    // 페이지 번호 검증
    if (!isValidPage(page)) {
      return NextResponse.json(
        { error: "유효하지 않은 페이지 번호입니다." },
        { status: 400 }
      );
    }

    // bookId UUID 검증
    if (bookId && !isValidUUID(bookId)) {
      return NextResponse.json(
        { error: "유효하지 않은 책 ID입니다." },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json(
        { error: "유효하지 않은 시작 날짜 형식입니다." },
        { status: 400 }
      );
    }
    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        { error: "유효하지 않은 종료 날짜 형식입니다." },
        { status: 400 }
      );
    }

    // 태그 배열 검증
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim()).filter(t => t.length > 0);
      if (!isValidTags(tagArray)) {
        return NextResponse.json(
          { error: "태그는 최대 10개까지, 각 태그는 50자 이하여야 합니다." },
          { status: 400 }
        );
      }
    }

    // bookId가 user_books.id인 경우, books.id를 조회해야 함
    let actualBookId = bookId;
    if (bookId && isValidUUID(bookId)) {
      const { data: userBook, error: userBookError } = await supabase
        .from("user_books")
        .select("book_id")
        .eq("id", bookId)
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
    const sanitizedQuery = sanitizeSearchQuery(query);
    
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
    if (startDate) {
      supabaseQuery = supabaseQuery.gte("created_at", startDate);
    }
    if (endDate) {
      // 종료일은 하루 끝까지 포함
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      supabaseQuery = supabaseQuery.lte("created_at", endDateTime.toISOString());
    }

    // 태그 필터
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      supabaseQuery = supabaseQuery.contains("tags", tagArray);
    }

    // 유형 필터
    if (types) {
      const typeArray = types.split(",").map((t) => t.trim());
      supabaseQuery = supabaseQuery.in("type", typeArray);
    }

    // 페이지네이션
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
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

    return NextResponse.json({
      results: data || [],
      total: count || 0,
      page,
      totalPages,
      itemsPerPage: ITEMS_PER_PAGE,
    });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("검색 API 오류:", safeError);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

