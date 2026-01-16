"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Recharts는 클라이언트 전용이므로 dynamic import로 SSR 비활성화
const MonthlyChart = dynamic(
  () => import("./monthly-chart").then((mod) => ({ default: mod.MonthlyChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">차트를 불러오는 중...</div>
      </div>
    ),
  }
);

interface MonthlyStatsCardProps {
  monthlyData: Array<{ month: string; count: number }>;
  isGuest: boolean;
}

/**
 * 월별 기록 통계 카드 컴포넌트
 */
export function MonthlyStatsCard({ monthlyData, isGuest }: MonthlyStatsCardProps) {
  // 데이터 유효성 검사
  if (!monthlyData || !Array.isArray(monthlyData) || monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="mb-2">월별 기록 통계</CardTitle>
              <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">데이터를 불러올 수 없습니다</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              월별 통계 데이터를 불러오는 중 오류가 발생했습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 실제 데이터가 있는지 확인 (count > 0인 항목이 있는지)
  const hasValidData = monthlyData.some(
    (item) => item && typeof item.count === "number" && item.count > 0
  );

  if (!hasValidData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="mb-2">월별 기록 통계</CardTitle>
              <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              {isGuest
                ? "로그인하여 독서 기록을 남기면 이곳에 월별 통계가 그래프로 표시됩니다."
                : "독서 기록을 남기면 이곳에 월별 통계가 그래프로 표시됩니다."}
            </p>
            {isGuest && (
              <Button asChild variant="outline" className="mt-4">
                <Link href="/login">로그인하기</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2">월별 기록 통계</CardTitle>
            <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MonthlyChart data={monthlyData} />
      </CardContent>
    </Card>
  );
}
