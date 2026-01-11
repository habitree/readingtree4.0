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

      // 이미지와 폰트가 완전히 로드될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = targetElement;

      // 모든 이미지가 로드되었는지 확인
      const images = element.querySelectorAll("img");
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("이미지 로드 타임아웃"));
          }, 5000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            // 이미지 로드 실패해도 계속 진행
            resolve();
          };
        });
      });

      try {
        await Promise.all(imagePromises);
      } catch (error) {
        console.warn("일부 이미지 로드 실패, 계속 진행:", error);
      }

      // 폰트 로딩 확인
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (error) {
          console.warn("폰트 로딩 확인 실패:", error);
        }
      }

      // 추가 대기 시간 (렌더링 안정화)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // html2canvas 동적 import 및 타입 우회
      // html2canvas 타입 정의가 불완전하여 any로 타입 단언
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default as any;

      // 모바일에서는 scale을 낮춰서 성능 개선
      const isMobileDevice = isMobile();
      // 가로 고정 레이아웃이므로 모바일에서도 조금 더 높은 해상도 유지 가능하나 성능 고려
      const scale = isMobileDevice ? 2 : 3; // 해상도 향상

      // 캡처 전용 옵션 설정 (잘림 방지 및 고화질, 정확한 렌더링)
      // html2canvas 타입 정의가 완전하지 않아 any로 타입 단언
      const options: any = {
        scale: scale, // 해상도 향상
        useCORS: true,
        allowTaint: false, // 보안을 위해 false로 설정하고 useCORS 사용
        width: element.offsetWidth,
        height: element.offsetHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff", // 배경색 명시
        logging: false,
        removeContainer: false,
        imageTimeout: 15000, // 이미지 로드 타임아웃 증가
        foreignObjectRendering: false, // SVG 렌더링 문제 방지
        // onclone: 캡처 시점에 스타일 강제 적용
        onclone: (clonedDoc: Document, element: HTMLElement) => {
          // 모든 이미지 처리 (Next.js Image 컴포넌트 포함)
          const clonedImages = clonedDoc.querySelectorAll("img");
          clonedImages.forEach((img) => {
            const htmlImg = img as HTMLImageElement;
            
            // crossOrigin 속성 추가 (CORS 문제 해결)
            if (!htmlImg.crossOrigin) {
              htmlImg.crossOrigin = "anonymous";
            }
            
            // 이미지가 로드되지 않았으면 다시 로드 시도
            if (!htmlImg.complete || htmlImg.naturalWidth === 0) {
              const originalSrc = htmlImg.src;
              htmlImg.src = "";
              htmlImg.src = originalSrc;
            }
            
            // 이미지 스타일 강제 적용
            htmlImg.style.display = "block";
            htmlImg.style.maxWidth = "100%";
            htmlImg.style.height = "auto";
            htmlImg.style.objectFit = htmlImg.style.objectFit || "cover";
            
            // Next.js Image 컴포넌트의 span 래퍼 처리
            const parent = htmlImg.parentElement;
            if (parent && parent.tagName === "SPAN" && parent.style.position === "relative") {
              parent.style.display = "block";
              parent.style.width = "100%";
              parent.style.height = "100%";
            }
          });

          // 캡처 대상 요소만 스타일 강제 적용 (성능 최적화 및 오류 방지)
          // 전체 요소에 적용하면 querySelector 오류가 발생할 수 있으므로
          // 캡처 대상 요소와 그 자식 요소만 처리
          const targetElements = [element, ...Array.from(element.querySelectorAll("*"))];
          
          targetElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            
            try {
              // 원본 요소 찾기 (data 속성 또는 직접 매칭)
              let originalEl: Element | null = null;
              
              // data-capture-id가 있으면 사용
              const captureId = htmlEl.getAttribute("data-capture-id");
              if (captureId) {
                originalEl = document.querySelector(`[data-capture-id="${captureId}"]`);
              }
              
              // 원본 요소를 찾지 못했으면 현재 요소 사용
              if (!originalEl) {
                originalEl = el as Element;
              }
              
              const computedStyle = window.getComputedStyle(originalEl);
              
              // 중요한 스타일 속성 강제 적용
              htmlEl.style.fontFamily = computedStyle.fontFamily || "inherit";
              htmlEl.style.fontSize = computedStyle.fontSize || "inherit";
              htmlEl.style.fontWeight = computedStyle.fontWeight || "inherit";
              htmlEl.style.color = computedStyle.color || "inherit";
              htmlEl.style.backgroundColor = computedStyle.backgroundColor || "transparent";
              htmlEl.style.border = computedStyle.border || "none";
              htmlEl.style.borderRadius = computedStyle.borderRadius || "0";
              htmlEl.style.padding = computedStyle.padding || "0";
              htmlEl.style.margin = computedStyle.margin || "0";
              htmlEl.style.boxSizing = computedStyle.boxSizing || "border-box";
              
              // 레이아웃 관련 스타일
              if (computedStyle.display) {
                htmlEl.style.display = computedStyle.display;
              }
              if (computedStyle.flexDirection) {
                htmlEl.style.flexDirection = computedStyle.flexDirection;
              }
              if (computedStyle.alignItems) {
                htmlEl.style.alignItems = computedStyle.alignItems;
              }
              if (computedStyle.justifyContent) {
                htmlEl.style.justifyContent = computedStyle.justifyContent;
              }
            } catch (error) {
              // 스타일 적용 실패 시 무시하고 계속 진행 (오류 로그 제거)
              // console.warn("스타일 적용 실패:", error);
            }
          });
        },
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
