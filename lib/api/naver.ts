/**
 * 네이버 검색 API 클라이언트
 * 책 검색 기능 제공
 */

export interface NaverBookItem {
  title: string;
  link: string;
  image: string;
  author: string;
  price: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}

export interface NaverBookSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverBookItem[];
}

export interface BookSearchParams {
  query: string;
  display?: number;
  start?: number;
}

/**
 * 네이버 검색 API로 책 검색
 * @param params 검색 파라미터
 * @returns 검색 결과
 */
export async function searchBooks(
  params: BookSearchParams
): Promise<NaverBookSearchResponse> {
  const { query, display = 10, start = 1 } = params;

  // 검색어 유효성 검사
  if (!query || query.trim().length === 0) {
    throw new Error("검색어를 입력해주세요.");
  }

  // 환경 변수 확인
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("네이버 API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  const url = new URL("https://openapi.naver.com/v1/search/book.json");
  url.searchParams.append("query", query);
  url.searchParams.append("display", display.toString());
  url.searchParams.append("start", start.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 3600 }, // 1시간 캐시
  });

  if (!response.ok) {
    let errorMessage = `네이버 API 호출 실패: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.errorMessage || errorMessage;
    } catch {
      // JSON 파싱 실패 시 텍스트로 처리
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // 응답 형식 검증
  if (!data || typeof data !== "object") {
    throw new Error("네이버 API 응답 형식이 올바르지 않습니다.");
  }

  // items 배열이 없으면 빈 배열로 초기화
  if (!Array.isArray(data.items)) {
    data.items = [];
  }

  return data;
}

/**
 * 네이버 API 응답을 앱 내부 형식으로 변환
 * @param item 네이버 API에서 반환된 책 정보
 * @returns 앱 내부 형식의 책 정보
 */
export function transformNaverBookItem(item: NaverBookItem) {
  // ISBN 정규화 (하이픈 제거, 공백 제거)
  const normalizedIsbn = item.isbn
    ? item.isbn.replace(/[-\s]/g, "").trim() || null
    : null;

  return {
    isbn: normalizedIsbn,
    title: item.title ? item.title.replace(/<[^>]*>/g, "").trim() : "", // HTML 태그 제거 및 공백 제거
    author: item.author ? item.author.trim() : null,
    publisher: item.publisher ? item.publisher.trim() : null,
    published_date: item.pubdate ? formatNaverDate(item.pubdate) : null,
    cover_image_url: item.image ? item.image.trim() : null,
  };
}

/**
 * 네이버 API 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
 */
function formatNaverDate(dateStr: string): string | null {
  if (!dateStr || dateStr.length !== 8) return null;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

