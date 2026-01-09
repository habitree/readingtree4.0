"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BookStatusBadge } from "./book-status-badge";
import { BookNotesPreview } from "./book-notes-preview";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, FileText, Loader2, Users, BookOpen as BookOpenIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBookStatus } from "@/app/actions/books";
import { moveBookToBookshelf, getBookshelves } from "@/app/actions/bookshelves";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";
import type { BookWithNotes } from "@/app/actions/books";
import type { ReadingStatus } from "@/types/book";
import { Bookshelf } from "@/types/bookshelf";

interface BookTableProps {
  books: BookWithNotes[];
}

/**
 * 테이블 형태 책 목록 컴포넌트
 * habitree.io/search 페이지의 테이블 형태와 유사한 구조
 */
export function BookTable({ books }: BookTableProps) {
  const router = useRouter();
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [bookNotes, setBookNotes] = useState<Record<string, any[]>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [bookshelvesMap, setBookshelvesMap] = useState<Record<string, Bookshelf>>({});
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(false);
  const [updatingBookshelf, setUpdatingBookshelf] = useState<Record<string, boolean>>({});

  // 서재 목록 로드
  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
        const map: Record<string, Bookshelf> = {};
        data.forEach((b) => {
          map[b.id] = b;
        });
        setBookshelvesMap(map);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      }
    }
    loadBookshelves();
  }, []);

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

  const handleStatusChange = async (userBookId: string, newStatus: ReadingStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [userBookId]: true }));
    try {
      await updateBookStatus(userBookId, newStatus);
      toast.success("상태가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [userBookId]: false }));
    }
  };

  const handleBookshelfChange = async (userBookId: string, bookshelfId: string) => {
    const book = books.find((b) => b.id === userBookId);
    const currentBookshelfId = (book as any)?.bookshelf_id || null;

    if (!bookshelfId || bookshelfId === currentBookshelfId) {
      return;
    }

    setUpdatingBookshelf((prev) => ({ ...prev, [userBookId]: true }));
    try {
      await moveBookToBookshelf(userBookId, bookshelfId);
      toast.success("서재가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 변경에 실패했습니다."
      );
    } finally {
      setUpdatingBookshelf((prev) => ({ ...prev, [userBookId]: false }));
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-20 sm:w-24">
                표지
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[200px] sm:min-w-[300px]">
                제목/책소개
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-32 sm:w-40">
                상태
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-32">
                기록
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-48">
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
                    <Link href={`/books/${item.id}`} className="block">
                      <div className="relative w-12 h-16 sm:w-16 sm:h-20 rounded overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity mx-auto">
                        {hasValidImage ? (
                          <Image
                            src={getImageUrl(book.cover_image_url)}
                            alt={`${book.title} 표지`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 48px, 64px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* 제목/책소개 */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <Link
                          href={`/books/${item.id}`}
                          className="font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                        >
                          {book.title}
                        </Link>
                      </div>

                      {/* 읽는 이유 */}
                      {item.reading_reason && (
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                          "{item.reading_reason}"
                        </p>
                      )}

                      {/* 책소개 (플레이스홀더) */}
                      {book.publisher && (
                        <p className="text-xs text-muted-foreground line-clamp-1 opacity-75">
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
                        {item.groupBooks && item.groupBooks.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.groupBooks.map((gb) => (
                              <Badge
                                key={gb.group_id}
                                variant="outline"
                                className="text-xs px-1.5 py-0.5"
                                title={`${gb.group_name} 지정도서`}
                              >
                                <Users className="mr-1 h-2.5 w-2.5" />
                                {gb.group_name}
                              </Badge>
                            ))}
                          </div>
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

                  {/* 상태 */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {updatingStatus[item.id] ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>변경 중...</span>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[180px] h-9 justify-between"
                              disabled={updatingStatus[item.id]}
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-sm leading-tight">
                                  {item.status === "not_started" && "읽기전"}
                                  {item.status === "reading" && "읽는 중"}
                                  {item.status === "completed" && "완독"}
                                  {item.status === "rereading" && "재독"}
                                  {item.status === "paused" && "중단"}
                                </span>
                                {(() => {
                                  const bookshelfId = (item as any).bookshelf_id;
                                  const bookshelf = bookshelfId ? bookshelvesMap[bookshelfId] : null;
                                  return bookshelf ? (
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {bookshelf.name}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[180px]">
                            <DropdownMenuLabel>상태</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "not_started")}
                              disabled={item.status === "not_started" || updatingStatus[item.id]}
                              className={item.status === "not_started" ? "bg-accent" : ""}
                            >
                              읽기전
                              {item.status === "not_started" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "reading")}
                              disabled={item.status === "reading" || updatingStatus[item.id]}
                              className={item.status === "reading" ? "bg-accent" : ""}
                            >
                              읽는 중
                              {item.status === "reading" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "completed")}
                              disabled={item.status === "completed" || updatingStatus[item.id]}
                              className={item.status === "completed" ? "bg-accent" : ""}
                            >
                              완독
                              {item.status === "completed" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "rereading")}
                              disabled={item.status === "rereading" || updatingStatus[item.id]}
                              className={item.status === "rereading" ? "bg-accent" : ""}
                            >
                              재독
                              {item.status === "rereading" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "paused")}
                              disabled={item.status === "paused" || updatingStatus[item.id]}
                              className={item.status === "paused" ? "bg-accent" : ""}
                            >
                              중단
                              {item.status === "paused" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>서재</DropdownMenuLabel>
                            {isLoadingBookshelves ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                로딩 중...
                              </DropdownMenuItem>
                            ) : bookshelves.length === 0 ? (
                              <DropdownMenuItem disabled>서재가 없습니다</DropdownMenuItem>
                            ) : (
                              bookshelves.map((bookshelf) => {
                                const currentBookshelfId = (item as any).bookshelf_id;
                                return (
                                  <DropdownMenuItem
                                    key={bookshelf.id}
                                    onClick={() => handleBookshelfChange(item.id, bookshelf.id)}
                                    disabled={bookshelf.id === currentBookshelfId || updatingStatus[item.id] || updatingBookshelf[item.id]}
                                    className={bookshelf.id === currentBookshelfId ? "bg-accent" : ""}
                                  >
                                    <BookOpenIcon className="mr-2 h-4 w-4" />
                                    {bookshelf.name}
                                    {bookshelf.id === currentBookshelfId && " ✓"}
                                  </DropdownMenuItem>
                                );
                              })
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>

                  {/* 기록 (모바일에서 숨김) */}
                  <td className="hidden md:table-cell px-4 py-4">
                    <Link href={`/books/${item.id}`}>
                      <Button variant="outline" size="sm" className="w-full min-h-[36px]">
                        <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                        기록
                      </Button>
                    </Link>
                  </td>

                  {/* 책정보 (태블릿 이하에서 숨김) */}
                  <td className="hidden lg:table-cell px-4 py-4">
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
                      {(() => {
                        let dates: string[] = [];
                        if (item.completed_dates) {
                          if (Array.isArray(item.completed_dates)) {
                            dates = item.completed_dates;
                          } else if (typeof item.completed_dates === 'string') {
                            try {
                              dates = JSON.parse(item.completed_dates);
                            } catch {
                              dates = [];
                            }
                          }
                        } else if (item.completed_at) {
                          dates = [item.completed_at];
                        }
                        return dates.length > 0 ? (
                          <div>
                            <span className="text-muted-foreground">완독일:</span>{" "}
                            <span className="font-medium">
                              {dates.map((date: string, index: number) => (
                                <span key={index}>
                                  {formatDate(date)}
                                  {index < dates.length - 1 && ", "}
                                </span>
                              ))}
                            </span>
                          </div>
                        ) : null;
                      })()}
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

