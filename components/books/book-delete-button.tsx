"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteBook } from "@/app/actions/books";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface BookDeleteButtonProps {
  userBookId: string;
  bookTitle: string;
}

/**
 * 책 삭제 버튼 컴포넌트
 * 삭제 확인 후 책을 삭제합니다
 */
export function BookDeleteButton({ userBookId, bookTitle }: BookDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`정말 "${bookTitle}" 책을 삭제하시겠습니까?\n\n이 책의 모든 기록도 함께 삭제됩니다.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBook(userBookId);
      toast.success("책이 삭제되었습니다.");
      router.push("/books");
    } catch (error) {
      console.error("책 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "책 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          삭제 중...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          책 삭제
        </>
      )}
    </Button>
  );
}

