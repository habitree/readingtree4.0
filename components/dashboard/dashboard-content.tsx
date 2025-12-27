"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGoalProgress, getReadingStats, getMonthlyStats } from "@/app/actions/stats";
import { getNotes } from "@/app/actions/notes";
import { MonthlyChart } from "./monthly-chart";
import { RecentNotes } from "./recent-notes";
import { Loader2, AlertCircle, RefreshCw, LogIn } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

/**
 * 대시보드 컨텐츠 컴포넌트
 * 목표 진행률, 통계, 차트, 최근 기록 표시
 */
export function DashboardContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;
  const [goalProgress, setGoalProgress] = useState<{
    goal: number;
    completed: number;
    progress: number;
    remaining: number;
  } | null>(null);
  const [stats, setStats] = useState<{
    thisWeek: { notes: number };
    thisYear: { completedBooks: number; notes: number };
    topBooks: Array<{ book: any; noteCount: number }>;
  } | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<
    Array<{ month: string; count: number }>
  >([]);
  const [recentNotes, setRecentNotes] = useState<NoteWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [progress, readingStats, monthly, notes] = await Promise.all([
        getGoalProgress(),
        getReadingStats(),
        getMonthlyStats(),
        getNotes(undefined, undefined),
      ]);

      setGoalProgress(progress);
      setStats(readingStats);
      setMonthlyStats(monthly);
      setRecentNotes((notes as NoteWithBook[]).slice(0, 5));
    } catch (err) {
      const error = err instanceof Error ? err : new Error("대시보드 데이터를 불러오는데 실패했습니다.");
      setError(error);
      console.error("대시보드 데이터 로드 오류:", error);
      
      // 게스트 사용자는 인증 오류를 무시 (샘플 데이터 사용)
      if (!isGuest && (error.message.includes("로그인이 필요합니다") || error.message.includes("Unauthorized"))) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">데이터를 불러올 수 없습니다</p>
              <p className="text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 게스트 사용자 안내 배너 */}
      {isGuest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <span>샘플 데이터</span>
                </Badge>
                <p className="text-sm text-muted-foreground">
                  현재 샘플 데이터를 보고 계십니다. 로그인하여 나만의 독서 기록을 시작해보세요!
                </p>
              </div>
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목표 진행률 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>올해 독서 목표</CardTitle>
              <CardDescription>
                {goalProgress ? (
                  <>
                    {goalProgress.completed} / {goalProgress.goal}권 완독
                    {isGuest && <span className="ml-2 text-xs">(샘플)</span>}
                  </>
                ) : (
                  "목표를 설정해주세요"
                )}
              </CardDescription>
            </div>
            {isGuest && (
              <Badge variant="outline" className="text-xs">샘플</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {goalProgress ? (
            <div className="space-y-2">
              <Progress value={goalProgress.progress} className="h-4" />
              <p className="text-sm text-muted-foreground">
                {goalProgress.progress}% 완료 · {goalProgress.remaining}권 남음
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                프로필에서 독서 목표를 설정해주세요
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>이번 주 기록</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.thisWeek.notes ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>올해 완독</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.thisYear.completedBooks ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>올해 기록</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.thisYear.notes ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 월별 통계 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 기록 통계</CardTitle>
          <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyStats.length > 0 ? (
            <MonthlyChart data={monthlyStats} />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-muted-foreground">
                기록이 없습니다. 첫 번째 기록을 작성해보세요!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 기록</CardTitle>
          <CardDescription>최근 작성한 기록 5개</CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotes.length > 0 ? (
            <RecentNotes notes={recentNotes} />
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                기록이 없습니다. 첫 번째 기록을 작성해보세요!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 인기 책 */}
      <Card>
        <CardHeader>
          <CardTitle>가장 많이 기록한 책</CardTitle>
          <CardDescription>기록 수가 많은 책 Top 5</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.topBooks.length > 0 ? (
            <div className="space-y-2">
              {stats.topBooks.map((item, index) => (
                <div
                  key={item.book.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item.book.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.noteCount}개 기록
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                기록한 책이 없습니다. 책을 추가하고 기록을 작성해보세요!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

