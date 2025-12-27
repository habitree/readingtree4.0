import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * 홈/대시보드 페이지
 * US-030, US-031: 독서 통계 및 목표 진행률
 * 
 * 보안 및 기능:
 * - 인증 확인: 미들웨어와 서버 컴포넌트에서 이중 확인
 * - 에러 처리: DashboardContent 컴포넌트 내부에서 처리
 * - 로딩 상태: DashboardContent 클라이언트 컴포넌트에서 내부적으로 관리
 * - 데이터 없음 처리: 각 섹션에서 적절한 UI 표시
 * 
 * 참고: DashboardContent는 클라이언트 컴포넌트이므로 Suspense 대신
 * 내부 로딩 상태를 사용합니다.
 */
export default async function HomePage() {
  // 서버 컴포넌트에서 인증 확인 (미들웨어와 이중 확인)
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (authError || !user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          독서 통계와 목표 진행률을 확인하세요
        </p>
      </div>

      {/* 클라이언트 컴포넌트는 내부에서 로딩 상태를 관리하므로 Suspense 불필요 */}
      <DashboardContent />
    </div>
  );
}

