"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookStatusBadge } from "./book-status-badge";
import { BookNotesPreview } from "./book-notes-preview";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, Search, FileText } from "lucide-react";
import { useState } from "react";
import type { BookWithNotes } from "@/app/actions/books";

interface BookTableProps {
  books: BookWithNotes[];
}

/**
 * 테이블 형태 책 목록 컴포넌트
 * habitree.io/search 페이지의 테이블 형태와 유사한 구조
 */
export function BookTable({ books }: BookTableProps) {
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [bookNotes, setBookNotes] = useState<Record<string, any[]>>({});

  const handleToggleNotes = async (bookId: string, userBookId: string) => {
    if (expandedBookId === userBookId) {
      setExpandedBookId(null);
      return;
    }

    setExpandedBookId(userBookId);

    // 이미 로드된 기록이 있으면 다시 로드하지 않음
    if (bookNotes[userBookId]) {
      return;
    }

    // 기록 로드 (API 라우트 사용)
    try {
      const response = await fetch(`/api/notes?bookId=${bookId}&limit=5`);
      if (!response.ok) {
        throw new Error("기록 로드 실패");
      }
      const data = await response.json();
      setBookNotes((prev) => ({
        ...prev,
        [userBookId]: data.notes || [],
      }));
    } catch (error) {
      console.error("기록 로드 실패:", error);
    }
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 책이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-24">
                표지
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[300px]">
                제목/책소개
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-32">
                링크
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-48">
                책정보
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((item) => {
              const book = item.books;
              const hasValidImage =
                isValidImageUrl(book.cover_image_url) && book.cover_image_url;
              const notes = bookNotes[item.id] || [];

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* 표지 */}
                  <td className="px-4 py-4">
                    <div className="relative w-16 h-20 rounded overflow-hidden bg-muted">
                      {hasValidImage ? (
                        <Image
                          src={getImageUrl(book.cover_image_url)}
                          alt={`${book.title} 표지`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 제목/책소개 */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Link
                          href={`/books/${item.id}`}
                          className="font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                        >
                          {book.title}
                        </Link>
                        <BookStatusBadge status={item.status} />
                      </div>

                      {/* 책소개 (플레이스홀더) */}
                      {book.publisher && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {book.publisher}
                        </p>
                      )}

                      {/* 기록 개수 및 더보기 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.noteCount > 0 && (
                          <Badge variant="secondary" className="text-xs font-medium">
                            <FileText className="w-3 h-3 mr-1" aria-hidden="true" />
                            {item.noteCount}개 기록
                          </Badge>
                        )}
                        {item.noteCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleNotes(book.id, item.id)
                            }
                            className="h-8 text-xs min-h-[36px]"
                          >
                            {expandedBookId === item.id
                              ? "접기"
                              : "나의기록 더보기"}
                          </Button>
                        )}
                      </div>

                      {/* 기록 미리보기 */}
                      {expandedBookId === item.id && notes.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <BookNotesPreview notes={notes} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 링크 */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Link href={`/books/${item.id}`}>
                        <Button variant="outline" size="sm" className="w-full min-h-[36px]">
                          <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                          기록
                        </Button>
                      </Link>
                      <Link href={`/books/${item.id}?tab=notes`}>
                        <Button variant="outline" size="sm" className="w-full min-h-[36px]">
                          <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                          기록조회
                        </Button>
                      </Link>
                    </div>
                  </td>

                  {/* 책정보 */}
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-sm">
                      {book.author && (
                        <div>
                          <span className="text-muted-foreground">저자:</span>{" "}
                          <span className="font-medium">{book.author}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div>
                          <span className="text-muted-foreground">출판사:</span>{" "}
                          <span className="font-medium">{book.publisher}</span>
                        </div>
                      )}
                      {book.isbn && (
                        <div>
                          <span className="text-muted-foreground">ISBN:</span>{" "}
                          <span className="font-medium font-mono text-xs">
                            {book.isbn}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

