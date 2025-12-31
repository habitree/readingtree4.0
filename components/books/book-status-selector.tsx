"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateBookStatus } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookStatusBadge } from "./book-status-badge";
import type { ReadingStatus } from "@/types/book";
import { Loader2 } from "lucide-react";

interface BookStatusSelectorProps {
  currentStatus: ReadingStatus;
  userBookId: string;
}

/**
 * 독서 상태 변경 컴포넌트
 * US-009: 독서 상태 관리
 */
export function BookStatusSelector({
  currentStatus,
  userBookId,
}: BookStatusSelectorProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status: ReadingStatus) => {
    if (status === currentStatus) return;

    setIsUpdating(true);
    try {
      await updateBookStatus(userBookId, status);
      toast.success("상태가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: Array<{ value: ReadingStatus; label: string }> = [
    { value: "not_started", label: "읽기전" },
    { value: "reading", label: "읽는 중" },
    { value: "completed", label: "완독" },
    { value: "rereading", label: "재독" },
    { value: "paused", label: "중단" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              변경 중...
            </>
          ) : (
            <>
              상태 변경
              <BookStatusBadge status={currentStatus} className="ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={option.value === currentStatus || isUpdating}
          >
            {option.label}
            {option.value === currentStatus && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

