/**
 * Google Cloud Run OCR 서비스 클라이언트
 * extractTextFromImage Cloud Function을 사용한 OCR 처리
 */

import { GoogleAuth } from "google-auth-library";

const CLOUD_RUN_OCR_URL = process.env.CLOUD_RUN_OCR_URL || 
  "https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage";

/**
 * 인증 토큰 캐시 (메모리)
 * 토큰은 약 1시간 동안 유효하므로 캐싱하여 성능 최적화
 */
interface TokenCache {
  token: string;
  expiresAt: number; // 만료 시간 (밀리초)
}

let tokenCache: TokenCache | null = null;

/**
 * Cloud Run OCR 인증 토큰 가져오기
 * 동적으로 토큰을 생성하거나 캐시된 토큰을 반환
 * @returns 인증 토큰
 */
async function getAuthToken(): Promise<string | null> {
  // 1. 정적 토큰이 환경 변수에 있는 경우 (하위 호환성)
  if (process.env.CLOUD_RUN_OCR_AUTH_TOKEN) {
    return process.env.CLOUD_RUN_OCR_AUTH_TOKEN;
  }

  // 2. 서비스 계정 키가 환경 변수에 있는 경우 (동적 토큰 생성)
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      // 캐시된 토큰이 있고 아직 유효한 경우 재사용 (1분 여유)
      if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
        return tokenCache.token;
      }

      // 서비스 계정 키 파싱
      let credentials;
      try {
        credentials = typeof serviceAccountKey === 'string' 
          ? JSON.parse(serviceAccountKey) 
          : serviceAccountKey;
      } catch (parseError) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수가 유효한 JSON 형식이 아닙니다.");
      }

      // Google Auth 클라이언트 생성 및 ID 토큰 생성
      const auth = new GoogleAuth({ credentials });
      const idTokenClient = await auth.getIdTokenClient(CLOUD_RUN_OCR_URL);
      const token = await idTokenClient.idTokenProvider.fetchIdToken(CLOUD_RUN_OCR_URL);

      // 토큰 캐싱 (55분 유효)
      tokenCache = {
        token,
        expiresAt: Date.now() + 3300000,
      };

      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("[Cloud Run OCR] 동적 토큰 생성 실패:", errorMessage);
      return null;
    }
  }

  // 3. 인증 정보가 없는 경우 (공개 함수 가정)
  return null;
}

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Google Cloud Run OCR 서비스를 사용
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log("[Cloud Run OCR] OCR 처리 시작");

    // 1. 이미지 다운로드
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000), // 30초 타임아웃1
    });

    if (!imageResponse.ok) {
      throw new Error(
        `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    const buffer = await imageResponse.arrayBuffer();

    // 파일 크기 확인 (최대 10MB)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error("이미지 크기가 너무 큽니다. (최대 10MB)");
    }

    // 2. Base64 인코딩
    const base64Image = Buffer.from(buffer).toString("base64");
    
    // MIME 타입 확인
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.startsWith("image/")
      ? contentType
      : "image/jpeg";

    // 3. 요청 본문 준비
    const requestBody: { image: string; mimeType: string } = {
      image: base64Image,
      mimeType,
    };
    
    // 4. 인증 토큰 가져오기
    const authToken = await getAuthToken();
    
    // 5. 요청 헤더 준비
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    // 6. Cloud Run OCR API 호출
    const response = await fetch(CLOUD_RUN_OCR_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = null;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
      }
      
      const errorMessage = errorData?.error?.message || errorData?.message || errorText || "알 수 없는 오류";
      
      console.error("[Cloud Run OCR] API 호출 실패:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        requestSize: JSON.stringify(requestBody).length,
      });
      
      throw new Error(
        `Cloud Run OCR API 호출 실패 (${response.status}): ${errorMessage}`
      );
    }

    // 7. 응답 파싱
    const data = await response.json();
    const extractedText = data.text || data.extractedText || data.result || "";
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Cloud Run OCR에서 텍스트를 추출하지 못했습니다.");
    }

    console.log("[Cloud Run OCR] OCR 처리 성공, 텍스트 길이:", extractedText.length);

    return extractedText.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[Cloud Run OCR] OCR 처리 실패:", errorMessage);
    throw new Error(`Cloud Run OCR 처리 실패: ${errorMessage}`);
  }
}
