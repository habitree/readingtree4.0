/**
 * 통합 OCR 처리 모듈
 * Cloud Run OCR만 사용 (단일 OCR 제공자)
 */

import { extractTextFromImage as extractWithCloudRun } from "./cloud-run-ocr";

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Cloud Run OCR만 사용
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 * @throws Error Cloud Run OCR 실패 시
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // 환경 변수 확인
  const cloudRunUrl = process.env.CLOUD_RUN_OCR_URL;
  const cloudRunAuthToken = process.env.CLOUD_RUN_OCR_AUTH_TOKEN;
  
  console.log("[OCR] ========== Cloud Run OCR 환경 변수 확인 ==========");
  console.log("[OCR] CLOUD_RUN_OCR_URL:", cloudRunUrl || "기본값 사용");
  console.log("[OCR] CLOUD_RUN_OCR_AUTH_TOKEN:", cloudRunAuthToken ? "설정됨" : "미설정 (공개 함수 가정)");
  console.log("[OCR] ================================================");

  // Cloud Run OCR만 사용
  try {
    console.log("[OCR] ========== Cloud Run OCR로 OCR 처리 시작 ==========");
    console.log("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    
    const text = await extractWithCloudRun(imageUrl);
    
    console.log("[OCR] Cloud Run OCR 성공!");
    console.log("[OCR] 추출된 텍스트 길이:", text.length);
    console.log("[OCR] ================================================");
    
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    console.error("[OCR] ========== Cloud Run OCR 실패 ==========");
    console.error("[OCR] 에러:", errorMessage);
    console.error("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    console.error("[OCR] 환경 변수 상태:", {
      cloudRunUrl: cloudRunUrl || "기본값 사용",
      cloudRunAuthToken: cloudRunAuthToken ? "설정됨" : "미설정",
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
    });
    if (error instanceof Error) {
      console.error("[OCR] 스택 트레이스:", error.stack);
    }
    console.error("[OCR] ================================================");
    
    // Cloud Run OCR만 사용하므로 실패 시 즉시 에러 반환
    throw new Error(`Cloud Run OCR 처리 실패: ${errorMessage}`);
  }
}

