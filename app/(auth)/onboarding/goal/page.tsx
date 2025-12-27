"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setReadingGoal } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * 독서 목표 설정 페이지
 * US-003: 독서 목표 설정
 */
export default function GoalSettingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState<string>("12");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalNumber = parseInt(goal, 10);

    // 유효성 검사
    if (isNaN(goalNumber) || goalNumber < 1 || goalNumber > 100) {
      toast.error("독서 목표는 1-100 사이의 숫자여야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      await setReadingGoal(goalNumber);
      toast.success("목표가 설정되었습니다!");
      router.push("/onboarding/tutorial");
    } catch (error) {
      console.error("목표 설정 오류:", error);
      toast.error(error instanceof Error ? error.message : "목표 설정에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            독서 목표를 설정해주세요
          </CardTitle>
          <CardDescription className="text-center">
            올해 읽고 싶은 책의 수를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goal">올해 읽을 책 수</Label>
              <Input
                id="goal"
                type="number"
                min="1"
                max="100"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="예: 12"
                required
                disabled={isLoading}
                className="text-center text-2xl font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">
                1-100 사이의 숫자를 입력해주세요
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "시작하기"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

