"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

/**
 * 이미지 확대 팝업 컴포넌트
 * 이미지를 클릭하면 확대된 팝업으로 표시
 */
export function ImageLightbox({ src, alt, children }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-zoom-in"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label="이미지 확대"
      >
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-black/95 border-none flex items-center justify-center">
          {/* 접근성을 위한 시각적 숨김 타이틀 */}
          <div className="sr-only">
            <DialogTitle>{alt} 확대 보기</DialogTitle>
            <DialogDescription>확대된 이미지를 확인하는 팝업입니다.</DialogDescription>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-6 right-6 z-[60] rounded-full bg-white/10 hover:bg-white/20 text-white p-3 transition-colors border border-white/20 backdrop-blur-md"
              aria-label="닫기"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={getImageUrl(src)}
                alt={alt}
                fill
                className="object-contain"
                sizes="95vw"
                priority
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

