import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGoalProgress, getReadingStats, getMonthlyStats } from "@/app/actions/stats";
import { getNotes } from "@/app/actions/notes";
import { MonthlyChart } from "./monthly-chart";
import { RecentNotes } from "./recent-notes";
import { LoginSuccessToast } from "./login-success-toast";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import type { NoteWithBook } from "@/types/note";
import type { User } from "@supabase/supabase-js";
// 아이콘 추가: 시각적 계층 강화 (UX 원칙)
import { Target, BookOpen, FileText, TrendingUp, Award, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 대시보드 컨텐츠 컴포넌트 (Server Component)
 * 목표 진행률, 통계, 차트, 최근 기록 표시
 */
export default async function DashboardContent() {
  // 서버에서 사용자 정보 조회
  const user = await getCurrentUser();
  const isGuest = !user;

  // 서버에서 직접 데이터 페칭 (병렬 실행)
  const [progress, readingStats, monthly, notes] = await Promise.all([
    getGoalProgress(user),
    getReadingStats(user),
    getMonthlyStats(user),
    getNotes(undefined, undefined, user),
  ]);

  const recentNotes = (notes as NoteWithBook[]).slice(0, 5);

  return (
    <>
      {/* 로그인 성공 메시지 (클라이언트 컴포넌트) */}
      <LoginSuccessToast />

      {/* 8dp 그리드 시스템: space-y-6 = 24px 간격 */}
      <div className="space-y-6">
        {/* 게스트 사용자 안내 배너: 색상 구분으로 시각적 강조 */}
        {isGuest && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* 아이콘으로 시각적 계층 강화 */}
                  <div className="rounded-full bg-primary/10 p-2.5 shrink-0 mt-0.5">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="gap-1">
                        샘플 데이터
                      </Badge>
                    </div>
                    {/* 간결한 문구 (UX 원칙) */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      샘플 데이터를 확인 중입니다. 로그인하여 나만의 독서 기록을 시작하세요.
                    </p>
                  </div>
                </div>
                <Button asChild fullWidth className="sm:w-auto sm:min-w-[120px]">
                  <Link href="/login">로그인</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 목표 진행률: 아이콘과 색상으로 시각적 계층 강화 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* 아이콘으로 시각적 계층 강화 */}
                <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 mt-1">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="mb-1.5">올해 독서 목표</CardTitle>
                  <CardDescription className="text-base">
                    {progress ? (
                      <>
                        <span className="font-semibold text-foreground">{progress.completed}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="font-semibold text-foreground">{progress.goal}</span>
                        <span className="text-muted-foreground">권 완독</span>
                        {isGuest && <span className="ml-2 text-xs text-muted-foreground">(샘플)</span>}
                      </>
                    ) : (
                      "목표를 설정해주세요"
                    )}
                  </CardDescription>
                </div>
              </div>
              {isGuest && (
                <Badge variant="outline" className="text-xs shrink-0">샘플</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {progress && progress.goal > 0 ? (
              <div className="space-y-3">
                <Progress value={progress.progress} className="h-3" />
                {/* 불릿 포인트 스타일로 정보 구조화 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {progress.progress}% 완료
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                    {progress.remaining}권 남음
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isGuest 
                    ? "로그인하여 독서 목표를 설정하세요"
                    : "프로필에서 독서 목표를 설정하세요"}
                </p>
                {!isGuest && (
                  <Button asChild variant="outline" fullWidth className="max-w-xs">
                    <Link href="/profile">목표 설정하기</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 통계 카드: 아이콘과 색상으로 시각적 구분 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <CardDescription className="text-sm font-medium">이번 주 기록</CardDescription>
              </div>
              <CardTitle className="text-3xl font-bold">
                {readingStats?.thisWeek.notes ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
                <CardDescription className="text-sm font-medium">올해 완독</CardDescription>
              </div>
              <CardTitle className="text-3xl font-bold">
                {readingStats?.thisYear.completedBooks ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <CardDescription className="text-sm font-medium">올해 기록</CardDescription>
              </div>
              <CardTitle className="text-3xl font-bold">
                {readingStats?.thisYear.notes ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* 월별 통계 차트: 아이콘으로 시각적 계층 강화 */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 mt-1">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="mb-1.5">월별 기록 통계</CardTitle>
                <CardDescription>최근 6개월간 작성한 기록 수</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {monthly.length > 0 ? (
              <MonthlyChart data={monthly} />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  기록이 없습니다. 첫 번째 기록을 작성해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 기록: 아이콘으로 시각적 계층 강화 */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 mt-1">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="mb-1.5">최근 기록</CardTitle>
                <CardDescription>최근 작성한 기록 5개</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentNotes.length > 0 ? (
              <RecentNotes notes={recentNotes} />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  기록이 없습니다. 첫 번째 기록을 작성해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 인기 책: 아이콘과 색상으로 시각적 계층 강화 */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 mt-1">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="mb-1.5">가장 많이 기록한 책</CardTitle>
                <CardDescription>기록 수가 많은 책 Top 5</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {readingStats && readingStats.topBooks.length > 0 ? (
              <div className="space-y-2">
                {readingStats.topBooks.map((item, index) => (
                  <div
                    key={item.book.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* 순위 배지: 색상으로 시각적 구분 */}
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0",
                        index === 0 && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                        index === 1 && "bg-gray-400/20 text-gray-700 dark:text-gray-400",
                        index === 2 && "bg-orange-500/20 text-orange-700 dark:text-orange-400",
                        index >= 3 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium truncate">{item.book.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0 ml-4">
                      {item.noteCount}개 기록
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  기록한 책이 없습니다. 책을 추가하고 기록을 작성해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
