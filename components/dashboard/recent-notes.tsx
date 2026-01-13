import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { FileText, Image, Quote, StickyNote } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

interface RecentNotesProps {
  notes: NoteWithBook[];
}

/**
 * 최근 기록 컴포넌트
 * 최근 작성한 기록 목록 표시
 */
export function RecentNotes({ notes }: RecentNotesProps) {
  const typeIcons = {
    quote: Quote,
    transcription: Image,
    photo: Image,
    memo: StickyNote,
  };

  return (
    // 8dp 그리드 시스템: space-y-3 = 12px 간격
    <div className="space-y-3">
      {notes.map((note) => {
        const Icon = typeIcons[note.type] || FileText;
        const hasImage = !!note.image_url;
        const typeLabel = getNoteTypeLabel(note.type, hasImage);
        
        return (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="block p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* 아이콘: 색상 구분으로 시각적 계층 강화 */}
              <div className="rounded-lg bg-primary/10 p-2 shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {/* 타이포그래피 위계: 제목은 굵게, 부가 정보는 작게 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {typeLabel}
                  </Badge>
                </div>
                {/* 기록 제목 (있는 경우) */}
                {note.title && (
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 line-clamp-1">
                    {note.title}
                  </h3>
                )}
                {/* 책 제목 - 더 명확하게 표시 */}
                {note.book && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-0.5">책</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {note.book.title}
                    </p>
                  </div>
                )}
                {/* 본문: 적절한 줄 길이 (line-clamp-2) */}
                <div className="mb-2">
                  <NoteContentViewer
                    content={note.content}
                    pageNumber={parsePageNumber(note.page_number)}
                    maxLength={100}
                  />
                </div>
                {/* 날짜: 작은 텍스트로 부가 정보 표시 */}
                <span className="text-xs text-muted-foreground">
                  {formatSmartDate(note.created_at)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

