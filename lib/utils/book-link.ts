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
 * 텍스트를 링크가 포함된 React 노드로 변환
 */
export function renderBookLinks(text: string): (string | JSX.Element)[] {
  const links = parseBookLinks(text);
  if (links.length === 0) {
    return [text];
  }

  const nodes: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  links.forEach((link, index) => {
    // 링크 이전 텍스트
    if (link.startIndex > lastIndex) {
      nodes.push(text.substring(lastIndex, link.startIndex));
    }

    // 링크
    nodes.push(
      <a
        key={`book-link-${index}`}
        href={`/books/${link.userBookId}`}
        className="text-primary hover:underline font-medium"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `/books/${link.userBookId}`;
        }}
      >
        {link.text}
      </a>
    );

    lastIndex = link.endIndex;
  });

  // 마지막 링크 이후 텍스트
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}

