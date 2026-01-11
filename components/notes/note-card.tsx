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
import { BookLinkRenderer } from "./book-link-renderer";
import { NoteDeleteButton } from "./note-delete-button";

interface NoteCardProps {
  note: NoteWithBook;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

/**
 * 기록 카드 컴포넌트
 */
export function NoteCard({ note, showDeleteButton = false, onDelete }: NoteCardProps) {
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

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    }
  };

  const cardContent = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative group">
      <CardContent className="p-4">
        <div className="flex gap-4">
            {/* UX 원칙 05: 깊이감 부여를 위한 이미지 레이어링 */}
            {/* 이미지 또는 아이콘 */}
            {note.image_url ? (
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 overflow-hidden rounded bg-muted">
                <Image
                  src={getImageUrl(note.image_url)}
                  alt={note.type}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>
            ) : (
              <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 flex items-center justify-center rounded bg-muted">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            )}

            {/* 내용 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{typeLabel}</Badge>
                  {note.title && (
                    <h3 className="text-sm font-bold line-clamp-1">
                      <BookLinkRenderer text={note.title} />
                    </h3>
                  )}
                </div>
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
        {/* 삭제 버튼 (우측 상단) */}
        {showDeleteButton && (
          <div 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <NoteDeleteButtonWithCallback noteId={note.id} onDelete={handleDelete} />
          </div>
        )}
      </Card>
  );

  if (showDeleteButton) {
    return cardContent;
  }

  return (
    <Link href={`/notes/${note.id}`}>
      {cardContent}
    </Link>
  );
}

/**
 * 삭제 후 콜백을 지원하는 삭제 버튼 래퍼
 */
function NoteDeleteButtonWithCallback({ 
  noteId, 
  onDelete 
}: { 
  noteId: string; 
  onDelete?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { deleteNote } = await import("@/app/actions/notes");
      await deleteNote(noteId);
      const { toast } = await import("sonner");
      toast.success("기록이 삭제되었습니다.");
      setIsOpen(false);
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("기록 삭제 오류:", error);
      const { toast } = await import("sonner");
      toast.error(
        error instanceof Error ? error.message : "기록 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting} className="h-7 w-7 p-0">
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>기록 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 기록을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              "삭제"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
