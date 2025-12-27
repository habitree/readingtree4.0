import { NoteCard } from "./note-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PenTool, FileText } from "lucide-react";
import Link from "next/link";
import type { NoteWithBook } from "@/types/note";

interface NoteListProps {
  notes: NoteWithBook[];
  isLoading?: boolean;
}

/**
 * 기록 목록 컴포넌트
 */
export function NoteList({ notes, isLoading }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">기록이 없습니다</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            첫 번째 기록을 작성하고 독서 여정을 시작해보세요!
          </p>
        </div>
        <Button asChild className="mt-4">
          <Link href="/notes/new">
            <PenTool className="mr-2 h-4 w-4" />
            기록 작성하기
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}

