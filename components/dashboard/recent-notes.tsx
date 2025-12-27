import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import type { NoteWithBook } from "@/types/note";

interface RecentNotesProps {
  notes: NoteWithBook[];
}

/**
 * 최근 기록 컴포넌트
 * 최근 작성한 기록 목록 표시
 */
export function RecentNotes({ notes }: RecentNotesProps) {
  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/notes/${note.id}`}
          className="block p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {typeLabels[note.type]}
                </Badge>
                {note.book && (
                  <span className="text-sm font-medium truncate">
                    {note.book.title}
                  </span>
                )}
              </div>
              {note.content && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatSmartDate(note.created_at)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

