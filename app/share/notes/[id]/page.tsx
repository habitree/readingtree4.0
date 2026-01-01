import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import { getImageUrl } from "@/lib/utils/image";
import { getAppUrl } from "@/lib/utils/url";
import { getNoteTypeLabel } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import Image from "next/image";
import type { NoteWithBook } from "@/types/note";
import { isValidUUID } from "@/lib/utils/validation";

/**
 * 공유 페이지 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // params.id 검증
  if (!params?.id || typeof params.id !== 'string') {
    return {
      title: "기록을 찾을 수 없습니다",
    };
  }

  // UUID 검증
  if (!isValidUUID(params.id)) {
    return {
      title: "기록을 찾을 수 없습니다",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: note } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("id", params.id)
    .eq("is_public", true)
    .single();

  if (!note) {
    return {
      title: "기록을 찾을 수 없습니다",
    };
  }

  const book = note.books as any;
  const bookTitle = book?.title || "제목 없음";
  const bookAuthor = book?.author || "";
  const content = note.content || "";
  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/notes/${note.id}`;
  // 내용 요약 생성 (quote/memo 구분)
  let description = content.substring(0, 160);
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null) {
      const parts: string[] = [];
      if (parsed.quote) {
        parts.push(`인상깊은 구절: ${parsed.quote.substring(0, 80)}`);
      }
      if (parsed.memo) {
        parts.push(`내 생각: ${parsed.memo.substring(0, 80)}`);
      }
      if (parts.length > 0) {
        description = parts.join(" | ");
      }
    }
  } catch {
    // JSON 파싱 실패 시 원본 사용
  }

  return {
    title: `${bookTitle} - 독서 기록`,
    description: description,
    openGraph: {
      title: `${bookTitle} - 독서 기록`,
      description: description,
      type: "article",
      url: shareUrl,
      images: book?.cover_image_url
        ? [
            {
              url: book.cover_image_url,
              width: 400,
              height: 600,
              alt: `${bookTitle} - ${bookAuthor || ""}`,
            },
          ]
        : [],
      siteName: "Habitree Reading Hub",
      // 스레드 최적화를 위한 추가 메타 태그
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: `${bookTitle} - 독서 기록`,
      description: description,
      images: book?.cover_image_url ? [book.cover_image_url] : [],
    },
  };
}

/**
 * 공유 페이지
 * 공개 기록 조회 및 Open Graph 메타 태그 제공
 */
export default async function ShareNotePage({
  params,
}: {
  params: { id: string };
}) {
  // params.id 검증
  if (!params?.id || typeof params.id !== 'string') {
    notFound();
  }

  // UUID 검증
  if (!isValidUUID(params.id)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: note, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("id", params.id)
    .eq("is_public", true)
    .single();

  if (error || !note) {
    notFound();
  }

  const noteWithBook = note as NoteWithBook;
  const bookTitle = noteWithBook.book?.title || "제목 없음";
  const bookAuthor = noteWithBook.book?.author || "";

  const hasImage = !!noteWithBook.image_url;
  const typeLabel = getNoteTypeLabel(noteWithBook.type, hasImage);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {bookTitle}
          </h1>
          {bookAuthor && (
            <p className="text-lg text-muted-foreground">{bookAuthor}</p>
          )}
        </div>

        {/* 기록 카드 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 기록 유형 */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {typeLabel}
                </Badge>
              </div>

              {/* 이미지 */}
              {noteWithBook.image_url && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={getImageUrl(noteWithBook.image_url)}
                    alt={noteWithBook.type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              {/* 내용 */}
              {noteWithBook.content && (
                <NoteContentViewer
                  content={noteWithBook.content}
                  pageNumber={noteWithBook.page_number}
                  maxLength={200}
                />
              )}

              {/* 태그 */}
              {noteWithBook.tags && noteWithBook.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(noteWithBook.tags as string[]).map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 날짜 */}
              <p className="text-sm text-muted-foreground">
                {formatSmartDate(noteWithBook.created_at)}
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

