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

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    const display = parseInt(searchParams.get("display") || "10", 10);
    const start = parseInt(searchParams.get("start") || "1", 10);

    const response = await searchBooks({ query, display, start });

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

