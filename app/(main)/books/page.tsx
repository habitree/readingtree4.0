import { Suspense } from "react";
import { Metadata } from "next";
import { BookList } from "@/components/books/book-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getUserBooks } from "@/app/actions/books";
import { StatusFilter } from "@/components/books/status-filter";
import type { ReadingStatus } from "@/types/book";

export const metadata: Metadata = {
  title: "내 서재 | Habitree Reading Hub",
  description: "내가 읽고 있는 책들을 관리하세요",
};

interface BooksPageProps {
  searchParams: {
    status?: string;
  };
}

/**
 * 내 서재 페이지
 * US-008: 책 정보 조회
 */
export default async function BooksPage({ searchParams }: BooksPageProps) {
  const status = (searchParams.status as ReadingStatus | undefined) || undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 서재</h1>
          <p className="text-muted-foreground">
            내가 읽고 있는 책들을 관리하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/books/search">
            <Plus className="mr-2 h-4 w-4" />
            책 추가
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <StatusFilter currentStatus={status} />
      </div>

      <Suspense fallback={<BookList books={[]} isLoading />}>
        <BooksList status={status} />
      </Suspense>
    </div>
  );
}

async function BooksList({ status }: { status?: ReadingStatus }) {
  const books = await getUserBooks(status);

  return <BookList books={books as any} />;
}
