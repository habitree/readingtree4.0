"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBookshelves } from "@/app/actions/bookshelves";
import { Bookshelf } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";

interface BookshelfSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  excludeMain?: boolean;
  placeholder?: string;
}

export function BookshelfSelector({
  value,
  onValueChange,
  excludeMain = false,
  placeholder = "서재 선택",
}: BookshelfSelectorProps) {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(excludeMain ? data.filter((b) => !b.is_main) : data);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookshelves();
  }, [excludeMain]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {bookshelves.map((bookshelf) => (
          <SelectItem key={bookshelf.id} value={bookshelf.id}>
            {bookshelf.name}
            {bookshelf.is_main && " (통합)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
