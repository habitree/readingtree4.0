import { Suspense } from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBookshelfWithStats } from "@/app/actions/bookshelves";
import { getCurrentUser } from "@/app/actions/auth";
import { BookStatsCards } from "@/components/books/book-stats-cards";
import { BookList } from "@/components/books/book-list";
import { BookTable } from "@/components/books/book-table";
import { BookSearchInput } from "@/components/books/book-search-input";
import { ViewModeToggle } from "@/components/books/view-mode-toggle";
import { StatusFilter } from "@/components/books/status-filter";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Settings, Plus } from "lucide-react";
import type { ReadingStatus } from "@/types/book";

interface BookshelfDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    view?: string;
    status?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookshelfDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const bookshelf = await getBookshelfWithStats(resolvedParams.id);

  if (!bookshelf) {
    return {
      title: "서재를 찾을 수 없습니다 | Habitree Reading Hub",
    };
  }

  return {
    title: `${bookshelf.name} | Habitree Reading Hub`,
    description: bookshelf.description || `${bookshelf.name} 서재`,
  };
}

/**
 * 서재 상세 페이지
 */
export default async function BookshelfDetailPage({
  params,
  searchParams,
}: BookshelfDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const bookshelfId = resolvedParams.id;
  // 뷰 모드: URL 파라미터에서 가져오고, 없으면 기본값 "grid"
  const viewParam = resolvedSearchParams.view as "grid" | "table" | undefined;
  const view = viewParam === "table" ? "table" : "grid"; // 명시적으로 "table"이 아니면 "grid"
  const status = (resolvedSearchParams.status as ReadingStatus | undefined) || undefined;
  const query = resolvedSearchParams.q || undefined;

  try {
    const bookshelf = await getBookshelfWithStats(bookshelfId);

    if (!bookshelf) {
      notFound();
    }

    // 서재의 책 목록 조회 (통계 포함)
    const { books, stats } = await getUserBooksWithNotes(
      status,
      query,
      user,
      bookshelfId
    );

    // BookList가 기대하는 형식으로 변환
    const formattedBooksForList = books.map((book) => ({
      id: book.id,
      status: book.status,
      books: {
        id: book.books.id,
        title: book.books.title,
        author: book.books.author,
        publisher: book.books.publisher,
        isbn: book.books.isbn,
        cover_image_url: book.books.cover_image_url,
        published_date: book.books.published_date || null,
        created_at: book.books.created_at || "",
        updated_at: book.books.updated_at || "",
      },
      groupBooks: book.groupBooks || [],
    }));

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/bookshelves">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {bookshelf.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {bookshelf.description || "내가 읽고 있는 책들을 관리하세요"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!bookshelf.is_main && (
              <Button variant="outline" asChild>
                <Link href={`/bookshelves/${bookshelfId}/edit`}>
                  <Settings className="mr-2 h-4 w-4" />
                  서재 설정
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/books/search">
                <Plus className="mr-2 h-4 w-4" />
                책 추가
              </Link>
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <BookStatsCards stats={stats} />

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <BookSearchInput />
          </div>
          <div className="flex items-center gap-4">
            <StatusFilter currentStatus={status} />
            <ViewModeToggle />
          </div>
        </div>

        {/* 책 목록 (그리드 또는 테이블) */}
        {/* 모바일에서는 항상 그리드 뷰, 데스크톱에서만 테이블 뷰 선택 가능 */}
        <Suspense fallback={<BookList books={[]} isLoading />}>
          {view === "table" ? (
            <>
              {/* 테이블 뷰: 모바일에서는 그리드 뷰, 데스크톱에서만 테이블 뷰 */}
              <div className="lg:hidden">
                <BooksListGrid 
                  status={status} 
                  query={query} 
                  user={user} 
                  bookshelfId={bookshelfId}
                />
              </div>
              <div className="hidden lg:block">
                <BookTable books={books} />
              </div>
            </>
          ) : (
            /* 그리드 뷰 */
            <BooksListGrid 
              status={status} 
              query={query} 
              user={user} 
              bookshelfId={bookshelfId}
            />
          )}
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("서재 상세 조회 오류:", error);
    notFound();
  }
}

async function BooksListGrid({
  status,
  query,
  user,
  bookshelfId,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
  bookshelfId: string;
}) {
  try {
    // 인증된 사용자: 기록 정보 포함 조회
    let booksData: any[] = [];
    
    try {
      const { books: booksWithNotes } = await getUserBooksWithNotes(status, query, user, bookshelfId);
      booksData = booksWithNotes || [];
    } catch (error) {
      console.error("BooksListGrid: getUserBooksWithNotes 오류:", error);
      booksData = [];
    }
    
    // BookList 컴포넌트가 기대하는 형태로 변환
    const books = booksData
      .filter((item) => item.books && item.books.id)
      .map((item) => ({
        id: item.id,
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
  } catch (error) {
    console.error("BooksListGrid 렌더링 오류:", error);
    return <BookList books={[]} />;
  }
}
