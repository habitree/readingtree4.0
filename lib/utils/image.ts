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
 * 이미지 URL에 기본 이미지 적용 (URL이 없거나 유효하지 않을 때)
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  const defaultFallback = "/images/default-book-cover.png";
  return isValidImageUrl(url) && url ? url : fallback || defaultFallback;
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

