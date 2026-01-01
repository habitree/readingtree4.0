"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { CardNewsGenerator } from "./card-news-generator";
import { ShareButtons } from "./share-buttons";
import type { NoteWithBook } from "@/types/note";

interface ShareDialogProps {
  note: NoteWithBook;
}

/**
 * 공유 다이얼로그 컴포넌트
 * 단일 기록 카드뉴스 생성 및 공유 기능 제공
 */
export function ShareDialog({ note }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [cardNewsUrl, setCardNewsUrl] = useState<string | undefined>();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const defaultCardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=default&shareType=text`;

  const handleCardNewsGenerated = (templateId: string = "default", shareType?: string) => {
    const shareTypeParam = shareType ? `&shareType=${shareType}` : "";
    const newCardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=${templateId}${shareTypeParam}`;
    setCardNewsUrl(newCardNewsUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>공유하기</DialogTitle>
          <DialogDescription>
            카드뉴스를 생성하거나 링크를 공유하세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          {/* 카드뉴스 생성 */}
          <div>
            <h3 className="text-sm font-medium mb-4">카드뉴스 생성</h3>
            <CardNewsGenerator
              note={note}
              onCardNewsGenerated={handleCardNewsGenerated}
            />
          </div>

          {/* 공유 버튼 */}
          <div>
            <h3 className="text-sm font-medium mb-4">공유하기</h3>
            <ShareButtons
              note={note}
              cardNewsUrl={cardNewsUrl || defaultCardNewsUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

