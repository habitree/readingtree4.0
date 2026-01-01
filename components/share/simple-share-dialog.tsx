"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Check, Image as ImageIcon, Download, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/utils/image";
import { ShareNoteCard } from "./share-note-card";
import type { NoteWithBook } from "@/types/note";

interface SimpleShareDialogProps {
  note: NoteWithBook;
}

/**
 * 사용자 요청 기반 3버튼 공유 다이얼로그
 * 1. 링크 공유: 해당 기록 페이지 링크 복사
 * 2. 카드 복사: 고도화된 카드 디자인 자체를 이미지로 복사
 * 3. 이미지 복사: 업로드된 원본 이미지(필사/사진)만 복사 (이미지 있을 경우에만)
 */
export function SimpleShareDialog({ note }: SimpleShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  const [photoCopied, setPhotoCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 이미지가 있는지 확인 (필사/사진 타입)
  const hasImage =
    (note.type === "transcription" || note.type === "photo") &&
    !!note.image_url;

  // 공유 링크 생성
  const getShareUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (note.is_public) {
      return `${baseUrl}/share/notes/${note.id}`;
    }
    return null;
  };

  const shareUrl = getShareUrl();

  // 1. 링크 공유 (링크 복사)
  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error("공개 기록만 공유할 수 있습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("링크가 클립보드에 복사되었습니다.");

      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  // 2. 카드 복사 (디자인 캡처)
  const handleCopyCardImage = async () => {
    if (!cardRef.current) {
      toast.error("카드를 찾을 수 없습니다.");
      return;
    }

    try {
      // 캡처 모드 활성화 (더보기 버튼 숨기기 위함)
      setIsCapturing(true);

      // 상태 반영을 위해 잠깐 대기
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html2canvas = (await import("html2canvas")).default;
      const element = cardRef.current;

      // 캡처 전용 옵션 설정 (잘림 방지 및 고화질)
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // 고해상도 (레티나 대응)
        useCORS: true,
        allowTaint: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        x: 0,
        y: 0,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      canvas.toBlob(async (blob: Blob | null) => {
        setIsCapturing(false); // 캡처 모드 해제

        if (!blob) {
          toast.error("이미지 생성에 실패했습니다.");
          return;
        }

        try {
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
          setCardCopied(true);
          toast.success("카드 이미지가 클립보드에 복사되었습니다.");

          setTimeout(() => {
            setCardCopied(false);
          }, 2000);
        } catch (error) {
          console.error("이미지 복사 실패:", error);
          toast.error("이미지 복사에 실패했습니다.");
        }
      }, "image/png");
    } catch (error) {
      setIsCapturing(false);
      console.error("카드 이미지 복사 실패:", error);
      toast.error("카드 이미지 복사에 실패했습니다.");
    }
  };

  // 3. 이미지 복사 (원본 이미지)
  const handleCopyPhotoOnly = async () => {
    if (!note.image_url) {
      toast.error("이미지가 없습니다.");
      return;
    }

    try {
      const imageUrl = getImageUrl(note.image_url);

      // 이미지를 이미지 객체로 로드
      const img = new (window as any).Image();
      img.crossOrigin = "anonymous";

      const loadImage = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("이미지 로드에 실패했습니다."));
        img.src = imageUrl;
      });

      await toast.promise(loadImage, {
        loading: '원본 이미지를 준비 중입니다...',
        success: '이미지 준비 완료',
        error: '이미지를 불러오는데 실패했습니다.'
      });

      const loadedImg = await loadImage as HTMLImageElement;

      // Canvas를 사용하여 PNG로 변환 (클립보드 호환성)
      const canvas = document.createElement("canvas");
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context를 생성할 수 없습니다.");

      ctx.drawImage(loadedImg, 0, 0);

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          toast.error("이미지 변환에 실패했습니다.");
          return;
        }

        try {
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
          setPhotoCopied(true);
          toast.success("원본 이미지가 클립보드에 복사되었습니다.");

          setTimeout(() => {
            setPhotoCopied(false);
          }, 2000);
        } catch (error) {
          console.error("이미지 복사 실패:", error);
          toast.error("이미지 복사에 실패했습니다.");
        }
      }, "image/png");
    } catch (error) {
      console.error("이미지 처리 실패:", error);
      toast.error("이미지 처리에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          공유
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[98vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black italic tracking-tighter text-forest-600">Share Your Insight</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400">
              세련된 Habitree 리딩 카드로 당신의 독서 순간을 공유해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 pt-4">
            <div className="mb-10 group bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              {/* 중복 UI 제거하고 ShareNoteCard 재사용 (표준 규격 적용) */}
              <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white">
                <ShareNoteCard note={note} hideActions={isCapturing} />
              </div>
            </div>

            {/* 비공개 상태 안내 */}
            {!note.is_public && (
              <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-3xl">
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 font-bold flex gap-3">
                  <span className="shrink-0 text-xl">⚠️</span>
                  현재 비공개 설정된 기록입니다. 링크로 공유하시려면 기록 설정에서 '공개'로 변경해 주세요. (카드/이미지 복사는 가능합니다)
                </p>
              </div>
            )}

            {/* 개편된 3버튼 체계 (사이즈 확대) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. 링크 공유 */}
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? "default" : "outline"}
                className={cn(
                  "h-16 rounded-[1.25rem] gap-4 text-base font-black transition-all duration-300 shadow-sm",
                  linkCopied ? "bg-green-500 hover:bg-green-600 border-none text-white" : "border-2 hover:bg-slate-50 border-slate-200"
                )}
                disabled={!note.is_public}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-6 w-6" />
                    링크 복사됨
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-6 w-6 text-forest-600" />
                    링크 공유
                  </>
                )}
              </Button>

              {/* 2. 카드 복사 */}
              <Button
                onClick={handleCopyCardImage}
                variant={cardCopied ? "default" : "outline"}
                className={cn(
                  "h-16 rounded-[1.25rem] gap-4 text-base font-black transition-all duration-300 shadow-sm",
                  cardCopied ? "bg-forest-600 hover:bg-forest-700 border-none text-white" : "border-2 hover:bg-slate-50 border-slate-200"
                )}
              >
                {cardCopied ? (
                  <>
                    <Check className="h-6 w-6" />
                    카드 복사됨
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 text-forest-600" />
                    카드 복사
                  </>
                )}
              </Button>

              {/* 3. 이미지 복사 (필사/사진 이미지가 있는 경우에만) */}
              {hasImage && (
                <Button
                  onClick={handleCopyPhotoOnly}
                  variant={photoCopied ? "default" : "outline"}
                  className={cn(
                    "h-16 rounded-[1.25rem] gap-4 text-base font-black transition-all duration-300 shadow-sm",
                    photoCopied ? "bg-slate-900 border-none text-white" : "border-2 hover:bg-slate-50 border-slate-200"
                  )}
                >
                  {photoCopied ? (
                    <>
                      <Check className="h-6 w-6" />
                      원본 복사됨
                    </>
                  ) : (
                    <>
                      <Download className="h-6 w-6 text-forest-600" />
                      이미지 복사
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Habitree Reading Hub System v4.0
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
