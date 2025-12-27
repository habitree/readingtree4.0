import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ITEMS_PER_PAGE = 20;

/**
 * 검색 API
 * Full-text Search 및 필터 기능 제공
 * 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
 */
export async function GET(request: NextRequest) {
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
    const page = parseInt(searchParams.get("page") || "1", 10);

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

    // 검색어 필터 (한글 지원을 위해 ILIKE 사용)
    // review_issues.md Issue 6 참고: 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
    if (query.trim()) {
      // 검색어를 이스케이프하여 SQL 특수 문자 처리 (%와 _는 ILIKE에서 와일드카드)
      const escapedQuery = query.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
      
      // content 필드에서 검색 (ILIKE 패턴 매칭으로 한글 검색 지원)
      // PostgreSQL의 ILIKE는 대소문자 구분 없이 한글 검색을 지원함
      supabaseQuery = supabaseQuery.ilike("content", `%${escapedQuery}%`);
    }

    // 책 필터
    if (bookId) {
      supabaseQuery = supabaseQuery.eq("book_id", bookId);
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
      console.error("검색 오류:", error);
      return NextResponse.json(
        { error: `검색 실패: ${error.message}` },
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
    console.error("검색 API 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "검색에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

