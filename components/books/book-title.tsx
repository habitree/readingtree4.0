"use client";

import { parseBookTitle } from "@/lib/utils/book";
import { cn } from "@/lib/utils";

interface BookTitleProps {
  title: string;
  className?: string;
  mainTitleClassName?: string;
  subtitleClassName?: string;
}

/**
 * 책 제목 컴포넌트
 * 괄호가 포함된 경우 부제목으로 분리하여 표시
 */
export function BookTitle({ 
  title, 
  className,
  mainTitleClassName,
  subtitleClassName 
}: BookTitleProps) {
  const { mainTitle, subtitle } = parseBookTitle(title);

  if (!subtitle) {
    return (
      <span className={className}>
        {mainTitle}
      </span>
    );
  }

  return (
    <span className={cn("block", className)}>
      <span className={mainTitleClassName}>{mainTitle}</span>
      <span className={cn("block text-xs text-muted-foreground mt-0.5", subtitleClassName)}>
        {subtitle}
      </span>
    </span>
  );
}
