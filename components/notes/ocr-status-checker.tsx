"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import { toast } from "sonner";
import { OCRStatusBadge } from "./ocr-status-badge";

interface OCRStatusCheckerProps {
  noteId: string;
  noteType: string;
  hasImage: boolean;
}

/**
 * OCR 상태를 확인하고 완료 시 알림을 표시하는 컴포넌트
 */
export function OCRStatusChecker({
  noteId,
  noteType,
  hasImage,
}: OCRStatusCheckerProps) {
  const router = useRouter();
  const { status } = useOCRStatus({
    noteId,
    enabled: noteType === "transcription" && hasImage,
    pollInterval: 3000,
    onComplete: () => {
      toast.success("OCR 처리가 완료되었습니다!", {
        description: "필사 테이블에 텍스트가 저장되었습니다. 기록 상세 페이지에서 확인하세요.",
        duration: 5000,
      });
      // 페이지 새로고침하여 최신 데이터 표시
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
  });

  // OCR 처리 중인 경우에만 배지 표시
  if (status === "processing" || status === "completed") {
    return (
      <div className="flex items-center gap-2">
        <OCRStatusBadge status={status} />
      </div>
    );
  }

  return null;
}

