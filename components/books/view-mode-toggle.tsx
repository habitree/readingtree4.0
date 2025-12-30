"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid3x3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  className?: string;
}

/**
 * 표현 방식 토글 컴포넌트
 * 그리드/테이블 형태 전환
 */
export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = (searchParams.get("view") as ViewMode) || "grid";

  const handleViewChange = (view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view"); // 기본값이므로 제거
    } else {
      params.set("view", view);
    }
    router.push(`/books?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={currentView === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => handleViewChange("grid")}
        aria-label="그리드 보기"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => handleViewChange("table")}
        aria-label="테이블 보기"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

