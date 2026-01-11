"use client";

import { useEffect } from "react";

/**
 * 책 상세 페이지에서 해시를 처리하여 스크롤하는 컴포넌트
 * URL에 #book-info가 있으면 책 정보 영역으로 스크롤
 */
export function BookScrollHandler() {
  useEffect(() => {
    // URL 해시 확인
    const hash = window.location.hash;
    
    if (hash === "#book-info") {
      // 약간의 지연을 두고 스크롤 (페이지 로드 완료 후)
      setTimeout(() => {
        const element = document.getElementById("book-info");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return null;
}
