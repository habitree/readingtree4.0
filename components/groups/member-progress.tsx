"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMemberProgress } from "@/app/actions/groups";
import { Loader2 } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";

interface MemberProgressProps {
  groupId: string;
}

/**
 * 구성원 진행 상황 컴포넌트
 * 리더만 조회 가능
 */
export function MemberProgress({ groupId }: MemberProgressProps) {
  const [progress, setProgress] = useState<
    Array<{
      user: {
        id: string;
        name: string;
        avatar_url: string | null;
      } | null; // user가 null일 수 있음
      completedBooks: number;
      notesCount: number;
      lastActivity: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [groupId]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const data = await getMemberProgress(groupId);
      setProgress(data as any);
    } catch (error) {
      console.error("진행 상황 로드 오류:", error);
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

  if (progress.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">구성원이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>구성원 진행 상황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progress
            .filter((item) => item.user) // user가 null인 경우 필터링
            .map((item) => {
              if (!item.user) return null; // 타입 가드
              return (
              <div
                key={item.user.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={item.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {item.user?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.user?.name || "알 수 없음"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      완독: {item.completedBooks}권 · 기록: {item.notesCount}개
                    </div>
                  </div>
                </div>
                {item.lastActivity && (
                  <div className="text-sm text-muted-foreground">
                    {formatSmartDate(item.lastActivity)}
                  </div>
                )}
              </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

