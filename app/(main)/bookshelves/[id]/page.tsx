import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBookshelfWithStats } from "@/app/actions/bookshelves";
import { getCurrentUser } from "@/app/actions/auth";
import { BookshelfPageContent } from "@/components/books/bookshelf-page-content";
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

        {/* 공통 컨텐츠 컴포넌트 */}
        <BookshelfPageContent
          status={status}
          query={query}
          view={view}
          user={user}
          bookshelfId={bookshelfId}
        />
      </div>
    );
  } catch (error) {
    console.error("서재 상세 조회 오류:", error);
    notFound();
  }
}

