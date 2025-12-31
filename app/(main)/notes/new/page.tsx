import { Metadata } from "next";
import { NoteFormNew } from "@/components/notes/note-form-new";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { isValidUUID } from "@/lib/utils/validation";

export const metadata: Metadata = {
  title: "기록 작성 | Habitree Reading Hub",
  description: "새로운 기록을 작성하세요",
};

interface NewNotePageProps {
  searchParams: Promise<{
    bookId?: string;
  }> | {
    bookId?: string;
  };
}

/**
 * 기록 작성 페이지
 * US-010~US-015: 기록 작성 기능
 */
export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  // Next.js 15+ 에서 searchParams는 Promise일 수 있음
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const bookId = resolvedSearchParams.bookId;

  // bookId 검증
  if (!bookId || typeof bookId !== 'string') {
    redirect("/books");
  }

  // UUID 검증
  if (!isValidUUID(bookId)) {
    redirect("/books");
  }

  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();

  // 로그인 확인
  if (!user) {
    redirect("/login");
  }

  // 책 소유 확인
  const supabase = await createServerSupabaseClient();
  const { data: userBook, error: bookError } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookError || !userBook) {
    redirect("/books");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">기록 작성</h1>
        <p className="text-muted-foreground">
          책에 대한 기록을 작성하세요
        </p>
      </div>

      <NoteFormNew bookId={bookId} />
    </div>
  );
}

