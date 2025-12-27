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

  if (!query || query.trim().length === 0) {
    throw new Error("검색어를 입력해주세요.");
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("네이버 API 키가 설정되지 않았습니다.");
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
    const errorText = await response.text();
    throw new Error(`네이버 API 호출 실패: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 네이버 API 응답을 앱 내부 형식으로 변환
 */
export function transformNaverBookItem(item: NaverBookItem) {
  return {
    isbn: item.isbn || null,
    title: item.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
    author: item.author || null,
    publisher: item.publisher || null,
    published_date: item.pubdate ? formatNaverDate(item.pubdate) : null,
    cover_image_url: item.image || null,
  };
}

/**
 * 네이버 API 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
 */
function formatNaverDate(dateStr: string): string | null {
  if (!dateStr || dateStr.length !== 8) return null;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

