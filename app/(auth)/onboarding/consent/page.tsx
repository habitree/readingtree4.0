"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agreeToTerms } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * 약관 동의 페이지
 * 로그인 후 첫 방문 시 약관 동의를 받는 페이지
 */
export default function ConsentPage() {
  const router = useRouter();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!termsAgreed || !privacyAgreed) {
      toast.error("이용약관과 개인정보처리방침에 모두 동의해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await agreeToTerms(termsAgreed, privacyAgreed);
      toast.success("약관 동의가 완료되었습니다!");
      router.push("/onboarding/goal");
    } catch (error) {
      console.error("약관 동의 오류:", error);
      toast.error(error instanceof Error ? error.message : "약관 동의에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            약관 동의
          </CardTitle>
          <CardDescription className="text-center">
            서비스 이용을 위해 약관에 동의해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이용약관 동의 */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  required
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      이용약관
                    </Link>
                    에 동의합니다 <span className="text-destructive">(필수)</span>
                  </span>
                </div>
              </label>
            </div>

            {/* 개인정보처리방침 동의 */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  required
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      개인정보처리방침
                    </Link>
                    에 동의합니다 <span className="text-destructive">(필수)</span>
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || !termsAgreed || !privacyAgreed}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "동의하고 시작하기"
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              약관에 동의하지 않으시면 서비스를 이용하실 수 없습니다.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

