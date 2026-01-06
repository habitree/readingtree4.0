"use client";

import { parseBookLinkParts } from "@/lib/utils/book-link";
import { cn } from "@/lib/utils";

interface BookLinkInputRendererProps {
  text: string;
  className?: string;
}

/**
 * 입력 필드에서 책 링크를 시각적으로 표시하는 컴포넌트
 * 링크 부분을 다른 색상으로 표시하여 링크임을 인지할 수 있게 함
 * 
 * 주의: 이 컴포넌트는 Input 필드 위에 오버레이로 사용되며,
 * 실제 입력은 투명한 Input 필드를 통해 이루어집니다.
 */
export function BookLinkInputRenderer({ text, className }: BookLinkInputRendererProps) {
  const parts = parseBookLinkParts(text);

  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) => {
        if (part.type === "link") {
          return (
            <span
              key={`book-link-${index}`}
              className="text-muted-foreground/70 font-medium"
            >
              {part.content}
            </span>
          );
        }
        return (
          <span key={`text-${index}`} className="text-foreground">
            {part.content}
          </span>
        );
      })}
    </span>
  );
}

