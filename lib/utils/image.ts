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
 * 기본 이미지가 없을 경우 투명한 1x1 픽셀 데이터 URI 사용
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  // 유효한 URL이 있으면 그대로 반환
  if (isValidImageUrl(url) && url) {
    return url;
  }
  
  // fallback이 제공되면 사용
  if (fallback && isValidImageUrl(fallback)) {
    return fallback;
  }
  
  // 기본 fallback: 투명한 1x1 픽셀 SVG (로딩 중 깨진 이미지 아이콘 방지)
  // 실제로는 각 컴포넌트에서 placeholder를 표시하는 것이 더 나음
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

