import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { getBookDetail, updateBookStatus } from "@/app/actions/books";
import { getImageUrl } from "@/lib/utils/image";
import { formatDate } from "@/lib/utils/date";
import { BookStatusSelector } from "@/components/books/book-status-selector";
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
  // params.id 검증
  if (!params?.id || typeof params.id !== 'string') {
    notFound();
  }

  // 샘플 데이터 ID는 UUID가 아니므로 별도 처리
  // UUID 검증 (샘플 데이터 제외)
  if (!params.id.startsWith("sample-") && !isValidUUID(params.id)) {
    notFound();
  }

  let bookDetail;
  try {
    bookDetail = await getBookDetail(params.id);
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("책 상세 조회 오류:", safeError);
    notFound();
  }

  const book = bookDetail.books as any;
  const userBook = bookDetail;

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* 책 표지 */}
        <div className="relative w-48 h-64 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={getImageUrl(book.cover_image_url)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="192px"
          />
        </div>

        {/* 책 정보 */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            {book.author && (
              <p className="text-lg text-muted-foreground mt-2">
                {book.author}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <BookStatusBadge status={userBook.status as ReadingStatus} />
          </div>

          <div className="space-y-2 text-sm">
            {book.publisher && (
              <div>
                <span className="font-medium">출판사:</span> {book.publisher}
              </div>
            )}
            {book.published_date && (
              <div>
                <span className="font-medium">출판일:</span>{" "}
                {formatDate(book.published_date)}
              </div>
            )}
            {book.isbn && (
              <div>
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}
            {userBook.started_at && (
              <div>
                <span className="font-medium">시작일:</span>{" "}
                {formatDate(userBook.started_at)}
              </div>
            )}
            {userBook.completed_at && (
              <div>
                <span className="font-medium">완독일:</span>{" "}
                {formatDate(userBook.completed_at)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <BookStatusSelector
              currentStatus={userBook.status as ReadingStatus}
              userBookId={userBook.id}
            />
            <Button asChild variant="outline">
              <Link href={`/notes/new?bookId=${userBook.id}`}>
                <PenTool className="mr-2 h-4 w-4" />
                기록 작성
              </Link>
            </Button>
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
  // params.id 검증
  if (!params?.id || typeof params.id !== 'string') {
    return {
      title: "책 상세 | Habitree Reading Hub",
    };
  }

  // UUID 검증 (샘플 데이터는 메타데이터 생성하지 않음)
  if (!params.id.startsWith("sample-") && !isValidUUID(params.id)) {
    return {
      title: "책 상세 | Habitree Reading Hub",
    };
  }

  try {
    const bookDetail = await getBookDetail(params.id);
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

