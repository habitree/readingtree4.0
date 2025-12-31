"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseNoteContentFields } from "@/lib/utils/note";
import { Eye } from "lucide-react";

interface NoteContentViewerProps {
  content: string | null;
  pageNumber: number | null;
  maxLength?: number;
}

/**
 * 기록 내용 뷰어 컴포넌트
 * 긴 텍스트의 경우 팝업으로 전체 내용을 볼 수 있도록 함
 */
export function NoteContentViewer({
  content,
  pageNumber,
  maxLength = 100,
}: NoteContentViewerProps) {
  const [open, setOpen] = useState(false);

  if (!content) {
    return null;
  }

  const { quote, memo } = parseNoteContentFields(content);
  const hasQuote = quote && quote.trim().length > 0;
  const hasMemo = memo && memo.trim().length > 0;

  // 인상깊은 구절 또는 내 생각 중 하나라도 길면 전체 보기 버튼 표시
  const isLong = 
    (hasQuote && quote.length > maxLength) || 
    (hasMemo && memo.length > maxLength);

  // 표시할 텍스트 생성
  const displayParts: string[] = [];
  if (hasQuote) {
    const truncatedQuote = quote.length > maxLength 
      ? quote.substring(0, maxLength) + "..."
      : quote;
    displayParts.push(`인상깊은 구절: ${truncatedQuote}`);
  }
  if (hasMemo) {
    const truncatedMemo = memo.length > maxLength 
      ? memo.substring(0, maxLength) + "..."
      : memo;
    displayParts.push(`내 생각: ${truncatedMemo}`);
  }
  if (pageNumber) {
    displayParts.push(`페이지: ${pageNumber}`);
  }

  const displayText = displayParts.join("\n");

  return (
    <div className="space-y-2">
      {displayText && (
        <p className="text-sm whitespace-pre-line line-clamp-3">
          {displayText}
        </p>
      )}
      {isLong && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Eye className="mr-1 h-3 w-3" />
              전체 보기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>기록 내용</DialogTitle>
              <DialogDescription>전체 내용을 확인하세요</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {hasQuote && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">인상깊은 구절</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {quote}
                  </p>
                </div>
              )}
              {hasMemo && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">내 생각</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {memo}
                  </p>
                </div>
              )}
              {pageNumber && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">페이지 번호</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">
                    {pageNumber}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

