"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid3x3, Table2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  className?: string;
}

/**
 * 표현 방식 토글 컴포넌트
 * 그리드/테이블 형태 전환
 * 모바일에서는 테이블 옵션 숨김 (lg 이상에서만 표시)
 */
export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(true);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg 브레이크포인트
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const currentView = (searchParams.get("view") as ViewMode) || "grid"; // 모바일 우선으로 기본값을 그리드로 변경

  const handleViewChange = (view: ViewMode) => {
    if (view === currentView) return; // 같은 뷰면 변경하지 않음
    
    const params = new URLSearchParams(searchParams.toString());
    if (view === "table") {
      params.delete("view"); // 기본값이므로 제거
    } else {
      params.set("view", view);
    }
    
    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={currentView === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => handleViewChange("grid")}
        disabled={isPending}
        aria-label="그리드 보기"
      >
        {isPending && currentView !== "grid" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Grid3x3 className="h-4 w-4" />
        )}
      </Button>
      {/* 모바일에서는 테이블 버튼 숨김 (lg 이상에서만 표시) */}
      <Button
        variant={currentView === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => handleViewChange("table")}
        disabled={isPending}
        aria-label="테이블 보기"
        className="hidden lg:flex"
      >
        {isPending && currentView !== "table" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Table2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

