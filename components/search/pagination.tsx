"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * 페이지네이션 컴포넌트
 */
export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPage(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav 
      className="flex items-center justify-center gap-2"
      aria-label="페이지 네비게이션"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="flex items-center gap-1" role="list">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          const isCurrentPage = currentPage === pageNum;

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNum)}
              onKeyDown={(e) => handleKeyDown(e, pageNum)}
              aria-label={`페이지 ${pageNum}로 이동`}
              aria-current={isCurrentPage ? "page" : undefined}
              aria-pressed={isCurrentPage}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

