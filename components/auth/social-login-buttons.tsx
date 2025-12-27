"use client";

import { signInWithKakao, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
    } catch (error) {
      console.error("카카오톡 로그인 오류:", error);
      setIsLoading(null);
      // TODO: 에러 토스트 표시
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading("google");
      await signInWithGoogle();
    } catch (error) {
      console.error("구글 로그인 오류:", error);
      setIsLoading(null);
      // TODO: 에러 토스트 표시
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

