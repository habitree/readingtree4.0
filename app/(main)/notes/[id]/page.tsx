import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail, deleteNote, getTranscription } from "@/app/actions/notes";
import { getImageUrl } from "@/lib/utils/image";
import { formatDate, formatSmartDate } from "@/lib/utils/date";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { FileText, PenTool, Camera, ImageIcon, Edit, Trash2 } from "lucide-react";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { getNoteTypeLabel } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { OCRStatusChecker } from "@/components/notes/ocr-status-checker";
import type { NoteType } from "@/types/note";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoteDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 상세 페이지
 */
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 검증
  if (!noteId || typeof noteId !== 'string') {
    console.error("NoteDetailPage: noteId가 유효하지 않습니다.", { noteId, params: resolvedParams });
    notFound();
  }

  // UUID 검증
  if (!isValidUUID(noteId)) {
    console.error("NoteDetailPage: noteId가 유효한 UUID가 아닙니다.", { noteId });
    notFound();
  }

  let note;
  try {
    console.log("NoteDetailPage: 기록 상세 조회 시도", { noteId });
    note = await getNoteDetail(noteId);
    console.log("NoteDetailPage: 기록 상세 조회 성공", { noteId, hasNote: !!note });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("기록 상세 조회 오류:", {
      noteId,
      error: safeError,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    notFound();
  }

  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
  };

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type as NoteType, hasImage);
  const Icon = typeIcons[note.type as keyof typeof typeIcons];

  // 필사 데이터 조회 (transcription 타입이고 이미지가 있는 경우)
  let transcription = null;
  if (note.type === "transcription" && hasImage) {
    try {
      transcription = await getTranscription(note.id);
    } catch (error) {
      console.error("필사 데이터 조회 오류:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {typeLabel}
            </h1>
            <OCRStatusChecker
              noteId={note.id}
              noteType={note.type}
              hasImage={hasImage}
            />
          </div>
          <p className="text-muted-foreground">
            {formatSmartDate(note.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SimpleShareDialog note={note as any} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/notes/${note.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <NoteDeleteButton noteId={note.id} />
        </div>
      </div>

      {note.book && (
        <div className="flex items-center gap-2">
          <Link 
            href={note.user_book_id ? `/books/${note.user_book_id}` : '#'} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {note.book.title}
          </Link>
          {note.page_number && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">
                {note.page_number}페이지
              </span>
            </>
          )}
        </div>
      )}

      {/* 필사 이미지와 내용을 함께 표시 (transcription 타입인 경우) */}
      {note.type === "transcription" && note.image_url ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
          {/* 필사 이미지 - 유연한 크기 조정 */}
          <div className="flex items-start justify-center lg:justify-start">
            <div className="relative w-full max-w-xs aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-md">
              <Image
                src={getImageUrl(note.image_url)}
                alt="필사 이미지"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          </div>

          {/* 필사 내용 - OCR이 완료된 경우 */}
          <div className="flex-1">
            {transcription && transcription.status === "completed" ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">필사 내용</CardTitle>
                </CardHeader>
                <CardContent>
                  {transcription.extracted_text ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">OCR로 추출된 텍스트</h4>
                        <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md max-h-64 overflow-y-auto">
                          {transcription.extracted_text}
                        </p>
                      </div>
                      {transcription.quote_content && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">인상깊은 구절</h4>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md max-h-48 overflow-y-auto">
                            {transcription.quote_content}
                          </p>
                        </div>
                      )}
                      {transcription.memo_content && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">내 생각</h4>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md max-h-48 overflow-y-auto">
                            {transcription.memo_content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">추출된 텍스트가 없습니다.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">필사 내용</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">OCR 처리가 진행 중입니다...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* 일반 이미지 (transcription이 아닌 경우) */
        note.image_url && (
          <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden rounded-lg bg-muted">
            <Image
              src={getImageUrl(note.image_url)}
              alt={note.type}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )
      )}

      {/* 일반 기록 내용 표시 (필사가 아닌 경우) */}
      {note.content && note.type !== "transcription" && (
        <NoteContentViewer
          content={note.content}
          pageNumber={note.page_number}
          maxLength={200}
        />
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={note.is_public ? "default" : "outline"}>
          {note.is_public ? "공개" : "비공개"}
        </Badge>
        <span>작성일: {formatDate(note.created_at)}</span>
        {note.updated_at !== note.created_at && (
          <span>수정일: {formatDate(note.updated_at)}</span>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 검증
  if (!noteId || typeof noteId !== 'string') {
    return {
      title: "기록 상세 | Habitree Reading Hub",
    };
  }

  // UUID 검증
  if (!isValidUUID(noteId)) {
    return {
      title: "기록 상세 | Habitree Reading Hub",
    };
  }

  try {
    const note = await getNoteDetail(noteId);
    return {
      title: `${note.type} 기록 | Habitree Reading Hub`,
      description: note.content?.substring(0, 100) || "기록 상세",
    };
  } catch {
    return {
      title: "기록 상세 | Habitree Reading Hub",
    };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

