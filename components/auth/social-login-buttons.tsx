"use client";

import { signInWithKakao, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * 소셜 로그인 버튼 컴포넌트
 * 카카오톡, 구글 로그인 버튼 제공
 */
export function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<"kakao" | "google" | null>(null);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading("kakao");
      await signInWithKakao();
      // redirect()가 성공하면 여기까지 도달하지 않음
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
    } catch (error: unknown) {
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
      // 이 예외는 무시하고 리다이렉트를 기다림
      // Next.js의 redirect()는 특별한 타입의 예외를 던지므로
      // 에러 메시지나 타입으로 확인
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        // 리다이렉트가 진행 중이므로 로딩 상태 유지
        // 에러를 표시하지 않음
        return;
      }
      
      // 실제 에러인 경우에만 처리
      console.error("카카오톡 로그인 오류:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "카카오톡 로그인에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading("google");
      await signInWithGoogle();
      // redirect()가 성공하면 여기까지 도달하지 않음
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
    } catch (error: unknown) {
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
      // 이 예외는 무시하고 리다이렉트를 기다림
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        // 리다이렉트가 진행 중이므로 로딩 상태 유지
        // 에러를 표시하지 않음
        return;
      }
      
      // 실제 에러인 경우에만 처리
      console.error("구글 로그인 오류:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "구글 로그인에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleKakaoLogin}
        disabled={isLoading !== null}
        className="w-full bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90"
        size="lg"
      >
        {isLoading === "kakao" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : (
          "카카오톡으로 시작하기"
        )}
      </Button>

      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading !== null}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {isLoading === "google" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : (
          "구글로 시작하기"
        )}
      </Button>
    </div>
  );
}

