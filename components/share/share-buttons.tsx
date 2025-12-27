"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Instagram, MessageCircle, Link as LinkIcon, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { NoteWithBook } from "@/types/note";

interface ShareButtonsProps {
  note: NoteWithBook;
  cardNewsUrl?: string;
}

/**
 * 공유 버튼 컴포넌트
 * 인스타그램, 카카오톡, 링크 복사 기능 제공
 */
export function ShareButtons({ note, cardNewsUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // 공유 링크 생성
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    setShareUrl(`${baseUrl}/share/notes/${note.id}`);
  }, [note.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("링크 복사 오류:", error);
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const handleInstagramShare = async () => {
    try {
      // 카드뉴스 이미지 다운로드
      if (cardNewsUrl) {
        const response = await fetch(cardNewsUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `card-news-${note.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("이미지가 다운로드되었습니다. 인스타그램에 업로드하세요.");
      } else {
        // 카드뉴스 생성 후 다운로드
        const imageUrl = `/api/share/card?noteId=${note.id}&templateId=minimal`;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `card-news-${note.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("이미지가 다운로드되었습니다. 인스타그램에 업로드하세요.");
      }
    } catch (error) {
      console.error("인스타그램 공유 오류:", error);
      toast.error("이미지 다운로드에 실패했습니다.");
    }
  };

  const handleKakaoShare = () => {
    // 카카오 SDK 로드 확인
    if (typeof window !== "undefined" && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      
      if (!Kakao.isInitialized()) {
        toast.error("카카오 SDK가 초기화되지 않았습니다.");
        return;
      }

      const bookTitle = note.book?.title || "제목 없음";
      const content = note.content || "";

      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: bookTitle,
          description: content.substring(0, 100),
          imageUrl: cardNewsUrl || `${window.location.origin}/api/share/card?noteId=${note.id}&templateId=minimal`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      });
    } else {
      toast.error("카카오 SDK가 로드되지 않았습니다.");
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.book?.title || "독서 기록",
          text: note.content || "",
          url: shareUrl,
        });
      } catch (error) {
        // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
        if ((error as Error).name !== "AbortError") {
          console.error("Web Share 오류:", error);
        }
      }
    } else {
      // Web Share API를 지원하지 않는 경우 링크 복사
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Web Share API (모바일) */}
      {typeof window !== "undefined" && typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" size="sm" onClick={handleWebShare}>
          <Share2 className="mr-2 h-4 w-4" />
          공유
        </Button>
      )}

      {/* 인스타그램 공유 */}
      <Button variant="outline" size="sm" onClick={handleInstagramShare}>
        <Instagram className="mr-2 h-4 w-4" />
        인스타그램
      </Button>

      {/* 카카오톡 공유 */}
      {typeof window !== "undefined" && (window as any).Kakao && (
        <Button variant="outline" size="sm" onClick={handleKakaoShare}>
          <MessageCircle className="mr-2 h-4 w-4" />
          카카오톡
        </Button>
      )}

      {/* 링크 복사 */}
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            복사됨
          </>
        ) : (
          <>
            <LinkIcon className="mr-2 h-4 w-4" />
            링크 복사
          </>
        )}
      </Button>
    </div>
  );
}

