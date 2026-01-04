"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
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

interface BookMentionTextareaProps extends React.ComponentProps<"textarea"> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * 책 링크 자동완성이 포함된 Textarea 컴포넌트
 * @ 입력 시 사용자가 등록한 책 목록에서 검색하고 링크로 변환
 */
export function BookMentionTextarea({
  value,
  onValueChange,
  className,
  ...props
}: BookMentionTextareaProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // @ 입력 감지
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // @ 이후의 텍스트 추출
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // 공백이나 줄바꿈이 있으면 멘션 종료
      if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
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

  // 책 선택 시 링크로 변환
  const handleBookSelect = (book: Book) => {
    if (mentionStart === null || !textareaRef.current) {
      console.error("handleBookSelect: mentionStart 또는 textareaRef가 null입니다", { mentionStart, textareaRef: textareaRef.current });
      return;
    }

    const currentValue = value;
    const cursorPosition = textareaRef.current.selectionStart || currentValue.length;
    
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
      if (textareaRef.current) {
        const newCursorPos = mentionStart + linkText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // 커서 위치에 따른 자동완성 위치 계산
  const getSuggestionsPosition = () => {
    if (!textareaRef.current || mentionStart === null) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textBeforeMention = value.substring(0, mentionStart);
    
    // 텍스트 영역 내에서 @ 위치 계산
    const lines = textBeforeMention.split("\n");
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    const charWidth = 8; // 대략적인 문자 너비
    
    const top = lines.length * lineHeight + 10; // textarea padding + 여유
    const left = Math.min((lines[lines.length - 1].length + 1) * charWidth, textarea.offsetWidth - 320); // 최대 너비 고려

    return { top, left };
  };

  const position = getSuggestionsPosition();

  return (
    <div className="relative">
      <div className="relative">
        {/* 입력 필드 위에 링크를 시각적으로 표시하는 오버레이 */}
        {value && (
          <div className="absolute inset-0 pointer-events-none flex items-start px-3 py-2 text-sm z-20 overflow-hidden">
            <BookLinkInputRenderer text={value} className="w-full whitespace-pre-wrap" />
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={cn(className, value && "text-transparent caret-foreground")}
          {...props}
        />
      </div>

      {/* 자동완성 목록 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-80 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
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
              onClick={() => handleBookSelect(book)}
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

