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
 * 이메일 회원가입
 * Supabase Auth를 통해 이메일/비밀번호로 회원가입
 * 
 * 규칙: 서버 중심 세션 관리
 * - 회원가입 후 이메일 인증 링크가 자동으로 전송됨
 * - 이메일 인증 완료 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 * 
 * @param email 이메일 주소
 * @param password 비밀번호 (최소 8자)
 * @param name 사용자 이름
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = await createServerSupabaseClient();

  // 유효성 검사
  if (!email || !email.includes("@")) {
    throw new Error("유효한 이메일 주소를 입력해주세요.");
  }

  if (!password || password.length < 8) {
    throw new Error("비밀번호는 최소 8자 이상이어야 합니다.");
  }

  if (!name || name.trim().length === 0 || name.length > 100) {
    throw new Error("이름은 1-100자 사이여야 합니다.");
  }

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 회원가입 (이메일 인증 링크 자동 전송)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    // 에러 메시지 처리
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      throw new Error("이미 가입된 이메일입니다. 로그인해주세요.");
    }
    if (error.message.includes("Password")) {
      throw new Error("비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.");
    }
    throw new Error(`회원가입 실패: ${error.message}`);
  }

  // 회원가입 성공 (이메일 인증 대기 중)
  return {
    success: true,
    message: "회원가입이 완료되었습니다. 이메일 인증 링크를 확인해주세요.",
    user: data.user,
  };
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

