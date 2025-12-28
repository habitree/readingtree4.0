"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/utils/url";

/**
 * 카카오톡 OAuth 로그인
 * Supabase Auth를 통해 카카오톡 로그인 URL 생성 및 리다이렉트
 * 
 * 규칙: 서버 중심 세션 관리
 * - OAuth 리다이렉트 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 */
export async function signInWithKakao() {
  const supabase = await createServerSupabaseClient();

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 디버깅용 로그 (프로덕션에서만)
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    console.log("[signInWithKakao] OAuth redirectTo:", {
      appUrl,
      redirectTo,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`카카오톡 로그인 실패: ${error.message}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * 구글 OAuth 로그인
 * Supabase Auth를 통해 구글 로그인 URL 생성 및 리다이렉트
 * 
 * 규칙: 서버 중심 세션 관리
 * - OAuth 리다이렉트 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 */
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 디버깅용 로그 (프로덕션에서만)
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    console.log("[signInWithGoogle] OAuth redirectTo:", {
      appUrl,
      redirectTo,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`구글 로그인 실패: ${error.message}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * 로그아웃
 * 
 * 규칙: 서버 중심 세션 관리
 * - 서버에서 세션 삭제 (쿠키도 자동 삭제됨)
 * - createServerSupabaseClient가 쿠키 삭제를 자동 처리
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }

  // 세션 삭제 후 로그인 페이지로 리다이렉트
  // 쿠키 삭제는 createServerSupabaseClient가 자동 처리
  redirect("/login");
}

/**
 * 현재 사용자 정보 조회
 * 
 * 규칙: 서버 중심 세션 관리
 * - 쿠키 기반 세션에서 사용자 정보를 읽음
 * - 모든 페이지/컴포넌트에서 사용자 정보가 필요할 때 이 함수를 사용
 * - 클라이언트에서 직접 getUser() 호출 금지
 * 
 * @returns 사용자 정보 또는 null (로그인하지 않은 경우)
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 에러가 발생하면 null 반환 (로그인하지 않은 것으로 처리)
  if (error) {
    return null;
  }

  return user;
}

