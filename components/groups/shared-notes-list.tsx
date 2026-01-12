import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
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
        const hasImage = !!note.image_url;
        const typeLabel = getNoteTypeLabel(note.type, hasImage);
        
        return (
          <Link key={item.id} href={`/notes/${note.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {typeLabel}
                      </Badge>
                      {note.book && (
                        <span className="text-sm font-medium truncate">
                          {note.book.title}
                        </span>
                      )}
                    </div>
                    <div className="mb-2">
                      <NoteContentViewer
                        content={note.content}
                        pageNumber={parsePageNumber(note.page_number)}
                        maxLength={100}
                      />
                    </div>
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

