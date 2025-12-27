import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OAuth 콜백 처리
 * Supabase Auth의 OAuth 인증 완료 후 호출되는 엔드포인트
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createServerSupabaseClient();

    // OAuth 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth 콜백 오류:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // 사용자 정보 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 온보딩 완료 여부 확인
      const { data: profile } = await supabase
        .from("users")
        .select("reading_goal")
        .eq("id", user.id)
        .single();

      // 목표가 설정되지 않았으면 온보딩으로 리다이렉트
      if (!profile || !profile.reading_goal || profile.reading_goal === 0) {
        return NextResponse.redirect(new URL("/onboarding/goal", request.url));
      }

      // 온보딩 완료 시 메인으로 리다이렉트
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(new URL("/login", request.url));
}

