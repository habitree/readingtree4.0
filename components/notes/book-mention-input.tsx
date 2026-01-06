"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getUserBooks } from "@/app/actions/books";
import { Loader2, BookOpen } from "lucide-react";
import { BookLinkInputRenderer } from "./book-link-input-renderer";
import { convertBookLinksToDisplayText } from "@/lib/utils/book-link";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";

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

  // 표시용 텍스트를 실제 마크다운 형식으로 변환하는 함수
  const convertDisplayToActual = (displayText: string, currentValue: string): string => {
    // 현재 value에서 링크 정보 추출
    const links = currentValue.match(/\[([^\]]+)\]\(@book:([^)]+)\)/g) || [];
    const linkMap = new Map<string, string>();
    
    links.forEach(link => {
      const match = link.match(/\[([^\]]+)\]\(@book:([^)]+)\)/);
      if (match) {
        linkMap.set(match[1], match[2]); // 책 제목 -> userBookId 매핑
      }
    });
    
    // 표시용 텍스트에서 책 제목을 찾아서 링크로 변환
    let actualText = displayText;
    linkMap.forEach((userBookId, title) => {
      // 정확한 책 제목만 매칭 (이미 링크로 변환된 부분 제외)
      const regex = new RegExp(`(?<!\\[)\\b${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?!\\])`, 'g');
      actualText = actualText.replace(regex, `[${title}](@book:${userBookId})`);
    });
    
    return actualText;
  };

  // @ 입력 감지 및 검색
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // @ 입력 감지 (표시용 텍스트 기준)
    const textBeforeCursor = newDisplayValue.substring(0, cursorPosition);
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

    // 표시용 텍스트를 실제 마크다운 형식으로 변환하여 저장
    const actualValue = convertDisplayToActual(newDisplayValue, value);
    onValueChange(actualValue);
  };

  // 입력 필드 포커스 시 커서 위치 업데이트
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // 포커스 시 현재 커서 위치를 기준으로 @ 감지
    const cursorPosition = e.target.selectionStart || 0;
    const displayText = convertBookLinksToDisplayText(value);
    const textBeforeCursor = displayText.substring(0, cursorPosition);
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
  const handleBookSelect = (book: Book, event?: React.MouseEvent, savedMentionStart?: number | null) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // savedMentionStart가 제공되면 사용, 아니면 현재 mentionStart 사용
    let currentMentionStart = savedMentionStart !== undefined ? savedMentionStart : mentionStart;

    // mentionStart가 null이면 현재 입력 필드에서 @ 위치를 다시 찾기
    if (currentMentionStart === null) {
      if (!inputRef.current) {
        console.error("handleBookSelect: inputRef가 null입니다");
        return;
      }
      const displayText = convertBookLinksToDisplayText(value);
      const cursorPosition = inputRef.current.selectionStart || displayText.length;
      const textBeforeCursor = displayText.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      
      if (lastAtIndex === -1) {
        console.error("handleBookSelect: @를 찾을 수 없습니다");
        return;
      }
      currentMentionStart = lastAtIndex;
    }

    if (!inputRef.current) {
      console.error("handleBookSelect: inputRef가 null입니다");
      return;
    }

    // 표시용 텍스트 기준으로 처리
    const displayText = convertBookLinksToDisplayText(value);
    const cursorPosition = inputRef.current.selectionStart || displayText.length;
    
    // @부터 커서 위치까지의 텍스트를 책 제목으로 교체
    const textBefore = displayText.substring(0, currentMentionStart);
    const textAfter = displayText.substring(cursorPosition);
    
    // 표시용: 책 제목만 추가
    const newDisplayText = textBefore + book.books.title + textAfter;
    
    // 실제 값: 기존 링크 정보를 유지하면서 새 링크 추가
    const existingLinks = value.match(/\[([^\]]+)\]\(@book:([^)]+)\)/g) || [];
    const linkMap = new Map<string, string>();
    
    existingLinks.forEach(link => {
      const match = link.match(/\[([^\]]+)\]\(@book:([^)]+)\)/);
      if (match) {
        linkMap.set(match[1], match[2]); // 책 제목 -> userBookId 매핑
      }
    });
    
    // 새 책 추가
    linkMap.set(book.books.title, book.id);
    
    // 표시용 텍스트에서 책 제목을 찾아서 링크로 변환
    let actualText = newDisplayText;
    linkMap.forEach((userBookId, title) => {
      // 정확한 책 제목만 매칭 (이미 링크로 변환된 부분 제외)
      // 단순한 방법: 책 제목을 찾아서 링크로 변환 (중복 방지)
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 이미 링크 형식이 아닌 경우만 변환
      const regex = new RegExp(`(?<!\\[)${escapedTitle}(?!\\])`, 'g');
      actualText = actualText.replace(regex, (match, offset) => {
        // 이미 링크로 변환된 부분인지 확인
        const beforeMatch = actualText.substring(0, offset);
        const afterMatch = actualText.substring(offset + match.length);
        // 앞뒤로 [ 또는 ]가 있으면 이미 링크이므로 변환하지 않음
        if (beforeMatch.endsWith('[') || afterMatch.startsWith(']')) {
          return match;
        }
        return `[${title}](@book:${userBookId})`;
      });
    });
    
    onValueChange(actualText);
    setShowSuggestions(false);
    setMentionStart(null);
    setSearchQuery("");

    // 커서 위치 조정 (표시용 텍스트 기준)
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = currentMentionStart + book.books.title.length;
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

  // 링크 형식: [책 제목](@book:userBookId) 체크
  const hasBookLinks = value && /\[([^\]]+)\]\(@book:([^)]+)\)/.test(value);
  const displayValue = convertBookLinksToDisplayText(value);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={(e) => {
            // 포커스가 자동완성 목록으로 이동하는 경우를 고려
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (relatedTarget && suggestionsRef.current?.contains(relatedTarget)) {
              return; // suggestions로 포커스가 이동한 경우 무시
            }
            // 클릭 이벤트가 처리될 시간을 주기 위해 지연
            setTimeout(() => {
              if (!suggestionsRef.current?.contains(document.activeElement)) {
                setShowSuggestions(false);
              }
            }, 200);
          }}
          className={cn(className, "relative z-10")}
          style={hasBookLinks ? { 
            color: 'transparent', 
            caretColor: 'hsl(var(--foreground))',
            WebkitTextFillColor: 'transparent'
          } : undefined}
          {...props}
        />
        {/* 입력 필드 위에 링크를 시각적으로 표시하는 오버레이 */}
        {hasBookLinks && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center px-3 py-2 text-sm z-20 overflow-hidden"
            style={{ 
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent'
            }}
          >
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
          {suggestions.map((book, index) => {
            const hasValidImage = isValidImageUrl(book.books.cover_image_url) && book.books.cover_image_url;
            return (
              <button
                key={book.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-3",
                  index === selectedIndex && "bg-accent"
                )}
                onMouseDown={(e) => {
                  // blur 이벤트를 방지하기 위해 preventDefault 사용
                  e.preventDefault();
                  // mentionStart를 저장
                  const savedMentionStart = mentionStart;
                  // 클릭 이벤트를 즉시 처리 (setTimeout으로 다음 이벤트 루프에서 실행)
                  setTimeout(() => {
                    handleBookSelect(book, e, savedMentionStart);
                  }, 0);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* 책표지 */}
                <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded bg-muted">
                  {hasValidImage ? (
                    <Image
                      src={getImageUrl(book.books.cover_image_url!)}
                      alt={book.books.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* 책 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {book.books.title}
                  </div>
                  {book.books.author && (
                    <div className="text-xs text-muted-foreground truncate">
                      {book.books.author}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

