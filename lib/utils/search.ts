/**
 * 검색 관련 유틸리티 함수
 */

/**
 * 검색어를 하이라이트 처리
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이트된 HTML 문자열
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;

  // 검색어를 이스케이프하여 특수 문자 처리
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  // 대소문자 구분 없이 검색
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  
  // 검색어를 하이라이트 처리
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>'
  );
}

/**
 * 검색어를 단어 단위로 분리
 * @param query 검색어
 * @returns 단어 배열
 */
export function splitSearchQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

