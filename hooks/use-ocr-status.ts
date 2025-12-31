"use client";

import { useState, useEffect, useRef } from "react";
import { getTranscription } from "@/app/actions/notes";

type OCRStatus = "processing" | "completed" | "failed" | null;

interface UseOCRStatusOptions {
  noteId: string;
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: () => void;
}

/**
 * OCR 처리 상태를 확인하는 훅
 * 주기적으로 기록을 확인하여 OCR 결과가 있는지 체크
 */
export function useOCRStatus({
  noteId,
  enabled = true,
  pollInterval = 3000, // 3초마다 확인
  onComplete,
}: UseOCRStatusOptions) {
  const [status, setStatus] = useState<OCRStatus>(null);
  const pollCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const maxPolls = 20; // 최대 20회 (약 1분)

  // onComplete ref 업데이트
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled || !noteId) {
      setStatus(null);
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;
    pollCountRef.current = 0;

    const checkOCRStatus = async () => {
      if (!isMounted) return;

      try {
        const transcription = await getTranscription(noteId);
        
        if (!transcription) {
          // transcription이 없으면 처리 중
          if (pollCountRef.current === 0 && isMounted) {
            setStatus("processing");
          }
          pollCountRef.current++;

          // 최대 폴링 횟수 초과 시 실패로 처리
          if (pollCountRef.current >= maxPolls && isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
          return;
        }

        // transcription 상태에 따라 상태 설정
        if (transcription.status === "completed") {
          if (isMounted) {
            setStatus("completed");
            if (intervalId) {
              clearInterval(intervalId);
            }
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          }
        } else if (transcription.status === "failed") {
          if (isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        } else {
          // processing 상태
          if (isMounted) {
            setStatus("processing");
          }
          pollCountRef.current++;

          // 최대 폴링 횟수 초과 시 실패로 처리
          if (pollCountRef.current >= maxPolls && isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        }
      } catch (error) {
        console.error("OCR 상태 확인 오류:", error);
        if (isMounted) {
          setStatus("failed");
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      }
    };

    // 초기 확인
    checkOCRStatus();

    // 주기적으로 확인
    intervalId = setInterval(checkOCRStatus, pollInterval);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [noteId, enabled, pollInterval]);

  return { status };
}
