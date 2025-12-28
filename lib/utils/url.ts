/**
 * 애플리케이션 기본 URL 가져오기
 * 프로덕션 URL을 우선적으로 처리하고, Preview URL과 구분합니다.
 * 
 * 우선순위:
 * 1. NEXT_PUBLIC_APP_URL (수동 설정된 프로덕션 도메인 - 최우선)
 * 2. NEXT_PUBLIC_VERCEL_URL (빌드 타임에 Vercel이 자동 주입, 프로덕션 도메인인 경우)
 * 3. VERCEL_URL (런타임에 Vercel이 제공, 프로덕션 도메인인 경우)
 * 4. 기본값 (개발/프로덕션)
 */
export function getAppUrl(): string {
  // 1. 수동 설정된 프로덕션 도메인 (최우선)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. 빌드 타임에 주입되는 Vercel URL
  // VERCEL_ENV를 확인하여 프로덕션인지 판단
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    // VERCEL_ENV가 production이면 프로덕션 URL로 사용
    // Preview URL은 보통 긴 해시나 프로젝트 이름을 포함 (예: readingtree2-0-p5icpn0w1-cdhrichs-projects.vercel.app)
    // 프로덕션 도메인은 짧고 명확함 (예: readingtree2-0.vercel.app)
    const isProduction = process.env.VERCEL_ENV === "production" || 
                         vercelUrl === "readingtree2-0.vercel.app" ||
                         (!vercelUrl.includes("-p") && !vercelUrl.includes("-cdhrichs-projects"));
    
    if (isProduction) {
      return `https://${vercelUrl}`;
    }
    // Preview URL인 경우 프로덕션 기본값 사용
  }

  // 3. 런타임 Vercel URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL;
    // VERCEL_ENV가 production이면 프로덕션 URL로 사용
    const isProduction = process.env.VERCEL_ENV === "production" || 
                         vercelUrl === "readingtree2-0.vercel.app" ||
                         (!vercelUrl.includes("-p") && !vercelUrl.includes("-cdhrichs-projects"));
    
    if (isProduction) {
      return `https://${vercelUrl}`;
    }
    // Preview URL인 경우 프로덕션 기본값 사용
  }

  // 4. 기본값
  // 프로덕션 환경에서는 항상 프로덕션 도메인 사용
  return process.env.NODE_ENV === "production"
    ? "https://readingtree2-0.vercel.app" // 프로덕션 기본값 (실제 Vercel 도메인)
    : "http://localhost:3000";
}

