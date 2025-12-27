"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReadingStatus } from "@/types/book";

interface StatusFilterProps {
  currentStatus?: ReadingStatus;
}

/**
 * 상태 필터 컴포넌트
 */
export function StatusFilter({ currentStatus }: StatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/books?${params.toString()}`);
  };

  return (
    <Select
      value={currentStatus || "all"}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="상태 필터" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체</SelectItem>
        <SelectItem value="reading">읽는 중</SelectItem>
        <SelectItem value="completed">완독</SelectItem>
        <SelectItem value="paused">중단</SelectItem>
      </SelectContent>
    </Select>
  );
}

