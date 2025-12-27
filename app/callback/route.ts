import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * OAuth 콜백 처리
 * Supabase Auth의 OAuth 인증 완료 후 호출되는 엔드포인트
 * 
 * 처리 순서:
 * 1. OAuth 코드를 세션으로 교환
 * 2. 사용자 프로필 자동 생성 확인 (TASK-00의 handle_new_user 트리거)
 * 3. 온보딩 상태 확인 및 리다이렉트
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (!code) {
    // 코드가 없으면 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createServerSupabaseClient();

  try {
    // OAuth 코드를 세션으로 교환
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("OAuth 콜백 오류:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // 사용자 정보 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("사용자 정보를 가져올 수 없습니다:", userError);
      return NextResponse.redirect(
        new URL("/login?error=사용자 정보를 가져올 수 없습니다", request.url)
      );
    }

    // 사용자 프로필 확인 (TASK-00의 handle_new_user 트리거가 자동 생성)
    // 트리거가 즉시 실행되지 않을 수 있으므로 재시도 로직 추가
    let profile = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !profile) {
      const { data, error: profileError } = await supabase
        .from("users")
        .select("reading_goal")
        .eq("id", user.id)
        .single();

      if (!profileError && data) {
        profile = data;
        break;
      }

      // 프로필이 없으면 잠시 대기 후 재시도 (트리거가 실행될 시간 확보)
      if (retryCount < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      retryCount++;
    }

    // 프로필이 여전히 없으면 수동 생성 시도
    if (!profile) {
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "사용자",
        avatar_url: user.user_metadata?.avatar_url || null,
        reading_goal: 12, // 기본값
      });

      if (insertError) {
        console.error("프로필 생성 오류:", insertError);
        // 프로필 생성 실패해도 계속 진행 (RLS 정책에 따라 접근 제한될 수 있음)
      } else {
        // 프로필 생성 성공, 다시 조회
        const { data: newProfile } = await supabase
          .from("users")
          .select("reading_goal")
          .eq("id", user.id)
          .single();
        profile = newProfile;
        
        // 프로필 생성 후 관련 페이지 캐시 무효화
        revalidatePath("/");
        revalidatePath("/profile");
        revalidatePath("/dashboard");
      }
    }

    // 프로필이 생성되었거나 업데이트된 경우 캐시 무효화
    if (profile) {
      revalidatePath("/");
      revalidatePath("/profile");
      revalidatePath("/dashboard");
    }

    // 온보딩 완료 여부 확인
    // 목표가 설정되지 않았으면 온보딩으로 리다이렉트
    if (!profile || !profile.reading_goal || profile.reading_goal === 0) {
      return NextResponse.redirect(new URL("/onboarding/goal", request.url));
    }

    // 온보딩 완료 시 메인으로 리다이렉트 (캐시 무효화 후)
    const redirectUrl = new URL(next, request.url);
    redirectUrl.searchParams.set("refreshed", "true"); // 클라이언트에서 새로고침 유도
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth 콜백 처리 중 예외 발생:", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
        )}`,
        request.url
      )
    );
  }
}

