import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
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
  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

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
        return (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="block p-4 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* 아이콘: 색상 구분으로 시각적 계층 강화 */}
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {/* 타이포그래피 위계: 제목은 굵게, 부가 정보는 작게 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {typeLabels[note.type]}
                  </Badge>
                  {note.book && (
                    <span className="text-sm font-semibold truncate text-foreground">
                      {note.book.title}
                    </span>
                  )}
                </div>
                {/* 본문: 적절한 줄 길이 (line-clamp-2) */}
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                    {note.content}
                  </p>
                )}
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

