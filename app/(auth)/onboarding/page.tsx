import { redirect } from "next/navigation";
import { checkOnboardingComplete } from "@/app/actions/onboarding";

/**
 * 온보딩 메인 페이지
 * 목표 설정 여부에 따라 적절한 페이지로 리다이렉트
 */
export default async function OnboardingPage() {
  const { isComplete, needsGoal } = await checkOnboardingComplete();

  if (isComplete) {
    // 온보딩 완료 시 메인으로 리다이렉트
    redirect("/");
  }

  if (needsGoal) {
    // 목표 설정이 필요하면 목표 설정 페이지로
    redirect("/onboarding/goal");
  }

  // 기본적으로 목표 설정 페이지로
  redirect("/onboarding/goal");
}

