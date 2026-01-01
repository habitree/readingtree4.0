/**
 * 디바이스 감지 유틸리티
 */

/**
 * 모바일 디바이스인지 확인
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * iOS 디바이스인지 확인
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Android 디바이스인지 확인
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  
  return /Android/.test(navigator.userAgent);
}

/**
 * Clipboard API 지원 여부 확인
 */
export function isClipboardSupported(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    "write" in navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  );
}

/**
 * 이미지를 다운로드하는 함수
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

