"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

const noteEditFormSchema = z.object({
  content: z.string().max(5000, "내용은 5000자 이하여야 합니다.").optional(),
  pageNumber: z.number().min(1).optional().nullable(),
  tags: z.string().optional(),
  isPublic: z.boolean(),
});

type NoteEditFormValues = z.infer<typeof noteEditFormSchema>;

interface NoteEditFormProps {
  note: NoteWithBook;
}

/**
 * 기록 수정 폼 컴포넌트
 */
export function NoteEditForm({ note }: NoteEditFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<NoteEditFormValues>({
    resolver: zodResolver(noteEditFormSchema),
    defaultValues: {
      content: note.content || "",
      pageNumber: note.page_number || null,
      tags: note.tags?.join(", ") || "",
      isPublic: note.is_public ?? false,
    },
  });

  const isPublic = watch("isPublic");

  const onSubmit = async (data: NoteEditFormValues) => {
    try {
      await updateNote(note.id, {
        content: data.content || undefined,
        page_number: data.pageNumber || undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
        is_public: data.isPublic,
      });

      toast.success("기록이 수정되었습니다.");
      // router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error("기록 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 수정에 실패했습니다."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 텍스트 입력 */}
      <div className="space-y-2">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="내용을 입력하세요..."
          rows={8}
          className="resize-none"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      {/* 페이지 번호 */}
      <div className="space-y-2">
        <Label htmlFor="pageNumber">페이지 번호 (선택)</Label>
        <Input
          id="pageNumber"
          type="number"
          min="1"
          {...register("pageNumber", { valueAsNumber: true })}
          placeholder="예: 42"
        />
        {errors.pageNumber && (
          <p className="text-sm text-destructive">{errors.pageNumber.message}</p>
        )}
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
        <Input
          id="tags"
          {...register("tags")}
          placeholder="예: 인상깊은, 명언, 철학"
        />
      </div>

      {/* 공개 설정 */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setValue("isPublic", checked)}
        />
        <Label htmlFor="isPublic">공개 설정</Label>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              수정 중...
            </>
          ) : (
            "수정"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

