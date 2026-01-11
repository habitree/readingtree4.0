"use client";

import { parseBookLinkParts } from "@/lib/utils/book-link";
import { useRouter } from "next/navigation";

interface BookLinkRendererProps {
  text: string;
  className?: string;
}

/**
 * 책 링크를 렌더링하는 클라이언트 컴포넌트
 * 서버 컴포넌트에서 사용할 수 있도록 분리
 */
export function BookLinkRenderer({ text, className }: BookLinkRendererProps) {
  const parts = parseBookLinkParts(text);
  const router = useRouter();

  const handleBookLinkClick = (e: React.MouseEvent, userBookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/books/${userBookId}`);
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "link" && part.userBookId) {
          return (
            <button
              key={`book-link-${index}`}
              onClick={(e) => handleBookLinkClick(e, part.userBookId!)}
              className="text-primary hover:underline font-medium underline decoration-primary/50 cursor-pointer"
            >
              {part.content}
            </button>
          );
        }
        return <span key={`text-${index}`}>{part.content}</span>;
      })}
    </span>
  );
}

