import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import type { NoteWithBook } from "@/types/note";

interface SharedNotesListProps {
  notes: Array<{
    id: string;
    shared_at: string;
    notes: NoteWithBook;
  }>;
}

/**
 * 공유 기록 목록 컴포넌트
 * 모임에 공유된 기록 표시
 */
export function SharedNotesList({ notes }: SharedNotesListProps) {
  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">공유된 기록이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((item) => {
        const note = item.notes;
        return (
          <Link key={item.id} href={`/notes/${note.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {note.content}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      공유일: {formatSmartDate(item.shared_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

