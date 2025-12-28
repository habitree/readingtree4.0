"use client";

import { useState, useCallback } from "react";
import type { NoteWithBook } from "@/types/note";

export interface SearchParams {
  q?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string;
  types?: string;
  page?: string;
}

export interface SearchResults {
  results: NoteWithBook[];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

/**
 * 검색 관련 커스텀 훅
 * 검색 기능 제공
 */
export function useSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (params: URLSearchParams | SearchParams): Promise<SearchResults> => {
    setIsLoading(true);
    setError(null);

    try {
      // URLSearchParams를 문자열로 변환
      const queryString =
        params instanceof URLSearchParams
          ? params.toString()
          : new URLSearchParams(
              Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
            ).toString();

      // 재시도 로직이 포함된 fetch
      const { withRetry } = await import("@/lib/utils/retry");
      
      const data = await withRetry(
        async () => {
          const response = await fetch(`/api/search?${queryString}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "검색에 실패했습니다.");
          }

          return await response.json();
        },
        {
          maxRetries: 2,
          initialDelay: 500,
          retryableErrors: (error) => {
            const message = error.message.toLowerCase();
            return (
              message.includes("network") ||
              message.includes("fetch") ||
              message.includes("timeout") ||
              message.includes("503") ||
              message.includes("502")
            );
          },
        }
      );

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("검색에 실패했습니다.");
      setError(error);
      console.error("검색 오류:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    search,
    isLoading,
    error,
  };
}

