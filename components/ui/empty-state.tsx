import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  actionVariant?: "default" | "outline" | "secondary";
}

/**
 * 빈 상태 컴포넌트
 * 데이터가 없을 때 사용자에게 명확한 안내와 다음 행동을 제시합니다.
 * 
 * UX 원칙 (디자인 가이드 기반):
 * - 명확한 메시지 전달 (간결한 문구)
 * - 다음 행동 제시 (전체 너비 버튼)
 * - 시각적 아이콘으로 맥락 제공 (색상 구분)
 * - 적절한 여백 (8dp 그리드 시스템)
 * - 시각적 계층 구조
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionVariant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        // 8dp 그리드 시스템: py-12 (48px), px-4 (16px)
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        // 아이콘 배경: 색상 구분으로 시각적 계층 강화
        <div className="mb-6 rounded-full bg-primary/10 p-5 ring-4 ring-primary/5">
          <Icon className="h-10 w-10 text-primary" />
        </div>
      )}
      
      {/* 타이포그래피 위계: 제목은 크고 굵게 */}
      <h3 className="text-xl font-bold mb-3 text-foreground leading-tight">
        {title}
      </h3>
      
      {description && (
        // 본문: 적절한 줄 길이 (max-w-md = 약 28rem = 448px, 한글 약 20-30자)
        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
          {description}
        </p>
      )}
      
      {/* CTA: 전체 너비 버튼 (UX 원칙 06) */}
      {action && (
        action.href ? (
          <Button
            asChild
            variant={actionVariant}
            fullWidth
            className="max-w-sm"
          >
            <Link href={action.href}>
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button
            variant={actionVariant}
            onClick={action.onClick}
            fullWidth
            className="max-w-sm"
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

