import { Metadata } from "next";
import { NoteForm } from "@/components/notes/note-form";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "기록 작성 | Habitree Reading Hub",
  description: "새로운 기록을 작성하세요",
};

interface NewNotePageProps {
  searchParams: {
    bookId?: string;
  };
}

/**
 * 기록 작성 페이지
 * US-010~US-015: 기록 작성 기능
 */
export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const bookId = searchParams.bookId;

  if (!bookId) {
    redirect("/books");
  }

  // 책 소유 확인
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (!userBook) {
      redirect("/books");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">기록 작성</h1>
        <p className="text-muted-foreground">
          책에 대한 기록을 작성하세요
        </p>
      </div>

      <NoteForm bookId={bookId} />
    </div>
  );
}

