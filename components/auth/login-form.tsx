"use client";

import { SocialLoginButtons } from "./social-login-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * 로그인 폼 컴포넌트
 * 소셜 로그인 버튼을 포함한 로그인 UI
 */
export function LoginForm() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Habitree Reading Hub
        </CardTitle>
        <CardDescription className="text-center">
          독서 기록을 관리하고 공유하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SocialLoginButtons />
        <p className="mt-6 text-xs text-center text-muted-foreground">
          로그인 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
        </p>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground hover:underline">
              이용약관
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

