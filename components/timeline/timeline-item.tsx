import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import type { NoteWithBook } from "@/types/note";
import { FileText, PenTool, Camera, ImageIcon, BookOpen } from "lucide-react";

interface TimelineItemProps {
  note: NoteWithBook;
}

/**
 * 타임라인 아이템 컴포넌트
 * 기록을 타임라인 형식으로 표시
 */
export function TimelineItem({ note }: TimelineItemProps) {
  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
  };

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type, hasImage);
  const Icon = typeIcons[note.type];

  // books가 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
  // Supabase 조인 결과가 `books` 키로 올 수 있으므로 처리
  const bookData = (note as any).books || note.book;
  const book = Array.isArray(bookData) ? bookData[0] : bookData;
  const bookCoverImage = book?.cover_image_url;
  const hasBookCover = bookCoverImage && isValidImageUrl(bookCoverImage);
  
  // 디버깅: 책 정보 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    if (!book) {
      console.log('TimelineItem: 책 정보 없음', { 
        noteId: note.id, 
        book: note.book,
        books: (note as any).books,
        bookData 
      });
    } else {
      console.log('TimelineItem: 책 정보 있음', { 
        noteId: note.id, 
        bookTitle: book.title,
        bookCoverImage: book.cover_image_url 
      });
    }
  }

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 책 표지 이미지와 기록 이미지 겹치기 - UX 원칙 05: 깊이감 부여 */}
            <div className="relative shrink-0">
              {/* 책 표지 이미지 - 배경 레이어 */}
              {book ? (
                <div className="relative w-20 h-28 overflow-hidden rounded-lg bg-muted border shadow-md">
                  {hasBookCover ? (
                    <Image
                      src={getImageUrl(bookCoverImage!)}
                      alt={book.title || "책 표지"}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-20 h-28 overflow-hidden rounded-lg bg-muted border shadow-md flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {/* 기록 이미지 또는 아이콘 - 전면 레이어 (오프셋으로 겹치기) */}
              {note.image_url ? (
                <div className="absolute -bottom-2 -right-2 w-16 h-20 overflow-hidden rounded-lg bg-muted border-2 border-background shadow-lg">
                  <Image
                    src={getImageUrl(note.image_url)}
                    alt={note.type}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="absolute -bottom-2 -right-2 w-16 h-20 flex items-center justify-center rounded-lg bg-muted border-2 border-background shadow-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{typeLabel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatSmartDate(note.created_at)}
                </span>
              </div>

              {/* 책 정보 - 더 명확하게 표시 */}
              {book ? (
                <div className="space-y-1 pb-1 border-b">
                  <p className="text-base font-bold line-clamp-1 text-foreground">
                    {book.title || "제목 없음"}
                  </p>
                  {book.author && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                  )}
                </div>
              ) : (
                <div className="pb-1 border-b">
                  <p className="text-sm text-muted-foreground italic">책 정보 없음</p>
                </div>
              )}

              <NoteContentViewer
                content={note.content}
                pageNumber={note.page_number}
                maxLength={100}
              />

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

