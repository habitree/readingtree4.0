"use client";

import { SocialLoginButtons } from "./social-login-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      </CardContent>
    </Card>
  );
}

