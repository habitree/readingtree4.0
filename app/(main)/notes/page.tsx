import { Suspense } from "react";
import { Metadata } from "next";
import { NoteList } from "@/components/notes/note-list";
import { getNotes } from "@/app/actions/notes";
import type { NoteType } from "@/types/note";

export const metadata: Metadata = {
  title: "기록 목록 | Habitree Reading Hub",
  description: "내가 작성한 모든 기록을 확인하세요",
};

interface NotesPageProps {
  searchParams: {
    type?: string;
    bookId?: string;
  };
}

/**
 * 기록 목록 페이지
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  const type = searchParams.type as NoteType | undefined;
  const bookId = searchParams.bookId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">기록 목록</h1>
        <p className="text-muted-foreground">
          내가 작성한 모든 기록을 확인하세요
        </p>
      </div>

      <Suspense fallback={<NoteList notes={[]} isLoading />}>
        <NotesList type={type} bookId={bookId} />
      </Suspense>
    </div>
  );
}

async function NotesList({
  type,
  bookId,
}: {
  type?: NoteType;
  bookId?: string;
}) {
  const notes = await getNotes(bookId, type);

  return <NoteList notes={notes as any} />;
}

