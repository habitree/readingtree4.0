/**
 * 통합 OCR 처리 모듈
 * Google 서비스 계정(Vision API)만 사용
 */

import { extractTextFromImage as extractWithVision } from "./vision";

/**
 * 환경 변수 검증 (서비스 계정 파일 경로 방식만)
 * @returns 서비스 계정 파일 경로 설정 여부
 */
function checkServiceAccount(): {
  hasServiceAccount: boolean;
  credentialsPath: string | undefined;
} {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasServiceAccount = !!credentialsPath;

  return {
    hasServiceAccount,
    credentialsPath,
  };
}

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Google 서비스 계정 파일 경로 방식만 사용
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const config = checkServiceAccount();

  console.log("[OCR] Google Vision API 설정 확인:", {
    hasServiceAccount: config.hasServiceAccount,
    credentialsPath: config.credentialsPath || "미설정",
  });

  // 서비스 계정 파일 경로가 설정되어 있지 않으면 에러
  if (!config.hasServiceAccount) {
    const errorMessage =
      "Google Vision API 서비스 계정 파일 경로가 설정되지 않았습니다.\n" +
      "GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 설정해주세요.\n" +
      "예: GOOGLE_APPLICATION_CREDENTIALS=./habitree-f49e1-63991a2f3290.json";
    
    console.error("[OCR] ========== OCR 인증 정보 없음 ==========");
    console.error("[OCR] 에러:", errorMessage);
    console.error("[OCR] ======================================");
    
    throw new Error(errorMessage);
  }

  try {
    console.log("[OCR] Google Vision API (서비스 계정 파일 경로)로 OCR 처리 시작");
    console.log("[OCR] 서비스 계정 파일:", config.credentialsPath);
    const text = await extractWithVision(imageUrl);
    console.log("[OCR] Google Vision API OCR 처리 성공, 추출된 텍스트 길이:", text.length);
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    console.error("[OCR] ========== Google Vision API OCR 처리 실패 ==========");
    console.error("[OCR] 사용 방법: 서비스 계정 파일 경로");
    console.error("[OCR] 서비스 계정 파일:", config.credentialsPath);
    console.error("[OCR] 에러 메시지:", errorMessage);
    console.error("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    if (error instanceof Error) {
      console.error("[OCR] 스택 트레이스:", error.stack);
    }
    console.error("[OCR] ====================================================");
    
    throw new Error(`Google Vision API OCR 처리 실패: ${errorMessage}`);
  }
}

