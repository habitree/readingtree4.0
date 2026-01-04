"use client";

import { renderBookLinks } from "@/lib/utils/book-link";

interface BookLinkRendererProps {
  text: string;
  className?: string;
}

/**
 * 책 링크를 렌더링하는 클라이언트 컴포넌트
 * 서버 컴포넌트에서 사용할 수 있도록 분리
 */
export function BookLinkRenderer({ text, className }: BookLinkRendererProps) {
  return <span className={className}>{renderBookLinks(text)}</span>;
}

