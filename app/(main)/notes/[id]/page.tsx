import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail, deleteNote } from "@/app/actions/notes";
import { getImageUrl } from "@/lib/utils/image";
import { formatDate, formatSmartDate } from "@/lib/utils/date";
import { NoteActions } from "@/components/notes/note-actions";
import { ShareDialog } from "@/components/share/share-dialog";
import { FileText, PenTool, Camera, ImageIcon } from "lucide-react";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";

interface NoteDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 상세 페이지
 */
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  // UUID 검증
  if (!isValidUUID(params.id)) {
    notFound();
  }

  let note;
  try {
    note = await getNoteDetail(params.id);
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("기록 상세 조회 오류:", safeError);
    notFound();
  }

  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
  };

  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

  const Icon = typeIcons[note.type as keyof typeof typeIcons];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {typeLabels[note.type as keyof typeof typeLabels]}
          </h1>
          <p className="text-muted-foreground">
            {formatSmartDate(note.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareDialog note={note as any} />
          <NoteActions noteId={note.id} />
        </div>
      </div>

      {note.book && (
        <div className="flex items-center gap-2">
          <Link href={`/books/${note.book.id}`} className="text-sm text-muted-foreground hover:text-foreground">
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

      {note.image_url && (
        <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden rounded-lg bg-muted">
          <Image
            src={getImageUrl(note.image_url)}
            alt={note.type}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {note.content && (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{note.content}</p>
        </div>
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
  // params.id 검증
  if (!params?.id || typeof params.id !== 'string') {
    return {
      title: "기록 상세 | Habitree Reading Hub",
    };
  }

  // UUID 검증
  if (!isValidUUID(params.id)) {
    return {
      title: "기록 상세 | Habitree Reading Hub",
    };
  }

  try {
    const note = await getNoteDetail(params.id);
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

