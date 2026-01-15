"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, RefreshCw } from "lucide-react";
import { batchProcessOCR, getPendingOCRCount } from "@/app/actions/admin";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * OCR 배치 처리 버튼 컴포넌트
 * 관리자 전용
 */
export function BatchOCRButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckPending = async () => {
    setIsChecking(true);
    try {
      const result = await getPendingOCRCount();
      setPendingCount(result.needingOCR);
      toast.info(`OCR 처리가 필요한 기록: ${result.needingOCR}개`);
    } catch (error) {
      console.error("OCR 대기 기록 수 조회 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "OCR 대기 기록 수 조회에 실패했습니다."
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleBatchProcess = async () => {
    setIsLoading(true);
    try {
      const result = await batchProcessOCR(10); // 한 번에 10개씩 처리
      toast.success(result.message);
      setPendingCount(null); // 카운트 초기화 (다시 확인 필요)
    } catch (error) {
      console.error("OCR 배치 처리 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "OCR 배치 처리에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCheckPending}
        disabled={isChecking}
        className="inline-flex items-center gap-2"
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        대기 기록 확인
        {pendingCount !== null && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({pendingCount}개)
          </span>
        )}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className="inline-flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            OCR 배치 처리
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>OCR 배치 처리</AlertDialogTitle>
            <AlertDialogDescription>
              이미지가 있지만 OCR 처리가 안 된 모든 기록을 일괄 처리합니다.
              <br />
              <span className="text-muted-foreground text-sm">
                한 번에 최대 10개씩 처리되며, 처리 시간이 소요될 수 있습니다.
              </span>
              {pendingCount !== null && (
                <div className="mt-2 text-sm font-semibold text-primary">
                  처리 대기 중인 기록: {pendingCount}개
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchProcess}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "확인 및 실행"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
