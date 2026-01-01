import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail, getTranscription } from "@/app/actions/notes";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { Edit, ChevronLeft, ShieldCheck, ShieldAlert } from "lucide-react";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
import { OCRStatusChecker } from "@/components/notes/ocr-status-checker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoteWithBook } from "@/types/note";

interface NoteDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 상세 페이지
 * 보안성 검토 및 심미적인 통합 레이아웃 제공
 */
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // 1. 입력 보안 검증
  if (!noteId || typeof noteId !== 'string' || !isValidUUID(noteId)) {
    console.error("NoteDetailPage Security: 유효하지 않은 요청 ID", { noteId });
    notFound();
  }

  let note;
  try {
    // 2. 데이터 소유권 및 접근 권한 검증 (Server Action 내부에서 수행)
    note = await getNoteDetail(noteId);
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("기록 상세 조회 보안 오류:", { noteId, error: safeError });
    notFound();
  }

  const noteWithBook = note as NoteWithBook;

  // 필사 데이터 상세 조회 (있을 경우)
  let transcription = null;
  if (noteWithBook.type === "transcription" && noteWithBook.image_url) {
    try {
      transcription = await getTranscription(noteWithBook.id);
    } catch (error) {
      console.error("필사 데이터 조회 오류:", error);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* 1. 상단 내비게이션 및 액션 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="group">
            <Link href="/notes">
              <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
              목록으로
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-2">
            <Badge variant={noteWithBook.is_public ? "default" : "outline"} className="gap-1.5 py-1">
              {noteWithBook.is_public ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-white" />
                  <span>공개 기록</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3 text-muted-foreground" />
                  <span>나만 보기</span>
                </>
              )}
            </Badge>
            <OCRStatusChecker
              noteId={noteWithBook.id}
              noteType={noteWithBook.type}
              hasImage={!!noteWithBook.image_url}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <SimpleShareDialog note={noteWithBook} />
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/notes/${noteWithBook.id}/edit`}>
              <Edit className="h-4 w-4" />
              수정
            </Link>
          </Button>
          <NoteDeleteButton noteId={noteWithBook.id} />
        </div>
      </div>

      {/* 2. 메인 리딩 카드 (통합 디자인) */}
      <div className="relative">
        {/* 장식적 요소 */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
        <ShareNoteCard note={noteWithBook} className="shadow-2xl border border-slate-100 dark:border-slate-800" />
      </div>

      {/* 3. 상세 분석 정보 (필사 데이터 등) */}
      {transcription && (transcription.status === "completed" || transcription.extracted_text) && (
        <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-inner">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
              AI Analysis & Text Extraction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {transcription.extracted_text && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-primary">추출된 원문</h4>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic">
                    {transcription.extracted_text}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transcription.quote_content && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-blue-500">인상깊은 구절 (정제됨)</h4>
                  <p className="text-sm bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border-l-2 border-blue-400 text-slate-700 dark:text-slate-300">
                    "{transcription.quote_content}"
                  </p>
                </div>
              )}
              {transcription.memo_content && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500">내 생각 (정제됨)</h4>
                  <p className="text-sm bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg text-slate-600 dark:text-slate-400">
                    {transcription.memo_content}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  if (!noteId || !isValidUUID(noteId)) {
    return { title: "기록 상세 | ReadingTree" };
  }

  try {
    const note = await getNoteDetail(noteId);
    return {
      title: `${note.type === 'quote' ? '인상깊은 구절' : '독서 기록'} | ReadingTree`,
      description: note.book?.title || "기록 상세 정보",
    };
  } catch {
    return { title: "기록 상세 | ReadingTree" };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

