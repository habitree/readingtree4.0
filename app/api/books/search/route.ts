import { NextResponse } from "next/server";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";

/**
 * 책 검색 API Route
 * 네이버 검색 API를 통해 책을 검색합니다.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    // 검색어 유효성 검사
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    // 검색어 최소 길이 검사 (너무 짧은 검색어 방지)
    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "검색어는 최소 2자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    // 검색어 최대 길이 검사 (너무 긴 검색어 방지)
    if (query.trim().length > 100) {
      return NextResponse.json(
        { error: "검색어는 100자 이하로 입력해주세요." },
        { status: 400 }
      );
    }

    // display와 start 파라미터 유효성 검사
    const display = Math.min(
      Math.max(parseInt(searchParams.get("display") || "10", 10), 1),
      100
    ); // 1-100 사이로 제한
    const start = Math.max(parseInt(searchParams.get("start") || "1", 10), 1); // 최소 1

    const response = await searchBooks({ query: query.trim(), display, start });

    // 네이버 API 응답 검증
    if (!response || !Array.isArray(response.items)) {
      throw new Error("네이버 API 응답 형식이 올바르지 않습니다.");
    }

    // 네이버 API 응답을 앱 내부 형식으로 변환
    const books = response.items.map(transformNaverBookItem);

    return NextResponse.json({
      total: response.total,
      start: response.start,
      display: response.display,
      books,
    });
  } catch (error) {
    console.error("책 검색 API 오류:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "책 검색에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

