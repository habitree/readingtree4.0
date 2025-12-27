/**
 * 재시도 유틸리티 함수
 * 지수 백오프를 사용한 재시도 로직
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryableErrors">> & { retryableErrors?: (error: Error) => boolean } = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: (error: Error) => {
    // 네트워크 오류나 일시적인 서버 오류만 재시도
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("504")
    );
  },
};

/**
 * 재시도 로직이 포함된 함수 실행
 * @param fn 실행할 함수
 * @param options 재시도 옵션
 * @returns 함수 실행 결과
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
  } = options;

  // retryableErrors는 옵셔널이므로 기본값 사용
  const retryableErrors = options.retryableErrors ?? DEFAULT_OPTIONS.retryableErrors!;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도 불가능한 오류면 즉시 throw
      if (!retryableErrors(lastError)) {
        throw lastError;
      }

      // 마지막 시도면 에러 throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 지수 백오프로 대기
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error("재시도 실패");
}

