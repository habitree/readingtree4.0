"use client";

import { useState, useRef, useEffect } from "react";
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
import { isClipboardSupported, isMobile, isIOS, downloadImage } from "@/lib/utils/device";
import { copyImageToClipboard, isMobileClipboardSupported } from "@/lib/utils/clipboard";
import { ShareNoteCard } from "./share-note-card";
import type { NoteWithBook } from "@/types/note";
import { getUserById } from "@/app/actions/profile";
import { addStampToBlob } from "@/lib/utils/stamp";

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
  const [user, setUser] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // 캡처 전용 Hidden 요소 Ref

  // 사용자 정보 가져오기
  useEffect(() => {
    if (open && note.user_id) {
      getUserById(note.user_id).then((userData) => {
        if (userData) {
          setUser(userData);
        }
      });
    }
  }, [open, note.user_id]);

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
  const handleCopyCardImage = async (e?: React.MouseEvent) => {
    // 중복 클릭 방지
    if (isCapturing) {
      return;
    }

    // [UPDATE] 모바일/PC 모두 captureRef(가로 고정 숨김 요소)를 우선 사용
    const targetElement = captureRef.current || cardRef.current;

    if (!targetElement) {
      toast.error("카드를 찾을 수 없습니다.");
      return;
    }

    try {
      // 캡처 모드 활성화 (UI 피드백용)
      setIsCapturing(true);

      // 상태 반영 및 이미지 로딩 확보를 위해 잠깐 대기
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = targetElement;

      // html2canvas 동적 import 및 타입 우회
      // html2canvas 타입 정의가 불완전하여 any로 타입 단언
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default as any;

      // 모바일에서는 scale을 낮춰서 성능 개선
      const isMobileDevice = isMobile();
      // 가로 고정 레이아웃이므로 모바일에서도 조금 더 높은 해상도 유지 가능하나 성능 고려
      const scale = isMobileDevice ? 1.5 : 2;

      // 캡처 전용 옵션 설정 (잘림 방지 및 고화질)
      // html2canvas 타입 정의가 완전하지 않아 any로 타입 단언
      const options: any = {
        scale: scale, // 모바일에서는 낮은 해상도로 성능 개선
        useCORS: true,
        allowTaint: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        x: 0,
        y: 0,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        backgroundColor: null, // CSS 배경색 사용
        logging: false, // 모바일에서 로깅 비활성화로 성능 개선
        // [UPDATE] onclone을 통해 캡처 시점에만 강제 스타일 적용 가능하지만,
        // 별도 hidden element를 사용하는 방식이 더 안정적이므로 hidden element 사용.
      };

      const canvas = await html2canvas(element, options);

      canvas.toBlob(async (blob: Blob | null) => {
        setIsCapturing(false); // 캡처 모드 해제

        if (!blob) {
          toast.error("이미지 생성에 실패했습니다.");
          return;
        }

        // 스템프 적용
        let finalBlob = blob;
        try {
          finalBlob = await addStampToBlob(blob, new Date(note.created_at));
        } catch (stampError) {
          console.error("스탬프 적용 실패, 원본 이미지 사용:", stampError);
          // 스탬프 적용 실패 시 원본 사용
        }

        // 모바일에서 클립보드 복사 시도
        const clipboardSuccess = await copyImageToClipboard(finalBlob, {
          onSuccess: () => {
            setCardCopied(true);
            toast.success("카드 이미지가 클립보드에 복사되었습니다.");
            setTimeout(() => {
              setCardCopied(false);
            }, 2000);
          },
          onError: (error) => {
            console.log("클립보드 복사 실패, 다운로드로 fallback:", error);
          }
        });

        // 클립보드 복사 실패 시 다운로드로 fallback
        if (!clipboardSuccess) {
          try {
            const filename = `habitree-card-${note.id}-${Date.now()}.png`;
            downloadImage(finalBlob, filename);
            setCardCopied(true);
            const isMobileDevice = isMobile();
            toast.success(
              isMobileDevice 
                ? "카드 이미지가 다운로드되었습니다. 갤러리에서 확인하세요." 
                : "카드 이미지가 다운로드되었습니다."
            );

            setTimeout(() => {
              setCardCopied(false);
            }, 2000);
          } catch (downloadError) {
            console.error("다운로드도 실패:", downloadError);
            toast.error("이미지 복사에 실패했습니다. 브라우저를 확인해주세요.");
          }
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

        // 스템프 적용
        let finalBlob = blob;
        try {
          finalBlob = await addStampToBlob(blob, new Date(note.created_at));
        } catch (stampError) {
          console.error("스탬프 적용 실패, 원본 이미지 사용:", stampError);
          // 스탬프 적용 실패 시 원본 사용
        }

        // 모바일에서 클립보드 복사 시도
        const clipboardSuccess = await copyImageToClipboard(finalBlob, {
          onSuccess: () => {
            setPhotoCopied(true);
            toast.success("원본 이미지가 클립보드에 복사되었습니다.");
            setTimeout(() => {
              setPhotoCopied(false);
            }, 2000);
          },
          onError: (error) => {
            console.log("클립보드 복사 실패, 다운로드로 fallback:", error);
          }
        });

        // 클립보드 복사 실패 시 다운로드로 fallback
        if (!clipboardSuccess) {
          try {
            const filename = `habitree-image-${note.id}-${Date.now()}.png`;
            downloadImage(finalBlob, filename);
            setPhotoCopied(true);
            const isMobileDevice = isMobile();
            toast.success(
              isMobileDevice 
                ? "원본 이미지가 다운로드되었습니다. 갤러리에서 확인하세요." 
                : "원본 이미지가 다운로드되었습니다."
            );

            setTimeout(() => {
              setPhotoCopied(false);
            }, 2000);
          } catch (downloadError) {
            console.error("다운로드도 실패:", downloadError);
            toast.error("이미지 복사에 실패했습니다. 브라우저를 확인해주세요.");
          }
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
        <div className="bg-white dark:bg-slate-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="p-6 sm:p-8 pb-4">
            <DialogTitle className="text-xl sm:text-2xl font-black italic tracking-tighter text-forest-600">Share Your Insight</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400">
              세련된 Habitree 리딩 카드로 당신의 독서 순간을 공유해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-2">
            {/* 개편된 3버튼 체계 (상단으로 이동, 슬림하게 변경) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
              {/* 1. 링크 공유 */}
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                  linkCopied ? "bg-green-500 hover:bg-green-600 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                )}
                disabled={!note.is_public}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    링크 복사됨
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 text-forest-600" />
                    링크 공유
                  </>
                )}
              </Button>

              {/* 2. 카드 복사 */}
              <Button
                onClick={handleCopyCardImage}
                variant={cardCopied ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                  cardCopied ? "bg-forest-600 hover:bg-forest-700 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                )}
              >
                {cardCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    카드 복사됨
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 text-forest-600" />
                    카드 복사
                  </>
                )}
              </Button>

              {/* 3. 이미지 복사 (필사/사진 이미지가 있는 경우에만) */}
              {hasImage && (
                <Button
                  onClick={handleCopyPhotoOnly}
                  variant={photoCopied ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                    photoCopied ? "bg-slate-900 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  {photoCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      원본 복사됨
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-forest-600" />
                      이미지 복사
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mb-6 group bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              {/* 중복 UI 제거하고 ShareNoteCard 재사용 (표준 규격 적용) - 화면 표시용 (반응형) */}
              <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white">
                <ShareNoteCard note={note} hideActions={isCapturing} showTimestamp={false} user={user} />
              </div>
            </div>

            {/* [NEW] 캡처용 Hidden Card (항상 가로 모드 Force, 화면 밖 배치) */}
            <div style={{ position: "absolute", left: "-99999px", top: 0, width: "960px" }}>
              <div ref={captureRef} className="rounded-3xl overflow-hidden shadow-2xl bg-white">
                {/* fixedHorizontal=true로 가로 강제, hideActions=true로 버튼 숨김 */}
                <ShareNoteCard note={note} hideActions={true} showTimestamp={false} user={user} fixedHorizontal={true} />
              </div>
            </div>

            {/* 비공개 상태 안내 */}
            {!note.is_public && (
              <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-3xl">
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 font-medium flex gap-3">
                  <span className="shrink-0 text-xl">⚠️</span>
                  현재 비공개 설정된 기록입니다. 링크로 공유하시려면 기록 설정에서 '공개'로 변경해 주세요. (카드/이미지 복사는 가능합니다)
                </p>
              </div>
            )}
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
