"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { NoteType } from "@/types/note";
import { getUserBooks } from "@/app/actions/books";
import { getUserTags } from "@/app/actions/notes";

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
  const [userTags, setUserTags] = useState<string[]>([]);

  const bookId = searchParams.get("bookId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const tagsParam = searchParams.get("tags") || "";
  const types = searchParams.get("types") || "";

  // 선택된 태그 배열
  const selectedTags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    // 책 목록 및 태그 목록 로드
    Promise.all([
      getUserBooks(),
      getUserTags(),
    ])
      .then(([booksData, tagsData]) => {
        setBooks(booksData as any);
        onBooksLoaded?.(booksData as any);
        setUserTags(tagsData);
      })
      .catch((error) => {
        console.error("데이터 로드 오류:", error);
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

  // 태그 선택/해제
  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTags = selectedTags;
    
    if (currentTags.includes(tag)) {
      // 태그 제거
      const newTags = currentTags.filter((t) => t !== tag);
      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }
    } else {
      // 태그 추가
      const newTags = [...currentTags, tag];
      params.set("tags", newTags.join(","));
    }
    
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };


  return (
    <div className="space-y-4">
      {/* 책 제목 필터 */}
      <div className="space-y-2">
        <Label>책 제목</Label>
        <Select value={bookId || "all"} onValueChange={(value) => updateFilter("bookId", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
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
        <Select 
          value={
            // types에 quote나 transcription이 포함되어 있으면 "transcription"으로 표시
            !types || types === "all" 
              ? "all" 
              : types.includes("quote") || types.includes("transcription")
              ? "transcription"
              : types
          }
          onValueChange={(value) => {
            // "필사" 선택 시 quote와 transcription 둘 다 검색하도록 처리
            if (value === "transcription") {
              updateFilter("types", "quote,transcription");
            } else {
              updateFilter("types", value === "all" ? "" : value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="transcription">필사</SelectItem>
            <SelectItem value="photo">사진</SelectItem>
            <SelectItem value="memo">기록</SelectItem>
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
        <Label>태그</Label>
        {userTags.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {userTags.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Badge
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">선택된 태그:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pr-1 flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag);
                        }}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                        aria-label={`${tag} 태그 제거`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("tags")}
                  className="h-6 px-2 mt-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  모든 태그 제거
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">저장된 태그가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
