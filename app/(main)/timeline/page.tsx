import { Suspense } from "react";
import { TimelineContent } from "@/components/timeline/timeline-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";

/**
 * 타임라인 페이지
 * US-029, US-032: 독서 타임라인 조회 및 정렬
 */
export default async function TimelinePage() {
  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();
  const isGuest = !user;

  return (
    <div className="space-y-6">
      {/* 게스트 사용자 안내 */}
      {isGuest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">샘플 데이터</Badge>
                <p className="text-sm text-muted-foreground">
                  현재 샘플 타임라인을 보고 계십니다. 로그인하여 나만의 독서 타임라인을 만들어보세요!
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">타임라인</h1>
        <p className="text-muted-foreground">
          {isGuest
            ? "샘플 독서 기록 타임라인을 확인해보세요"
            : "시간순으로 정리된 독서 기록을 확인하세요"}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
      >
        <TimelineContent />
      </Suspense>
    </div>
  );
}

