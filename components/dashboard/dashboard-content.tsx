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
                    <span className="mr-2">로그인</span>
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
                  {progress ? (
                    <>
                      {progress.completed} / {progress.goal}권 완독
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
            {progress && progress.goal > 0 ? (
              <div className="space-y-2">
                <Progress value={progress.progress} className="h-4" />
                <p className="text-sm text-muted-foreground">
                  {progress.progress}% 완료 · {progress.remaining}권 남음
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isGuest 
                    ? "로그인하여 독서 목표를 설정해보세요"
                    : "프로필에서 독서 목표를 설정해주세요"}
                </p>
                {!isGuest && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile">목표 설정하기</Link>
                  </Button>
                )}
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
                {readingStats?.thisWeek.notes ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>올해 완독</CardDescription>
              <CardTitle className="text-3xl">
                {readingStats?.thisYear.completedBooks ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>올해 기록</CardDescription>
              <CardTitle className="text-3xl">
                {readingStats?.thisYear.notes ?? 0}
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
            {monthly.length > 0 ? (
              <MonthlyChart data={monthly} />
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
            {readingStats && readingStats.topBooks.length > 0 ? (
              <div className="space-y-2">
                {readingStats.topBooks.map((item, index) => (
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
    </>
  );
}
