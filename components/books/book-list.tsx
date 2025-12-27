import { BookCard } from "./book-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookWithUserBook } from "@/types/book";
import type { UserBook } from "@/types/book";

interface BookListProps {
  books: Array<{
    id: string;
    status: "reading" | "completed" | "paused";
    books: {
      id: string;
      isbn: string | null;
      title: string;
      author: string | null;
      publisher: string | null;
      published_date: string | null;
      cover_image_url: string | null;
    };
  }>;
  isLoading?: boolean;
}

/**
 * 책 목록 컴포넌트
 * 그리드 형태로 책 카드들을 표시
 */
export function BookList({ books, isLoading }: BookListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">등록된 책이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((userBook) => (
        <BookCard
          key={userBook.id}
          book={userBook.books as BookWithUserBook}
          userBookId={userBook.id}
          status={userBook.status}
        />
      ))}
    </div>
  );
}

