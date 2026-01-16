/**
 * 이미지 URL 유효성 검증 유틸리티
 * OCR 처리 전에 이미지 URL이 유효한지 확인
 */

/**
 * 이미지 URL 유효성 검증
 * HEAD 요청을 사용하여 이미지 존재 여부 확인
 * @param imageUrl 이미지 URL
 * @param timeout 타임아웃 (밀리초, 기본값: 10초)
 * @returns 이미지가 유효하면 true, 그렇지 않으면 false
 */
export async function validateImageUrl(
  imageUrl: string,
  timeout: number = 10000
): Promise<{ valid: boolean; error?: string; status?: number }> {
  try {
    // URL 형식 검증
    try {
      new URL(imageUrl);
    } catch {
      return {
        valid: false,
        error: "유효하지 않은 URL 형식입니다.",
      };
    }

    // HEAD 요청으로 이미지 존재 여부 확인
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(imageUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ReadingTree/1.0)",
        },
      });

      clearTimeout(timeoutId);

      // 2xx 응답이면 유효
      if (response.ok) {
        // Content-Type이 이미지인지 확인
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.startsWith("image/")) {
          return { valid: true };
        } else {
          return {
            valid: false,
            error: "이미지 파일이 아닙니다.",
            status: response.status,
          };
        }
      }

      // 404 오류
      if (response.status === 404) {
        return {
          valid: false,
          error: "이미지 파일을 찾을 수 없습니다 (404). 이미지 URL이 만료되었거나 삭제되었을 수 있습니다.",
          status: 404,
        };
      }

      // 403/401 오류
      if (response.status === 403 || response.status === 401) {
        return {
          valid: false,
          error: `이미지 접근이 거부되었습니다 (${response.status}). 권한이 없거나 파일이 삭제되었을 수 있습니다.`,
          status: response.status,
        };
      }

      // 기타 오류
      return {
        valid: false,
        error: `이미지 접근 실패: ${response.status} ${response.statusText}`,
        status: response.status,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : "알 수 없는 오류";
      
      // 타임아웃 오류
      if (errorMessage.includes("aborted") || errorMessage.includes("timeout")) {
        return {
          valid: false,
          error: "이미지 다운로드 타임아웃: 이미지 서버에 연결할 수 없습니다.",
        };
      }

      // 네트워크 오류
      return {
        valid: false,
        error: `이미지 접근 실패: ${errorMessage}`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 여러 이미지 URL을 병렬로 검증
 * @param imageUrls 이미지 URL 배열
 * @param timeout 타임아웃 (밀리초)
 * @returns 검증 결과 맵 (URL -> 검증 결과)
 */
export async function validateImageUrls(
  imageUrls: string[],
  timeout: number = 10000
): Promise<Map<string, { valid: boolean; error?: string; status?: number }>> {
  const results = await Promise.allSettled(
    imageUrls.map(async (url) => {
      const validation = await validateImageUrl(url, timeout);
      return { url, validation };
    })
  );

  const resultMap = new Map<string, { valid: boolean; error?: string; status?: number }>();
  
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      resultMap.set(result.value.url, result.value.validation);
    } else {
      // Promise 자체가 실패한 경우
      const url = imageUrls[results.indexOf(result)];
      resultMap.set(url, {
        valid: false,
        error: result.reason instanceof Error ? result.reason.message : "검증 실패",
      });
    }
  });

  return resultMap;
}
