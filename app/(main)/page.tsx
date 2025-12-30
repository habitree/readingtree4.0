import { Suspense } from "react";
import DashboardContent from "@/components/dashboard/dashboard-content";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * 홈/대시보드 페이지
 * US-030, US-031: 독서 통계 및 목표 진행률
 * 
 * 보안 및 기능:
 * - 인증 확인: 미들웨어와 서버 컴포넌트에서 이중 확인
 * - 에러 처리: error.tsx에서 처리
 * - 로딩 상태: Suspense로 처리
 * - 데이터 없음 처리: 각 섹션에서 적절한 UI 표시
 * 
 * 참고: DashboardContent는 Server Component이므로 Suspense로 로딩 처리합니다.
 */
export default async function HomePage() {
  // 게스트 사용자도 접근 가능하므로 리다이렉트하지 않음
  // DashboardContent 컴포넌트에서 게스트 모드를 처리함

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          독서 통계와 목표 진행률을 확인하세요
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

