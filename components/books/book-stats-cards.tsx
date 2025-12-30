"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, BookMarked, CheckCircle2, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import type { BookStats } from "@/app/actions/books";

interface BookStatsCardsProps {
  stats: BookStats;
  className?: string;
}

/**
 * 책 상태별 통계 카드 컴포넌트
 * habitree.io/search 페이지의 상단 통계 카드와 유사한 형태
 */
export function BookStatsCards({ stats, className }: BookStatsCardsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statItems = [
    {
      label: "총등록",
      value: stats.total,
      icon: BookOpen,
      color: "blue",
      status: null,
    },
    {
      label: "읽는중",
      value: stats.reading,
      icon: BookMarked,
      color: "green",
      status: "reading" as const,
    },
    {
      label: "완독",
      value: stats.completed,
      icon: CheckCircle2,
      color: "purple",
      status: "completed" as const,
    },
    {
      label: "멈춤",
      value: stats.paused,
      icon: Pause,
      color: "orange",
      status: "paused" as const,
    },
  ];

  const handleClick = (status: "reading" | "completed" | "paused" | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/books?${params.toString()}`);
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {statItems.map((item) => {
        const Icon = item.icon;
        const currentStatus = searchParams.get("status");
        const isActive =
          (item.status === null && !currentStatus) ||
          (item.status !== null && currentStatus === item.status);

        const colorClasses = {
          blue: "border-l-blue-500 bg-blue-500/5",
          green: "border-l-green-500 bg-green-500/5",
          purple: "border-l-purple-500 bg-purple-500/5",
          orange: "border-l-orange-500 bg-orange-500/5",
        };

        const iconColorClasses = {
          blue: "text-blue-600",
          green: "text-green-600",
          purple: "text-purple-600",
          orange: "text-orange-600",
        };

        const iconBgClasses = {
          blue: "bg-blue-500/10",
          green: "bg-green-500/10",
          purple: "bg-purple-500/10",
          orange: "bg-orange-500/10",
        };

        return (
          <button
            key={item.label}
            onClick={() => handleClick(item.status)}
            className="w-full text-left cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
            aria-label={`${item.label}: ${item.value}권`}
          >
            <Card
              className={cn(
                "border-l-4 h-full transition-all",
                colorClasses[item.color as keyof typeof colorClasses],
                isActive && "ring-2 ring-primary shadow-md"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      iconBgClasses[item.color as keyof typeof iconBgClasses]
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        iconColorClasses[item.color as keyof typeof iconColorClasses]
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <CardDescription className="text-sm font-medium">
                    {item.label}
                  </CardDescription>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  {item.value}권
                </CardTitle>
              </CardHeader>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

