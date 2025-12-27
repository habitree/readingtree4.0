import { NoteList } from "./note-list";
import { getNotes } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";
import Link from "next/link";

interface NotesListProps {
  bookId: string;
}

/**
 * 책별 기록 목록 컴포넌트
 */
export async function NotesList({ bookId }: NotesListProps) {
  const notes = await getNotes(bookId);

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">아직 기록이 없습니다.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/notes/new?bookId=${bookId}`}>
            <PenTool className="mr-2 h-4 w-4" />
            첫 기록 작성하기
          </Link>
        </Button>
      </div>
    );
  }

  return <NoteList notes={notes as any} />;
}

