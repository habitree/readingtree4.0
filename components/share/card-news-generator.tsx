"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ImageIcon } from "lucide-react";
import { CARD_NEWS_TEMPLATES, type CardNewsTemplate } from "@/lib/templates/card-news-templates";
import type { NoteWithBook } from "@/types/note";
import { toast } from "sonner";

interface CardNewsGeneratorProps {
  note: NoteWithBook;
  onCardNewsGenerated?: (templateId: string) => void;
}

/**
 * 카드뉴스 생성 컴포넌트
 * 템플릿 선택 및 미리보기 제공
 */
export function CardNewsGenerator({ note, onCardNewsGenerated }: CardNewsGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardNewsTemplate>(
    CARD_NEWS_TEMPLATES[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const imageUrl = `/api/share/card?noteId=${note.id}&templateId=${selectedTemplate.id}`;
      
      // 이미지 다운로드
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("이미지 생성에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `card-news-${note.id}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("카드뉴스가 다운로드되었습니다.");
      
      // 카드뉴스 생성 완료 콜백 호출
      if (onCardNewsGenerated) {
        onCardNewsGenerated(selectedTemplate.id);
      }
    } catch (error) {
      console.error("카드뉴스 다운로드 오류:", error);
      toast.error("카드뉴스 다운로드에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const previewUrl = `/api/share/card?noteId=${note.id}&templateId=${selectedTemplate.id}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">카드뉴스 생성</h3>
        <p className="text-sm text-muted-foreground">
          템플릿을 선택하고 카드뉴스를 다운로드하세요
        </p>
      </div>

      {/* 템플릿 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">템플릿 선택</label>
        <Select
          value={selectedTemplate.id}
          onValueChange={(value) => {
            const template = CARD_NEWS_TEMPLATES.find((t) => t.id === value);
            if (template) {
              setSelectedTemplate(template);
              // 템플릿 변경 시 카드뉴스 URL 업데이트
              if (onCardNewsGenerated) {
                onCardNewsGenerated(template.id);
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARD_NEWS_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 미리보기 */}
      <Card>
        <CardContent className="p-4">
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={previewUrl}
              alt="카드뉴스 미리보기"
              className="w-full h-full object-contain"
            />
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              다운로드
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

