"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { NoteType } from "@/types/note";
import { getUserBooks } from "@/app/actions/books";

interface SearchFiltersProps {
  onBooksLoaded?: (books: Array<{ id: string; books: { title: string } }>) => void;
}

/**
 * 검색 필터 컴포넌트
 * 책 제목, 날짜, 태그, 유형 필터 제공
 */
export function SearchFilters({ onBooksLoaded }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Array<{ id: string; books: { title: string } }>>([]);

  const bookId = searchParams.get("bookId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const tags = searchParams.get("tags") || "";
  const types = searchParams.get("types") || "";

  useEffect(() => {
    // 책 목록 로드
    getUserBooks()
      .then((data) => {
        setBooks(data as any);
        onBooksLoaded?.(data as any);
      })
      .catch((error) => {
        console.error("책 목록 로드 오류:", error);
      });
  }, [onBooksLoaded]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // 필터 변경 시 첫 페이지로
    router.push(`/search?${params.toString()}`);
  };

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 책 제목 필터 */}
      <div className="space-y-2">
        <Label>책 제목</Label>
        <Select value={bookId} onValueChange={(value) => updateFilter("bookId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            {books.map((userBook) => {
              const book = (userBook as any).books;
              return (
                <SelectItem key={userBook.id} value={userBook.id}>
                  {book?.title || "제목 없음"}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {bookId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter("bookId")}
            className="h-6 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            필터 제거
          </Button>
        )}
      </div>

      {/* 날짜 필터 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>시작일</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>종료일</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>
      </div>
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearFilter("startDate");
            clearFilter("endDate");
          }}
          className="h-6 px-2"
        >
          <X className="h-3 w-3 mr-1" />
          날짜 필터 제거
        </Button>
      )}

      {/* 유형 필터 */}
      <div className="space-y-2">
        <Label>기록 유형</Label>
        <Select value={types} onValueChange={(value) => updateFilter("types", value)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="quote">필사</SelectItem>
            <SelectItem value="transcription">필사 이미지</SelectItem>
            <SelectItem value="photo">사진</SelectItem>
            <SelectItem value="memo">메모</SelectItem>
          </SelectContent>
        </Select>
        {types && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter("types")}
            className="h-6 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            필터 제거
          </Button>
        )}
      </div>

      {/* 태그 필터 */}
      <div className="space-y-2">
        <Label>태그 (쉼표로 구분)</Label>
        <Input
          type="text"
          value={tags}
          onChange={(e) => updateFilter("tags", e.target.value)}
          placeholder="예: 인상깊은, 명언"
        />
        {tags && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter("tags")}
            className="h-6 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            필터 제거
          </Button>
        )}
      </div>
    </div>
  );
}
