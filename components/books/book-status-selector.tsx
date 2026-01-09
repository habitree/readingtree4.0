"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateBookStatus } from "@/app/actions/books";
import { moveBookToBookshelf, getBookshelves } from "@/app/actions/bookshelves";
import { BookshelfSelector } from "@/components/bookshelves/bookshelf-selector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookStatusBadge } from "./book-status-badge";
import type { ReadingStatus } from "@/types/book";
import { Bookshelf } from "@/types/bookshelf";
import { Loader2, BookOpen } from "lucide-react";

interface BookStatusSelectorProps {
  currentStatus: ReadingStatus;
  userBookId: string;
  currentBookshelfId?: string | null;
}

/**
 * 독서 상태 변경 컴포넌트
 * US-009: 독서 상태 관리
 */
export function BookStatusSelector({
  currentStatus,
  userBookId,
  currentBookshelfId,
}: BookStatusSelectorProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBookshelfDialog, setShowBookshelfDialog] = useState(false);
  const [selectedBookshelfId, setSelectedBookshelfId] = useState<string>(
    currentBookshelfId || ""
  );
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(false);

  useEffect(() => {
    if (showBookshelfDialog) {
      loadBookshelves();
    }
  }, [showBookshelfDialog]);

  const loadBookshelves = async () => {
    setIsLoadingBookshelves(true);
    try {
      const data = await getBookshelves();
      setBookshelves(data);
      if (!selectedBookshelfId && data.length > 0) {
        const mainBookshelf = data.find((b) => b.is_main);
        if (mainBookshelf) {
          setSelectedBookshelfId(mainBookshelf.id);
        }
      }
    } catch (error) {
      console.error("서재 목록 조회 오류:", error);
    } finally {
      setIsLoadingBookshelves(false);
    }
  };

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

  const handleBookshelfChange = async () => {
    if (!selectedBookshelfId || selectedBookshelfId === currentBookshelfId) {
      setShowBookshelfDialog(false);
      return;
    }

    setIsUpdating(true);
    try {
      await moveBookToBookshelf(userBookId, selectedBookshelfId);
      toast.success("서재가 변경되었습니다.");
      setShowBookshelfDialog(false);
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 변경에 실패했습니다."
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

  const currentBookshelf = bookshelves.find((b) => b.id === selectedBookshelfId);

  return (
    <>
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
          <DropdownMenuLabel>독서 상태</DropdownMenuLabel>
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowBookshelfDialog(true)}
            disabled={isUpdating}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            서재 변경
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showBookshelfDialog} onOpenChange={setShowBookshelfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>서재 변경</DialogTitle>
            <DialogDescription>
              이 책이 속한 서재를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bookshelf-select">서재</Label>
              {isLoadingBookshelves ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <BookshelfSelector
                  value={selectedBookshelfId}
                  onValueChange={setSelectedBookshelfId}
                  placeholder="서재를 선택하세요"
                />
              )}
              {currentBookshelf && (
                <p className="text-xs text-muted-foreground">
                  현재: {currentBookshelf.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookshelfDialog(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleBookshelfChange}
              disabled={isUpdating || !selectedBookshelfId || selectedBookshelfId === currentBookshelfId}
            >
              {isUpdating ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

