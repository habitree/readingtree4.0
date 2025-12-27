"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 독서 목표 설정
 * @param goal 1-100 사이의 숫자
 */
export async function setReadingGoal(goal: number) {
  // 유효성 검사
  if (goal < 1 || goal > 100) {
    throw new Error("독서 목표는 1-100 사이의 숫자여야 합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Users 테이블 업데이트
  const { error } = await supabase
    .from("users")
    .update({ reading_goal: goal })
    .eq("id", user.id);

  if (error) {
    throw new Error(`목표 설정 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * 온보딩 완료 처리
 * 로컬 스토리지에 저장하는 것은 클라이언트 사이드에서 처리
 * 서버에서는 사용자 프로필이 생성되었는지 확인
 */
export async function checkOnboardingComplete() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isComplete: false, needsGoal: true };
  }

  // Users 테이블에서 사용자 프로필 확인
  const { data: profile, error } = await supabase
    .from("users")
    .select("reading_goal")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { isComplete: false, needsGoal: true };
  }

  // 목표가 설정되어 있으면 온보딩 완료로 간주
  return {
    isComplete: profile.reading_goal !== null && profile.reading_goal > 0,
    needsGoal: !profile.reading_goal || profile.reading_goal === 0,
  };
}

