import { NextRequest, NextResponse } from "next/server";
import {
  isValidUUID,
  isValidPage,
  isValidDate,
  isValidTags,
  sanitizeErrorMessage,
  sanitizeErrorForLogging,
} from "@/lib/utils/validation";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { searchNotes, type SearchParams } from "@/app/actions/search";

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
    // URL의 searchParams를 urlSearchParams로 명명하여 변수명 충돌 방지
    const { searchParams: urlSearchParams } = new URL(request.url);
    const query = urlSearchParams.get("q") || "";
    const bookId = urlSearchParams.get("bookId");
    const startDate = urlSearchParams.get("startDate");
    const endDate = urlSearchParams.get("endDate");
    const tags = urlSearchParams.get("tags");
    const types = urlSearchParams.get("types");
    const pageParam = urlSearchParams.get("page") || "1";
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
    let tagArray: string[] | undefined;
    if (tags) {
      tagArray = tags.split(",").map((t) => t.trim()).filter(t => t.length > 0);
      if (!isValidTags(tagArray)) {
        return NextResponse.json(
          { error: "태그는 최대 10개까지, 각 태그는 50자 이하여야 합니다." },
          { status: 400 }
        );
      }
    }

    // 유형 배열 파싱
    let typeArray: string[] | undefined;
    if (types) {
      typeArray = types.split(",").map((t) => t.trim());
    }

    // 검색 파라미터 구성
    const searchParams: SearchParams = {
      query: query || undefined,
      bookId: bookId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      tags: tagArray,
      types: typeArray,
      page,
    };

    // 검색 실행
    const results = await searchNotes(searchParams);

    return NextResponse.json(results);
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

