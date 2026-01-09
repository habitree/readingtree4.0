import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { getBookDetail, updateBookStatus } from "@/app/actions/books";
import { getImageUrl } from "@/lib/utils/image";
import { formatDate } from "@/lib/utils/date";
import { BookStatusSelector } from "@/components/books/book-status-selector";
import { BookDeleteButton } from "@/components/books/book-delete-button";
import { BookInfoEditor } from "@/components/books/book-info-editor";
import { PenTool } from "lucide-react";
import type { ReadingStatus } from "@/types/book";
import { NotesList } from "@/components/notes/notes-list";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";

interface BookDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 책 상세 페이지
 * US-008: 책 정보 조회
 * US-009: 독서 상태 관리
 */
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  // params.id 검증
  if (!bookId || typeof bookId !== 'string') {
    console.error("BookDetailPage: bookId가 유효하지 않습니다.", { bookId, params: resolvedParams });
    notFound();
  }

  // 샘플 데이터 ID는 UUID가 아니므로 별도 처리
  // UUID 검증 (샘플 데이터 제외)
  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    console.error("BookDetailPage: bookId가 유효한 UUID가 아닙니다.", { bookId });
    notFound();
  }

  let bookDetail;
  try {
    console.log("BookDetailPage: 책 상세 조회 시도", { bookId });
    bookDetail = await getBookDetail(bookId);
    console.log("BookDetailPage: 책 상세 조회 성공", { bookId, hasBook: !!bookDetail });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("책 상세 조회 오류:", {
      bookId,
      error: safeError,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    notFound();
  }

  const book = bookDetail.books as any;
  const userBook = bookDetail;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* 책 표지 */}
        <div className="relative w-48 h-64 shrink-0 overflow-hidden rounded-lg bg-muted mx-auto sm:mx-0">
          <Image
            src={getImageUrl(book.cover_image_url)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="192px"
            loading="eager"
            priority={true}
          />
        </div>

        {/* 책 정보 */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{book.title}</h1>
            {book.author && (
              <p className="text-lg text-muted-foreground mt-2">
                {book.author}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2">
            <BookStatusBadge status={userBook.status as ReadingStatus} />
          </div>

          {/* 읽는 이유 */}
          <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-muted-foreground">읽는 이유</p>
              <BookInfoEditor
                userBookId={userBook.id}
                currentReadingReason={userBook.reading_reason}
                currentStartedAt={userBook.started_at}
                currentCompletedDates={
                  (userBook as any).completed_dates && Array.isArray((userBook as any).completed_dates)
                    ? (userBook as any).completed_dates
                    : (userBook as any).completed_dates && typeof (userBook as any).completed_dates === 'string'
                    ? JSON.parse((userBook as any).completed_dates)
                    : userBook.completed_at
                    ? [userBook.completed_at]
                    : null
                }
                currentBookshelfId={(userBook as any).bookshelf_id || null}
              />
            </div>
            {userBook.reading_reason ? (
              <p className="text-sm italic">"{userBook.reading_reason}"</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                읽는 이유를 등록해보세요.
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {book.publisher && (
              <div>
                <span className="font-medium">출판사:</span> {book.publisher}
              </div>
            )}
            {book.isbn && (
              <div>
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}
            {/* 시작일과 완독일을 함께 표시 */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="font-medium">시작일:</span>
                {userBook.started_at ? (
                  <span>{formatDate(userBook.started_at)}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    시작일을 등록해보세요.
                  </span>
                )}
              </div>
              {(() => {
                let dates: string[] = [];
                if ((userBook as any).completed_dates) {
                  if (Array.isArray((userBook as any).completed_dates)) {
                    dates = (userBook as any).completed_dates;
                  } else if (typeof (userBook as any).completed_dates === 'string') {
                    try {
                      dates = JSON.parse((userBook as any).completed_dates);
                    } catch {
                      dates = [];
                    }
                  }
                } else if (userBook.completed_at) {
                  dates = [userBook.completed_at];
                }
                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">완독일:</span>
                    {dates.length > 0 ? (
                      <span>
                        {dates.map((date: string, index: number) => (
                          <span key={index}>
                            {formatDate(date)}
                            {index < dates.length - 1 && ", "}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        완독일을 등록해보세요.
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            <BookStatusSelector
              currentStatus={userBook.status as ReadingStatus}
              userBookId={userBook.id}
              currentBookshelfId={(userBook as any).bookshelf_id || null}
            />
            {!bookId.startsWith("sample-") && (
              <BookDeleteButton
                userBookId={userBook.id}
                bookTitle={book.title}
              />
            )}
          </div>
        </div>
      </div>

      {/* 기록 목록 영역 */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">기록</h2>
          <Button asChild>
            <Link href={`/notes/new?bookId=${userBook.id}`}>
              <PenTool className="mr-2 h-4 w-4" />
              기록 작성
            </Link>
          </Button>
        </div>
        <NotesList bookId={userBook.id} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  // params.id 검증
  if (!bookId || typeof bookId !== 'string') {
    return {
      title: "책 상세 | Habitree Reading Hub",
    };
  }

  // UUID 검증 (샘플 데이터는 메타데이터 생성하지 않음)
  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    return {
      title: "책 상세 | Habitree Reading Hub",
    };
  }

  try {
    const bookDetail = await getBookDetail(bookId);
    const book = bookDetail.books as any;

    return {
      title: `${book.title} | Habitree Reading Hub`,
      description: `${book.author ? `${book.author} 저` : ""} ${book.title}`,
    };
  } catch {
    return {
      title: "책 상세 | Habitree Reading Hub",
    };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

