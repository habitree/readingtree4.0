/**
 * OCR 처리 모듈
 * Google Cloud Run OCR 서비스만 사용
 */

import { extractTextFromImage as extractWithCloudRun } from "./cloud-run-ocr";

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Google Cloud Run OCR 서비스 사용
 * 
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 * @throws Error Cloud Run OCR 실패 시
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log("[OCR] Cloud Run OCR 처리 시작");
    console.log("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    
    const text = await extractWithCloudRun(imageUrl);
    
    console.log("[OCR] OCR 처리 성공, 추출된 텍스트 길이:", text.length);
    
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    console.error("[OCR] OCR 처리 실패:", {
      error: errorMessage,
      imageUrl: imageUrl.substring(0, 100) + "...",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    throw new Error(`OCR 처리 실패: ${errorMessage}`);
  }
}

