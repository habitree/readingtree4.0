/**
 * 책 링크 파싱 및 렌더링 유틸리티
 */

/**
 * 텍스트에서 책 링크를 파싱
 * 형식: [책 제목](@book:userBookId)
 */
export interface BookLink {
  text: string;
  userBookId: string;
  startIndex: number;
  endIndex: number;
}

export function parseBookLinks(text: string): BookLink[] {
  const links: BookLink[] = [];
  const regex = /\[([^\]]+)\]\(@book:([^)]+)\)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    links.push({
      text: match[1], // 책 제목
      userBookId: match[2], // user_books.id
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return links;
}

/**
 * 텍스트를 링크 정보가 포함된 파트 배열로 변환
 * 렌더링은 BookLinkRenderer 컴포넌트에서 수행
 */
export interface BookLinkPart {
  type: "text" | "link";
  content: string;
  userBookId?: string;
}

export function parseBookLinkParts(text: string): BookLinkPart[] {
  const links = parseBookLinks(text);
  if (links.length === 0) {
    return [{ type: "text", content: text }];
  }

  const parts: BookLinkPart[] = [];
  let lastIndex = 0;

  links.forEach((link) => {
    // 링크 이전 텍스트
    if (link.startIndex > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, link.startIndex),
      });
    }

    // 링크
    parts.push({
      type: "link",
      content: link.text,
      userBookId: link.userBookId,
    });

    lastIndex = link.endIndex;
  });

  // 마지막 링크 이후 텍스트
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return parts;
}

/**
 * 마크다운 링크 형식을 책 제목만으로 변환
 * [책 제목](@book:userBookId) -> 책 제목
 * 입력 필드에 표시할 때 사용
 */
export function convertBookLinksToDisplayText(text: string): string {
  return text.replace(/\[([^\]]+)\]\(@book:[^)]+\)/g, '$1');
}

