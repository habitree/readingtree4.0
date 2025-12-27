import { Badge } from "@/components/ui/badge";
import type { ReadingStatus } from "@/types/book";
import { cn } from "@/lib/utils";

interface BookStatusBadgeProps {
  status: ReadingStatus;
  className?: string;
}

/**
 * 독서 상태 배지 컴포넌트
 */
export function BookStatusBadge({ status, className }: BookStatusBadgeProps) {
  const statusConfig = {
    reading: {
      label: "읽는 중",
      variant: "default" as const,
    },
    completed: {
      label: "완독",
      variant: "secondary" as const,
    },
    paused: {
      label: "중단",
      variant: "outline" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}

