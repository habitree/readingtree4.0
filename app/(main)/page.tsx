import LandingPage from "@/components/landing/landing-page";

/**
 * 메인 페이지 (랜딩 페이지)
 * 비로그인 사용자 및 초기 진입 사용자에게 서비스 가치를 전달하는 랜딩 페이지를 표시합니다.
 * 추후 로그인 상태에 따라 DashboardContent와 조건부 렌더링할 수 있습니다.
 */
export default function HomePage() {
  return <LandingPage />;
}

