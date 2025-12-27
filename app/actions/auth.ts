"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/utils/url";

/**
 * 카카오톡 OAuth 로그인
 * Supabase Auth를 통해 카카오톡 로그인 URL 생성 및 리다이렉트
 */
export async function signInWithKakao() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${getAppUrl()}/callback`,
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
 */
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/callback`,
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
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }

  redirect("/login");
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

