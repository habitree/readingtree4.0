"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NoteTypeTabs } from "./note-type-tabs";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { validateImageSize, validateImageType } from "@/lib/utils/image";
import type { NoteType } from "@/types/note";

const noteFormSchema = z.object({
  content: z.string().max(5000, "내용은 5000자 이하여야 합니다.").optional(),
  pageNumber: z.number().min(1).optional().nullable(),
  tags: z.string().optional(),
  isPublic: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  bookId: string;
  initialType?: NoteType;
}

/**
 * 기록 작성 폼 컴포넌트
 */
export function NoteForm({ bookId, initialType = "quote" }: NoteFormProps) {
  const router = useRouter();
  const [type, setType] = useState<NoteType>(initialType);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      isPublic: false,
    },
  });

  const isPublic = watch("isPublic");

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (file) => validateImageType(file) && validateImageSize(file)
    );

    if (validFiles.length === 0) {
      toast.error("유효한 이미지 파일을 선택해주세요. (최대 5MB)");
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type === "transcription" ? "transcription" : "photo");

      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("업로드 실패");
        }

        const data = await response.json();
        newImages.push(data.url);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      } catch (error) {
        console.error("이미지 업로드 오류:", error);
        toast.error(`${file.name} 업로드에 실패했습니다.`);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
    setUploadProgress({});
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: NoteFormValues) => {
    try {
      // bookId 검증
      if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
        console.error("NoteForm: bookId가 유효하지 않습니다.", { bookId });
        toast.error("책 정보를 찾을 수 없습니다. 다시 시도해주세요.");
        router.push("/books");
        return;
      }

      // 이미지가 필요한 유형인데 이미지가 없으면 에러
      if ((type === "transcription" || type === "photo") && images.length === 0) {
        toast.error("이미지를 업로드해주세요.");
        return;
      }

      // 다중 이미지 업로드 시 각각 기록 생성
      if (images.length > 0) {
        for (const imageUrl of images) {
          const result = await createNote({
            book_id: bookId,
            type,
            content: data.content || undefined,
            image_url: imageUrl,
            page_number: data.pageNumber || undefined,
            tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
            is_public: data.isPublic,
          });

          // transcription 타입이면 OCR 처리 요청
          if (type === "transcription" && result.noteId) {
            try {
              await fetch("/api/ocr", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  noteId: result.noteId,
                  imageUrl,
                }),
              });
            } catch (error) {
              console.error("OCR 요청 오류:", error);
              // OCR 요청 실패해도 기록은 저장됨
            }
          }
        }
      } else {
        // 단일 기록 생성
        await createNote({
          book_id: bookId,
          type,
          content: data.content || undefined,
          page_number: data.pageNumber || undefined,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
          is_public: data.isPublic,
        });
      }

      toast.success("기록이 저장되었습니다.");
      // router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
      // router.refresh()는 제거 - push와 동시에 호출하면 이전 페이지로 돌아가는 문제 발생
      // bookId가 유효한지 다시 한 번 확인 후 리다이렉트
      if (bookId && typeof bookId === 'string' && bookId.trim() !== '') {
        router.push(`/books/${bookId}`);
      } else {
        console.error("NoteForm: 리다이렉트 시 bookId가 유효하지 않습니다.", { bookId });
        toast.error("책 정보를 찾을 수 없습니다.");
        router.push("/books");
      }
    } catch (error) {
      console.error("기록 저장 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 저장에 실패했습니다."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <NoteTypeTabs value={type} onValueChange={setType} />

      {/* 텍스트 입력 (quote, memo) */}
      {(type === "quote" || type === "memo") && (
        <div className="space-y-2">
          <Label htmlFor="content">
            {type === "quote" ? "필사 내용" : "메모 내용"}
          </Label>
          <Textarea
            id="content"
            {...register("content")}
            placeholder={
              type === "quote"
                ? "인상 깊은 문장"
                : "생각이나 감상"
            }
            rows={8}
            className="resize-none max-w-2xl"
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>
      )}

      {/* 이미지 업로드 (transcription, photo) */}
      {(type === "transcription" || type === "photo") && (
        <div className="space-y-2">
          <Label>이미지 업로드</Label>
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
              multiple={type === "photo"}
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "업로드 중..." : "이미지 선택"}
            </Button>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={getImageUrl(url)}
                        alt={`업로드된 이미지 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {uploadProgress[index] !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                        {uploadProgress[index]}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
      <div className="flex flex-col gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || uploading}
          fullWidth
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting || uploading}
          fullWidth
        >
          취소
        </Button>
      </div>
    </form>
  );
}
