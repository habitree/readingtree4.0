"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Calendar } from "lucide-react";
import { updateBookInfo } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookInfoEditorProps {
  userBookId: string;
  currentReadingReason?: string | null;
  currentStartedAt?: string | null;
}

/**
 * 책 정보 편집 컴포넌트
 * 읽는 이유와 시작일을 편집할 수 있음
 */
export function BookInfoEditor({
  userBookId,
  currentReadingReason,
  currentStartedAt,
}: BookInfoEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readingReason, setReadingReason] = useState(currentReadingReason || "");
  const [startedAt, setStartedAt] = useState(
    currentStartedAt ? new Date(currentStartedAt).toISOString().split("T")[0] : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const startedAtISO = startedAt
        ? new Date(startedAt).toISOString()
        : null;

      await updateBookInfo(
        userBookId,
        readingReason || null,
        startedAtISO
      );

      toast.success("책 정보가 업데이트되었습니다.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "책 정보 업데이트에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          정보 수정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>책 정보 수정</DialogTitle>
            <DialogDescription>
              읽는 이유와 시작일을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reading-reason">읽는 이유</Label>
              <Textarea
                id="reading-reason"
                placeholder="이 책을 읽는 이유를 입력하세요..."
                value={readingReason}
                onChange={(e) => setReadingReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                이 책을 읽게 된 계기나 목적을 자유롭게 작성해주세요.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="started-at">시작일</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="started-at"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                이 책을 읽기 시작한 날짜를 선택하세요.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

