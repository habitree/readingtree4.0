"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookshelfWithStats } from "@/types/bookshelf";
import { BookOpen, CheckCircle2, Pause, Play, RotateCcw } from "lucide-react";

interface BookshelfStatsProps {
  bookshelf: BookshelfWithStats;
}

export function BookshelfStats({ bookshelf }: BookshelfStatsProps) {
  const stats = [
    {
      label: "전체",
      value: bookshelf.book_count,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "읽는 중",
      value: bookshelf.reading_count,
      icon: Play,
      color: "text-blue-500",
    },
    {
      label: "완독",
      value: bookshelf.completed_count,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "일시정지",
      value: bookshelf.paused_count,
      icon: Pause,
      color: "text-yellow-500",
    },
    {
      label: "재독",
      value: bookshelf.rereading_count,
      icon: RotateCcw,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
