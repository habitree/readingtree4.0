import { Suspense } from "react";
import { Metadata } from "next";
import { BookList } from "@/components/books/book-list";
import { BookTable } from "@/components/books/book-table";
import { BookStatsCards } from "@/components/books/book-stats-cards";
import { BookSearchInput } from "@/components/books/book-search-input";
import { ViewModeToggle } from "@/components/books/view-mode-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogIn } from "lucide-react";
import Link from "next/link";
import { getUserBooks, getUserBooksWithNotes } from "@/app/actions/books";
import { StatusFilter } from "@/components/books/status-filter";
import { getCurrentUser } from "@/app/actions/auth";
import type { ReadingStatus } from "@/types/book";

export const metadata: Metadata = {
  title: "내 서재 | Habitree Reading Hub",
  description: "내가 읽고 있는 책들을 관리하세요",
};

interface BooksPageProps {
  searchParams: Promise<{
    status?: string;
    view?: string;
    q?: string;
  }> | {
    status?: string;
    view?: string;
    q?: string;
  };
}

/**
 * 내 서재 페이지
 * US-008: 책 정보 조회
 * habitree.io/search 페이지 기능 마이그레이션
 */
export default async function BooksPage({ searchParams }: BooksPageProps) {
  // Next.js 15+ 에서 searchParams는 Promise일 수 있음
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  
  const status = (resolvedSearchParams.status as ReadingStatus | undefined) || undefined;
  const view = resolvedSearchParams.view || "table"; // 기본값을 테이블로 변경
  const query = resolvedSearchParams.q || undefined;
  
  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();
  const isGuest = !user;

  // 통계 및 책 목록 조회 (기록 정보 포함)
  const { books, stats } = await getUserBooksWithNotes(status, query, user);

  return (
    <div className="space-y-6">
      {/* 게스트 사용자 안내 */}
      {isGuest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">샘플 데이터</Badge>
                <p className="text-sm text-muted-foreground">
                  현재 샘플 책 목록을 보고 계십니다. 로그인하여 나만의 서재를 만들어보세요!
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isGuest ? "서재 둘러보기" : "내 서재"}
          </h1>
          <p className="text-muted-foreground">
            {isGuest
              ? "샘플 책 목록을 확인해보세요"
              : "내가 읽고 있는 책들을 관리하세요"}
          </p>
        </div>
        {!isGuest && (
          <Button asChild>
            <Link href="/books/search">
              <Plus className="mr-2 h-4 w-4" />
              책 추가
            </Link>
          </Button>
        )}
      </div>

      {/* 통계 카드 */}
      {!isGuest && <BookStatsCards stats={stats} />}

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <BookSearchInput />
        </div>
        <div className="flex items-center gap-4">
          <StatusFilter currentStatus={status} />
          {!isGuest && <ViewModeToggle />}
        </div>
      </div>

      {/* 책 목록 (그리드 또는 테이블) */}
      <Suspense fallback={<BookList books={[]} isLoading />}>
        {view === "grid" && !isGuest ? (
          <BooksListGrid status={status} query={query} user={user} />
        ) : !isGuest ? (
          <BookTable books={books} />
        ) : (
          <BooksListGrid status={status} query={query} user={user} />
        )}
      </Suspense>
    </div>
  );
}

async function BooksListGrid({
  status,
  query,
  user,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
}) {
  // 그리드 형태도 검색 기능을 지원하도록 getUserBooksWithNotes 사용
  // 단, 그리드 형태에서는 기록 정보가 필요 없으므로 간단한 형태로 변환
  const { books: booksWithNotes } = await getUserBooksWithNotes(status, query, user);
  
  // BookList 컴포넌트가 기대하는 형태로 변환
  // BookList는 { id, status, books: { ... }, groupBooks?: [...] } 형태를 기대함
  const books = booksWithNotes
    .filter((item) => item.books && item.books.id) // books 객체가 있는 경우만 필터링
    .map((item) => ({
      id: item.id, // user_books.id
      status: item.status,
      books: {
        id: item.books.id,
        title: item.books.title,
        author: item.books.author,
        publisher: item.books.publisher,
        isbn: item.books.isbn,
        cover_image_url: item.books.cover_image_url,
        published_date: item.books.published_date || null,
        created_at: item.books.created_at || "",
        updated_at: item.books.updated_at || "",
      },
      groupBooks: item.groupBooks || [],
    }));
  
  return <BookList books={books} />;
}
