import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBookshelfWithStats } from "@/app/actions/bookshelves";
import { getCurrentUser } from "@/app/actions/auth";
import { BookshelfStats } from "@/components/bookshelves/bookshelf-stats";
import { BookList } from "@/components/books/book-list";
import { BookTable } from "@/components/books/book-table";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

interface BookshelfDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    view?: string;
    status?: string;
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
  const view = resolvedSearchParams.view || "table";
  const status = resolvedSearchParams.status;

  try {
    const bookshelf = await getBookshelfWithStats(bookshelfId);

    if (!bookshelf) {
      notFound();
    }

    // 서재의 책 목록 조회
    const { books } = await getUserBooksWithNotes(
      status as any,
      undefined,
      user,
      bookshelfId
    );

    // BookList가 기대하는 형식으로 변환 (BookTable은 BookWithNotes를 직접 사용)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/bookshelves">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{bookshelf.name}</h1>
              {bookshelf.description && (
                <p className="text-muted-foreground">{bookshelf.description}</p>
              )}
            </div>
          </div>
          {!bookshelf.is_main && (
            <Button variant="outline" asChild>
              <Link href={`/bookshelves/${bookshelfId}/edit`}>
                <Settings className="mr-2 h-4 w-4" />
                서재 설정
              </Link>
            </Button>
          )}
        </div>

        <BookshelfStats bookshelf={bookshelf} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">책 목록</h2>
            <span className="text-sm text-muted-foreground">
              총 {bookshelf.book_count}권
            </span>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">이 서재에 책이 없습니다.</p>
              <Button asChild className="mt-4">
                <Link href="/books/search">책 추가하기</Link>
              </Button>
            </div>
          ) : view === "grid" ? (
            <BookList books={formattedBooksForList} />
          ) : (
            <BookTable books={books} />
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("서재 상세 조회 오류:", error);
    notFound();
  }
}
