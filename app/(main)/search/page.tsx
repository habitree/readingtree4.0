"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Pagination } from "@/components/search/pagination";
import { useSearch } from "@/hooks/use-search";
import { Loader2 } from "lucide-react";

/**
 * 검색 페이지
 * US-019~US-023: 검색 기능
 */
export default function SearchPage() {
  const searchParams = useSearchParams();
  const { search, isLoading, error } = useSearch();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [totalPages, setTotalPages] = useState(0);

  // 검색 실행 함수 (디바운싱)
  const performSearch = useCallback(async () => {
    if (!query.trim() && !searchParams.get("bookId") && !searchParams.get("tags") && !searchParams.get("types")) {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query);
      if (searchParams.get("bookId")) params.set("bookId", searchParams.get("bookId")!);
      if (searchParams.get("startDate")) params.set("startDate", searchParams.get("startDate")!);
      if (searchParams.get("endDate")) params.set("endDate", searchParams.get("endDate")!);
      if (searchParams.get("tags")) params.set("tags", searchParams.get("tags")!);
      if (searchParams.get("types")) params.set("types", searchParams.get("types")!);
      params.set("page", currentPage.toString());

      const data = await search(params);
      setResults(data.results);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("검색 오류:", err);
    }
  }, [query, searchParams, currentPage, search]);

  // URL 파라미터 변경 시 검색 실행
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    setCurrentPage(page);
  }, [searchParams]);

  // 검색어 또는 필터 변경 시 검색 실행 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [performSearch]);

  // 초기 검색어 설정
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">검색</h1>
        <p className="text-muted-foreground">
          저장한 모든 기록을 검색하세요
        </p>
      </div>

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="검색어를 입력하세요..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 필터 사이드바 */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <h2 className="text-lg font-semibold mb-4">필터</h2>
            <SearchFilters />
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="lg:col-span-3 space-y-4">
          {error && (
            <div className="text-center py-8 text-destructive">
              <p>검색 중 오류가 발생했습니다: {error.message}</p>
            </div>
          )}

          {!error && (
            <>
              {total > 0 && (
                <p className="text-sm text-muted-foreground">
                  총 {total}개의 결과를 찾았습니다.
                </p>
              )}

              <SearchResults
                results={results}
                searchQuery={query}
                isLoading={isLoading}
              />

              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

