import { Suspense } from "react";
import { Metadata } from "next";
import { BookList } from "@/components/books/book-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogIn } from "lucide-react";
import Link from "next/link";
import { getUserBooks } from "@/app/actions/books";
import { StatusFilter } from "@/components/books/status-filter";
import { getCurrentUser } from "@/app/actions/auth";
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
  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();
  const isGuest = !user;

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
