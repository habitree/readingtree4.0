"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getGoalProgress, getReadingStats, getMonthlyStats } from "@/app/actions/stats";
import { getNotes } from "@/app/actions/notes";
import { MonthlyChart } from "./monthly-chart";
import { RecentNotes } from "./recent-notes";
import { Loader2 } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

/**
 * 대시보드 컨텐츠 컴포넌트
 * 목표 진행률, 통계, 차트, 최근 기록 표시
 */
export function DashboardContent() {
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error("대시보드 데이터 로드 오류:", error);
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

  return (
    <div className="space-y-6">
      {/* 목표 진행률 */}
      {goalProgress && (
        <Card>
          <CardHeader>
            <CardTitle>올해 독서 목표</CardTitle>
            <CardDescription>
              {goalProgress.completed} / {goalProgress.goal}권 완독
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={goalProgress.progress} className="h-4" />
              <p className="text-sm text-muted-foreground">
                {goalProgress.progress}% 완료 · {goalProgress.remaining}권 남음
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>이번 주 기록</CardDescription>
              <CardTitle className="text-3xl">{stats.thisWeek.notes}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>올해 완독</CardDescription>
              <CardTitle className="text-3xl">
                {stats.thisYear.completedBooks}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>올해 기록</CardDescription>
              <CardTitle className="text-3xl">{stats.thisYear.notes}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* 월별 통계 차트 */}
      {monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>월별 기록 통계</CardTitle>
            <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={monthlyStats} />
          </CardContent>
        </Card>
      )}

      {/* 최근 기록 */}
      {recentNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>최근 기록</CardTitle>
            <CardDescription>최근 작성한 기록 5개</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentNotes notes={recentNotes} />
          </CardContent>
        </Card>
      )}

      {/* 인기 책 */}
      {stats && stats.topBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>가장 많이 기록한 책</CardTitle>
            <CardDescription>기록 수가 많은 책 Top 5</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

