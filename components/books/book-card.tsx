"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookStatusBadge } from "./book-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { BookWithUserBook } from "@/types/book";

interface BookCardProps {
  book: BookWithUserBook;
  userBookId: string;
  status: "reading" | "completed" | "paused";
}

/**
 * 책 카드 컴포넌트
 * 책 목록에서 사용되는 카드 형태의 책 정보 표시
 */
export function BookCard({ book, userBookId, status }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2; // 최대 2번 재시도
  const hasValidImage = isValidImageUrl(book.cover_image_url) && book.cover_image_url && !imageError;
  const isSample = userBookId?.startsWith("sample-") || false;
  
  // userBookId 검증
  if (!userBookId || typeof userBookId !== 'string' || userBookId.trim() === '') {
    console.error('BookCard: userBookId가 유효하지 않습니다.', { userBookId, book });
    return null;
  }

  const handleImageError = () => {
    if (retryCount < MAX_RETRIES) {
      // 재시도: 짧은 지연 후 이미지 다시 로드 시도
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
      }, 500 * (retryCount + 1)); // 지수 백오프: 500ms, 1000ms
    } else {
      // 최대 재시도 횟수 초과 시 에러 상태로 설정
      setImageError(true);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSample) {
      e.preventDefault();
      // 샘플 데이터는 상세 페이지 접근 불가 안내
      toast.info("샘플 데이터는 상세 페이지를 볼 수 없습니다", {
        description: "로그인하여 나만의 서재를 만들어보세요!",
        action: {
          label: "로그인",
          onClick: () => window.location.href = "/login",
        },
        duration: 5000,
      });
      return;
    }

    // 디버깅: 클릭 시 userBookId 확인
    console.log("BookCard: 책 클릭", {
      userBookId,
      bookTitle: book.title,
      href: `/books/${userBookId}`,
    });
  };

  return (
    <Link 
      href={isSample ? "/books" : `/books/${userBookId}`} 
      onClick={handleClick}
      aria-label={isSample ? `${book.title} (샘플 데이터 - 클릭 시 로그인 안내)` : `${book.title} 상세 보기`}
    >
      <Card 
        className={`group hover:shadow-lg transition-shadow h-full ${isSample ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
        role={isSample ? "button" : undefined}
        aria-disabled={isSample}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted" role="img" aria-label={`${book.title} 표지`}>
            {hasValidImage ? (
              <Image
                key={`${book.cover_image_url}-retry-${retryCount}`}
                src={getImageUrl(book.cover_image_url)}
                alt={`${book.title} 표지`}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                onError={handleImageError}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50" aria-label="이미지 없음">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-2" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">이미지 없음</span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-2 flex-1">{book.title}</h3>
              <BookStatusBadge status={status} className="shrink-0" />
            </div>
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
        </CardContent>
      </Card>
    </Link>
  );
}

