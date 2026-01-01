"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { parseNoteContentFields } from "@/lib/utils/note";
import type { NoteWithBook } from "@/types/note";

interface SimpleShareDialogProps {
  note: NoteWithBook;
}

/**
 * 단순 공유 다이얼로그 컴포넌트
 * - 기본: 책 정보 + 텍스트 정보 공유
 * - 이미지 공유: 필사/사진이 있을 경우 이미지가 메인, 내 생각 추가
 * 네트워크 부하 최소화를 위해 클라이언트 사이드에서만 처리
 */
export function SimpleShareDialog({ note }: SimpleShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 이미지 공유 모드 확인 (필사/사진이고 이미지가 있는 경우)
  const isImageShareMode = 
    (note.type === "transcription" || note.type === "photo") && 
    !!note.image_url;

  // 기록 내용 파싱
  const { quote, memo } = parseNoteContentFields(note.content);
  const hasMemo = memo && memo.trim().length > 0;

  // 공유 링크 생성 (클라이언트 사이드)
  const getShareUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    
    // 공개 기록인 경우 공유 링크 생성
    if (note.is_public) {
      return `${baseUrl}/share/notes/${note.id}`;
    }
    
    // 비공개 기록인 경우 null 반환
    return null;
  };

  const shareUrl = getShareUrl();

  // 클립보드 복사
  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error("공개 기록만 공유할 수 있습니다. 기록을 공개로 설정해주세요.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다.");
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  // 이미지 파일 다운로드 및 공유 준비
  const getImageFile = async (): Promise<File | null> => {
    if (!note.image_url) return null;

    try {
      const imageUrl = getImageUrl(note.image_url);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 파일명 생성
      const fileName = `note-${note.id}.${blob.type.split('/')[1] || 'jpg'}`;
      return new File([blob], fileName, { type: blob.type });
    } catch (error) {
      console.error("이미지 파일 로드 실패:", error);
      return null;
    }
  };

  // Web Share API 사용 (모바일)
  const handleWebShare = async () => {
    if (!shareUrl) {
      toast.error("공개 기록만 공유할 수 있습니다. 기록을 공개로 설정해주세요.");
      return;
    }

    if (navigator.share) {
      try {
        const bookTitle = note.book?.title || "독서 기록";
        const shareData: ShareData = {
          title: `${bookTitle} - 독서 기록`,
          url: shareUrl,
        };

        // 이미지 공유 모드인 경우 이미지 파일 포함
        if (isImageShareMode) {
          const imageFile = await getImageFile();
          if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            shareData.files = [imageFile];
          }
          
          // 내 생각이 있으면 텍스트로 추가
          if (hasMemo) {
            shareData.text = memo;
          }
        } else {
          // 일반 모드: 텍스트만
          const content = note.content || "";
          shareData.text = content.length > 100 
            ? `${content.substring(0, 100)}...` 
            : content;
        }

        await navigator.share(shareData);
      } catch (error) {
        // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
        if ((error as Error).name !== "AbortError") {
          console.error("Web Share 오류:", error);
          toast.error("공유에 실패했습니다.");
        }
      }
    } else {
      // Web Share API를 지원하지 않는 경우 링크 복사
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={isImageShareMode ? "max-w-2xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>공유하기</DialogTitle>
          <DialogDescription>
            {isImageShareMode ? "이미지와 함께 기록을 공유하세요" : "기록을 공유하세요"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* 이미지 공유 모드: 이미지가 메인 */}
          {isImageShareMode && note.image_url && (
            <div className="space-y-4">
              {/* 메인 이미지 */}
              <div className="relative w-full aspect-[3/4] max-h-[500px] mx-auto rounded-lg overflow-hidden bg-muted border">
                <Image
                  src={getImageUrl(note.image_url)}
                  alt={note.type === "transcription" ? "필사 이미지" : "사진"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* 내 생각 (이미지 공유 모드에서는 내 생각만 표시) */}
              {hasMemo && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">내 생각</p>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {memo}
                  </p>
                </div>
              )}

              {/* 책 정보 (작게 표시) */}
              {note.book && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {note.book.cover_image_url && (
                      <img
                        src={note.book.cover_image_url}
                        alt={note.book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {note.book.title}
                      </h4>
                      {note.book.author && (
                        <p className="text-xs text-muted-foreground">
                          {note.book.author}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 일반 모드: 책 정보 + 텍스트 */}
          {!isImageShareMode && (
            <>
              {/* 책 정보 */}
              {note.book && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    {note.book.cover_image_url && (
                      <img
                        src={note.book.cover_image_url}
                        alt={note.book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {note.book.title}
                      </h4>
                      {note.book.author && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.book.author}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 기록 내용 */}
              {note.content && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  {note.page_number && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {note.page_number}페이지
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* 공개 상태 안내 */}
          {!note.is_public && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ 비공개 기록은 공유할 수 없습니다. 기록을 공개로 설정하면 링크를 공유할 수 있습니다.
              </p>
            </div>
          )}

          {/* 공유 버튼 */}
          <div className="flex gap-2">
            {shareUrl ? (
              <>
                <Button
                  onClick={handleCopyLink}
                  className="flex-1"
                  variant="outline"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      링크 복사
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleWebShare}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  toast.info("기록을 공개로 설정하면 공유할 수 있습니다.");
                  setOpen(false);
                }}
                className="w-full"
                variant="outline"
              >
                공개 설정 필요
              </Button>
            )}
          </div>

          {/* 공유 링크 표시 */}
          {shareUrl && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">공유 링크:</p>
              <p className="text-xs break-all font-mono">{shareUrl}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
