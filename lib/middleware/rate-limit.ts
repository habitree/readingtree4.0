/**
 * Rate Limiting 미들웨어
 * API 라우트에서 사용할 수 있는 간단한 rate limiting 유틸리티
 */

interface RateLimitOptions {
  interval: number; // 제한 시간 간격 (밀리초)
  uniqueTokenPerInterval: number; // 간격당 최대 요청 수
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 등 사용 권장)
const store: RateLimitStore = {};

// 주기적으로 오래된 항목 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 1분마다 정리

export function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options;

  return {
    check: (limit: number, token: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        const key = token;

        // 기존 항목이 없거나 만료된 경우 새로 생성
        if (!store[key] || store[key].resetTime < now) {
          store[key] = {
            count: 1,
            resetTime: now + interval,
          };
          resolve();
          return;
        }

        // 제한 초과 확인
        if (store[key].count >= limit) {
          reject(new Error("Rate limit exceeded"));
          return;
        }

        // 카운트 증가
        store[key].count += 1;
        resolve();
      });
    },
  };
}

// 기본 rate limiter 인스턴스
export const defaultRateLimiter = rateLimit({
  interval: 60 * 1000, // 1분
  uniqueTokenPerInterval: 500, // 최대 500개의 고유 토큰
});

/**
 * IP 주소 기반 rate limiting
 * @param request NextRequest 객체
 * @param limit 분당 최대 요청 수
 * @returns rate limit 체크 결과
 */
export async function checkRateLimit(
  request: Request,
  limit: number = 60
): Promise<{ success: boolean; remaining?: number; resetTime?: number }> {
  // IP 주소 추출 (Vercel에서는 x-forwarded-for 헤더 사용)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  try {
    await defaultRateLimiter.check(limit, ip);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000, // 1분 후
    };
  }
}

