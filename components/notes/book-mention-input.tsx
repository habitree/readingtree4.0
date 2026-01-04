"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getUserBooks } from "@/app/actions/books";
import { BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { BookLinkInputRenderer } from "./book-link-input-renderer";

interface Book {
  id: string; // user_books.id
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  };
}

interface BookMentionInputProps extends React.ComponentProps<"input"> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * 책 링크 자동완성이 포함된 Input 컴포넌트
 * @ 입력 시 사용자가 등록한 책 목록에서 검색하고 링크로 변환
 */
export function BookMentionInput({
  value,
  onValueChange,
  className,
  ...props
}: BookMentionInputProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // 책 목록 로드
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const userBooks = await getUserBooks();
      setBooks(userBooks as Book[]);
    } catch (error) {
      console.error("책 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // @ 입력 감지 및 검색
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // @ 입력 감지
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // @ 이후의 텍스트 추출
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // 공백이 있으면 멘션 종료
      if (textAfterAt.includes(" ")) {
        setShowSuggestions(false);
        setMentionStart(null);
        setSearchQuery("");
      } else {
        // 검색어 추출
        const query = textAfterAt.toLowerCase();
        setMentionStart(lastAtIndex);
        setSearchQuery(query);
        
        // 책 검색
        const filtered = books.filter((book) => {
          const title = book.books.title.toLowerCase();
          const author = (book.books.author || "").toLowerCase();
          return title.includes(query) || author.includes(query);
        });
        
        setSuggestions(filtered.slice(0, 5)); // 최대 5개
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(null);
      setSearchQuery("");
    }

    onValueChange(newValue);
  };

  // 입력 필드 포커스 시 커서 위치 업데이트
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // 포커스 시 현재 커서 위치를 기준으로 @ 감지
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        const query = textAfterAt.toLowerCase();
        setMentionStart(lastAtIndex);
        setSearchQuery(query);
        
        const filtered = books.filter((book) => {
          const title = book.books.title.toLowerCase();
          const author = (book.books.author || "").toLowerCase();
          return title.includes(query) || author.includes(query);
        });
        
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      }
    }
  };

  // 책 선택 시 링크로 변환
  const handleBookSelect = (book: Book, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (mentionStart === null) {
      console.error("handleBookSelect: mentionStart가 null입니다");
      return;
    }

    if (!inputRef.current) {
      console.error("handleBookSelect: inputRef가 null입니다");
      return;
    }

    const currentValue = value;
    const cursorPosition = inputRef.current.selectionStart || currentValue.length;
    
    // @부터 커서 위치까지의 텍스트를 링크로 교체
    const textBefore = currentValue.substring(0, mentionStart);
    const textAfter = currentValue.substring(cursorPosition);
    
    // 링크 형식: [책 제목](@book:userBookId)
    const linkText = `[${book.books.title}](@book:${book.id})`;
    const newValue = textBefore + linkText + textAfter;
    
    onValueChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);
    setSearchQuery("");

    // 커서 위치 조정
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStart + linkText.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleBookSelect(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setMentionStart(null);
        setSearchQuery("");
      }
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={(e) => {
            // 포커스가 자동완성 목록으로 이동하는 경우를 고려하여 약간의 지연
            // relatedTarget이 suggestions 내부인지 확인
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (relatedTarget && suggestionsRef.current?.contains(relatedTarget)) {
              return; // suggestions로 포커스가 이동한 경우 무시
            }
            setTimeout(() => {
              if (!suggestionsRef.current?.contains(document.activeElement)) {
                setShowSuggestions(false);
              }
            }, 200);
          }}
          className={cn(className, "relative z-10")}
          style={value && value.includes('[@book:') ? { color: 'transparent', caretColor: 'hsl(var(--foreground))' } : undefined}
          {...props}
        />
        {/* 입력 필드 위에 링크를 시각적으로 표시하는 오버레이 */}
        {value && (
          <div className="absolute inset-0 pointer-events-none flex items-center px-3 py-2 text-sm z-30 overflow-hidden">
            <BookLinkInputRenderer text={value} className="w-full" />
          </div>
        )}
      </div>

      {/* 자동완성 목록 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-80 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {suggestions.map((book, index) => (
            <button
              key={book.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-3",
                index === selectedIndex && "bg-accent"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBookSelect(book, e);
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // blur 이벤트 방지
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {book.books.cover_image_url ? (
                <div className="relative w-8 h-10 shrink-0 rounded overflow-hidden">
                  <Image
                    src={getImageUrl(book.books.cover_image_url)}
                    alt={book.books.title}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="w-8 h-10 shrink-0 rounded bg-muted flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {book.books.title}
                </div>
                {book.books.author && (
                  <div className="text-xs text-muted-foreground truncate">
                    {book.books.author}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

