/**
 * 이미지 처리 유틸리티 함수들
 */

/**
 * 이미지 URL이 유효한지 확인
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * HTTP URL을 HTTPS로 변환
 * Mixed Content 경고 방지를 위해 HTTP 이미지 URL을 HTTPS로 변환
 */
export function convertToHttps(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    // HTTP인 경우 HTTPS로 변환
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
      return urlObj.toString();
    }
    return url;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url;
  }
}

/**
 * 이미지 URL에 기본 이미지 적용 (URL이 없거나 유효하지 않을 때)
 * 기본 이미지가 없을 경우 투명한 1x1 픽셀 데이터 URI 사용
 * HTTP URL은 자동으로 HTTPS로 변환
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  // 빈 값 처리
  if (!url) {
    if (fallback && (isValidImageUrl(fallback) || fallback.startsWith("/"))) {
      return fallback.startsWith("/") ? fallback : convertToHttps(fallback);
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  }

  // 절대 경로 URL인 경우 HTTPS 변환
  if (isValidImageUrl(url)) {
    return convertToHttps(url);
  }

  // 상대 경로(/로 시작)인 경우 그대로 반환
  if (url.startsWith("/")) {
    return url;
  }

  // 기본 fallback
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
}

/**
 * Supabase Storage URL 생성
 */
export function getSupabaseImageUrl(
  bucket: string,
  path: string,
  supabaseUrl?: string
): string {
  const baseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * 이미지 파일 크기 검증 (최대 5MB)
 */
export function validateImageSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일 형식 검증
 */
export function validateImageType(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환 (예: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * 이미지 URL을 Next.js 이미지 최적화 API를 통해 프록시 처리된 URL로 변환
 * CORS 문제를 우회하기 위해 사용 (Next.js 서버가 대신 이미지를 가져옴)
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  const originalUrl = getImageUrl(url);

  // 데이터 URI나 로컬 경로는 그대로 반환
  if (originalUrl.startsWith("data:") || originalUrl.startsWith("/")) {
    return originalUrl;
  }

  // Next.js Image Optimization API URL 구성
  // w=640, q=75는 적절한 기본값
  return `/_next/image?url=${encodeURIComponent(originalUrl)}&w=640&q=75`;
}
