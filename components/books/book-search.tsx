"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { addBook } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SearchResult {
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  published_date: string | null;
  cover_image_url: string | null;
}

interface BookSearchProps {
  onBookAdded?: () => void;
}

/**
 * 책 검색 컴포넌트
 * 네이버 API를 통해 책을 검색하고 추가할 수 있습니다.
 */
export function BookSearch({ onBookAdded }: BookSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // 디바운싱을 위한 검색 함수
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/books/search?query=${encodeURIComponent(searchQuery)}&display=10`
      );

      if (!response.ok) {
        throw new Error("검색에 실패했습니다.");
      }

      const data = await response.json();
      setResults(data.books || []);
    } catch (error) {
      console.error("책 검색 오류:", error);
      toast.error("책 검색에 실패했습니다.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 디바운싱 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleAddBook = async (book: SearchResult) => {
    setIsAdding(book.isbn || book.title);
    try {
      await addBook(book, "reading");
      toast.success("책이 추가되었습니다!");
      setQuery("");
      setResults([]);
      onBookAdded?.();
      router.refresh();
    } catch (error) {
      console.error("책 추가 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "책 추가에 실패했습니다."
      );
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="책 제목이나 저자를 검색하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((book, index) => (
            <Card key={index} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-16 h-20 shrink-0 overflow-hidden rounded bg-muted">
                    <Image
                      src={getImageUrl(book.cover_image_url)}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                    {book.author && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {book.author}
                      </p>
                    )}
                    {book.publisher && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.publisher}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddBook(book)}
                    disabled={isAdding === (book.isbn || book.title)}
                  >
                    {isAdding === (book.isbn || book.title) ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        추가 중...
                      </>
                    ) : (
                      "추가"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query && !isSearching && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}

