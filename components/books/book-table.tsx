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
import { BookDeleteButton } from "./book-delete-button";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, FileText, Loader2, Users, BookOpen as BookOpenIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBookStatus, getBookDescriptionSummary } from "@/app/actions/books";
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
  const [bookDescriptions, setBookDescriptions] = useState<Record<string, string>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<string, boolean>>({});

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

  // 책소개 초기화 및 로드 (PC 버전에서만)
  useEffect(() => {
    // books가 없으면 스킵
    if (!books || books.length === 0) return;
    
    // PC 버전에서만 로드 (lg 이상)
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) return;

    // 1. DB에서 가져온 description_summary 먼저 설정
    const initialDescriptions: Record<string, string> = {};
    for (const item of books) {
      if (!item || !item.books) continue;
      const book = item.books;
      if (book && book.description_summary && book.description_summary.trim().length > 0) {
        initialDescriptions[book.id] = book.description_summary;
      }
    }
    setBookDescriptions((prev) => ({ ...prev, ...initialDescriptions }));

    // 2. description_summary가 없는 책만 API로 요약 생성
    async function loadBookDescriptions() {
      const descriptionsToLoad: Array<{ bookId: string; isbn?: string | null; title?: string | null }> = [];

      for (const item of books) {
        if (!item || !item.books) continue;
        const book = item.books;
        // 이미 DB에 있거나 로드되었거나 로딩 중이면 스킵
        if (book.description_summary || bookDescriptions[book.id] || loadingDescriptions[book.id]) {
          continue;
        }

        // ISBN이나 제목이 없으면 스킵
        if (!book.isbn && !book.title) {
          continue;
        }

        descriptionsToLoad.push({
          bookId: book.id,
          isbn: book.isbn,
          title: book.title,
        });
      }

      // 병렬로 로드 (최대 5개씩)
      const batchSize = 5;
      for (let i = 0; i < descriptionsToLoad.length; i += batchSize) {
        const batch = descriptionsToLoad.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ bookId, isbn, title }) => {
            setLoadingDescriptions((prev) => ({ ...prev, [bookId]: true }));
            try {
              const summary = await getBookDescriptionSummary(bookId, isbn, title);
              if (summary) {
                setBookDescriptions((prev) => ({ ...prev, [bookId]: summary }));
              }
            } catch (error) {
              console.error(`책소개 요약 실패 (${title}):`, error);
            } finally {
              setLoadingDescriptions((prev) => {
                const next = { ...prev };
                delete next[bookId];
                return next;
              });
            }
          })
        );
      }
    }
    loadBookDescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

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

  // books가 없거나 유효하지 않은 경우 처리
  if (!books || books.length === 0) {
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
                제목
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[150px]">
                책소개
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-24 sm:w-28">
                상태
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-32">
                기록
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-48">
                책정보
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-24">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((item) => {
              // 데이터 유효성 검사
              if (!item || !item.books) {
                console.warn("BookTable: 유효하지 않은 책 데이터", item);
                return null;
              }
              
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
                  <td className="px-4 py-6">
                    <Link href={`/books/${item.id}`} className="block">
                      <div className="relative w-20 h-28 sm:w-24 sm:h-36 rounded-md overflow-hidden bg-muted cursor-pointer hover:shadow-lg transition-all duration-300 mx-auto shadow-md border border-black/5">
                        {hasValidImage ? (
                          <Image
                            src={getImageUrl(book.cover_image_url)}
                            alt={`${book.title} 표지`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 80px, 96px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* 제목 */}
                  <td className="px-4 py-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 flex-wrap">
                        <Link
                          href={`/books/${item.id}`}
                          className="font-bold text-lg hover:text-primary transition-colors line-clamp-2 leading-tight"
                        >
                          {book.title}
                        </Link>
                      </div>

                      {/* 읽는 이유 */}
                      {item.reading_reason && (
                        <p className="text-sm text-muted-foreground line-clamp-2 italic border-l-2 border-primary/20 pl-3 py-1 bg-muted/30 rounded-r">
                          "{item.reading_reason}"
                        </p>
                      )}

                      {/* 책소개 (플레이스홀더) */}
                      {book.publisher && (
                        <p className="text-xs text-muted-foreground line-clamp-1 opacity-75 font-medium">
                          {book.publisher}
                        </p>
                      )}

                      {/* 기록 개수 및 더보기 */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {item.noteCount > 0 && (
                          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-secondary/50">
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
                                className="text-xs px-1.5 py-0.5 border-primary/20 text-primary/80"
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
                            className="h-7 text-xs px-2 hover:bg-muted"
                          >
                            {expandedBookId === item.id
                              ? "접기"
                              : "기록 더보기"}
                          </Button>
                        )}
                      </div>

                      {/* 기록 미리보기 */}
                      {expandedBookId === item.id && notes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <BookNotesPreview notes={notes} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 책소개 (PC 버전에서만 표시) */}
                  <td className="hidden lg:table-cell px-4 py-6 align-top">
                    <div className="text-sm text-muted-foreground pt-1">
                      {loadingDescriptions[book.id] ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">요약 중...</span>
                        </div>
                      ) : book.description_summary || bookDescriptions[book.id] ? (
                        <p className="line-clamp-4 leading-relaxed">{book.description_summary || bookDescriptions[book.id]}</p>
                      ) : (
                        <span className="text-xs opacity-50">-</span>
                      )}
                    </div>
                  </td>

                  {/* 상태 */}
                  <td className="px-4 py-6 align-top">
                    <div className="pt-1">
                      {updatingStatus[item.id] ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full max-w-[110px] h-8 text-xs font-medium justify-between px-2 bg-background/50"
                              disabled={updatingStatus[item.id]}
                            >
                              <div className="flex flex-col items-start gap-0.5 truncate">
                                <span className="truncate">
                                  {item.status === "not_started" && "읽기전"}
                                  {item.status === "reading" && "읽는 중"}
                                  {item.status === "completed" && "완독"}
                                  {item.status === "rereading" && "재독"}
                                  {item.status === "paused" && "중단"}
                                </span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[160px]">
                            <DropdownMenuLabel className="text-xs">읽기 상태</DropdownMenuLabel>
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
                            <DropdownMenuLabel className="text-xs">서재 이동</DropdownMenuLabel>
                            {isLoadingBookshelves ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                <span className="text-xs">로딩 중...</span>
                              </DropdownMenuItem>
                            ) : bookshelves.length === 0 ? (
                              <DropdownMenuItem disabled className="text-xs">서재가 없습니다</DropdownMenuItem>
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
                                    <BookOpenIcon className="mr-2 h-3 w-3" />
                                    <span className="truncate">{bookshelf.name}</span>
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
                  <td className="hidden md:table-cell px-4 py-6 align-top">
                    <Link href={`/books/${item.id}#book-info`} className="block pt-1">
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-primary">
                        <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                        기록
                      </Button>
                    </Link>
                  </td>

                  {/* 책정보 (태블릿 이하에서 숨김) */}
                  <td className="hidden lg:table-cell px-4 py-6 align-top">
                    <div className="space-y-1.5 text-sm pt-1">
                      {book.author && (
                        <div className="flex gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[3rem]">저자</span>
                          <span className="font-medium text-foreground">{book.author}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[3rem]">출판사</span>
                          <span className="font-medium text-foreground">{book.publisher}</span>
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
                          <div className="flex gap-2 text-muted-foreground">
                            <span className="text-xs min-w-[3rem]">완독일</span>
                            <span className="font-medium text-foreground">
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

                  {/* 액션 */}
                  <td className="px-4 py-6 text-center align-top">
                    <div className="pt-1">
                      <BookDeleteButton
                        userBookId={item.id}
                        bookTitle={book.title}
                        variant="icon"
                        size="sm"
                      />
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

