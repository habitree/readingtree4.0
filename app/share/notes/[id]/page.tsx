import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/share/share-buttons";
import { formatSmartDate } from "@/lib/utils/date";
import { getImageUrl } from "@/lib/utils/image";
import Image from "next/image";
import type { NoteWithBook } from "@/types/note";

/**
 * 공유 페이지 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
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

  const bookTitle = (note.books as any)?.title || "제목 없음";
  const bookAuthor = (note.books as any)?.author || "";
  const content = note.content || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/share/notes/${note.id}`;
  const cardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=minimal`;

  return {
    title: `${bookTitle} - 독서 기록`,
    description: content.substring(0, 160),
    openGraph: {
      title: `${bookTitle} - 독서 기록`,
      description: content.substring(0, 160),
      type: "article",
      url: shareUrl,
      images: [
        {
          url: cardNewsUrl,
          width: 1080,
          height: 1080,
          alt: bookTitle,
        },
      ],
      siteName: "Habitree Reading Hub",
    },
    twitter: {
      card: "summary_large_image",
      title: `${bookTitle} - 독서 기록`,
      description: content.substring(0, 160),
      images: [cardNewsUrl],
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=minimal`;

  const typeLabels = {
    quote: "필사",
    transcription: "필사 이미지",
    photo: "사진",
    memo: "메모",
  };

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
              {/* 기록 유형 및 페이지 */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {typeLabels[noteWithBook.type]}
                </Badge>
                {noteWithBook.page_number && (
                  <span className="text-sm text-muted-foreground">
                    {noteWithBook.page_number}페이지
                  </span>
                )}
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
                <div className="prose prose-sm max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {noteWithBook.content}
                  </p>
                </div>
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

              {/* 공유 버튼 */}
              <div className="pt-4 border-t">
                <ShareButtons note={noteWithBook} cardNewsUrl={cardNewsUrl} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

