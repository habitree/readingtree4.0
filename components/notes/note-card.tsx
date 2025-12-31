"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel } from "@/lib/utils/note";
import { NoteContentViewer } from "./note-content-viewer";
import { OCRStatusBadge } from "./ocr-status-badge";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import type { NoteWithBook } from "@/types/note";
import { FileText, Image as ImageIcon, PenTool, Camera } from "lucide-react";

interface NoteCardProps {
  note: NoteWithBook;
}

/**
 * 기록 카드 컴포넌트
 */
export function NoteCard({ note }: NoteCardProps) {
  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
  };

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type, hasImage);
  const Icon = typeIcons[note.type];
  
  // OCR 상태 확인: transcription 타입이고 이미지가 있는 경우 실제 상태 확인
  const { status: ocrStatus } = useOCRStatus({
    noteId: note.id,
    enabled: note.type === "transcription" && hasImage,
    pollInterval: 3000,
  });

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* UX 원칙 05: 깊이감 부여를 위한 이미지 레이어링 */}
            {/* 이미지 또는 아이콘 */}
            {note.image_url ? (
              <div className="relative w-24 h-32 shrink-0 overflow-hidden rounded bg-muted">
                <Image
                  src={getImageUrl(note.image_url)}
                  alt={note.type}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="w-24 h-32 shrink-0 flex items-center justify-center rounded bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* 내용 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <Badge variant="secondary">{typeLabel}</Badge>
                <OCRStatusBadge status={ocrStatus} />
              </div>

              <NoteContentViewer
                content={note.content}
                pageNumber={note.page_number}
                maxLength={100}
              />

              {note.book && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {note.book.title}
                </p>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {formatSmartDate(note.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

