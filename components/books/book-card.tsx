"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookStatusBadge } from "./book-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen } from "lucide-react";
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
  const hasValidImage = isValidImageUrl(book.cover_image_url) && book.cover_image_url && !imageError;

  return (
    <Link href={`/books/${userBookId}`}>
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted">
            {hasValidImage ? (
              <Image
                src={book.cover_image_url!}
                alt={book.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
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

