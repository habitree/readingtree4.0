/**
 * 애플리케이션 기본 URL 가져오기
 * Vercel 환경 변수를 우선적으로 사용하고, 없으면 설정된 환경 변수 또는 기본값 사용
 * 
 * 우선순위:
 * 1. NEXT_PUBLIC_VERCEL_URL (빌드 타임에 Vercel이 자동 주입)
 * 2. VERCEL_URL (런타임에 Vercel이 제공)
 * 3. NEXT_PUBLIC_APP_URL (수동 설정)
 * 4. 기본값 (개발/프로덕션)
 */
export function getAppUrl(): string {
  // 1. 빌드 타임에 주입되는 Vercel URL (가장 안정적, 빌드 타임과 런타임 모두에서 사용 가능)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 2. 런타임 Vercel URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. 수동 설정된 프로덕션 도메인
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 4. 기본값
  return process.env.NODE_ENV === "production"
    ? "https://readingtree2-0.vercel.app" // 프로덕션 기본값 (실제 Vercel 도메인)
    : "http://localhost:3000";
}

