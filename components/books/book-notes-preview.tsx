"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSmartDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import type { NoteType } from "@/types/note";

interface BookNotesPreviewProps {
  notes: Array<{
    id: string;
    type: NoteType;
    content: string | null;
    created_at: string;
  }>;
  maxVisible?: number;
}

/**
 * 나의기록 더보기 미리보기 컴포넌트
 * 최근 기록을 아코디언 형태로 표시
 */
export function BookNotesPreview({
  notes,
  maxVisible = 3,
}: BookNotesPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (notes.length === 0) {
    return null;
  }

  const visibleNotes = isExpanded ? notes : notes.slice(0, maxVisible);
  const hasMore = notes.length > maxVisible;

  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

  return (
    <div className="space-y-2">
      {visibleNotes.map((note) => (
        <div
          key={note.id}
          className="p-3 rounded-lg border bg-muted/50 text-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[note.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatSmartDate(note.created_at)}
            </span>
          </div>
          {note.content && (
            <p className="text-sm line-clamp-2 text-muted-foreground">
              {note.content}
            </p>
          )}
        </div>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full min-h-[36px]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" aria-hidden="true" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" aria-hidden="true" />
              더보기 ({notes.length - maxVisible}개 더)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

