/**
 * 통합 OCR 처리 모듈
 * Gemini API 우선, Vision API 폴백
 */

import { extractTextFromImage as extractWithGemini } from "./gemini";
import { extractTextFromImage as extractWithVision } from "./vision";

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Gemini API를 우선 사용하고, 실패 시 Vision API로 폴백
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // 1. Gemini API 우선 시도
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (geminiApiKey) {
    try {
      console.log("[OCR] ========== Gemini API로 OCR 처리 시작 ==========");
      console.log("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
      
      const text = await extractWithGemini(imageUrl);
      
      console.log("[OCR] Gemini API 성공!");
      console.log("[OCR] 추출된 텍스트 길이:", text.length);
      console.log("[OCR] ================================================");
      
      return text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      
      console.error("[OCR] ========== Gemini API 실패 ==========");
      console.error("[OCR] 에러:", errorMessage);
      console.error("[OCR] Vision API로 폴백 시도...");
      console.error("[OCR] ========================================");
      
      // Gemini 실패 시 Vision API로 계속 진행
    }
  } else {
    console.warn("[OCR] GEMINI_API_KEY 미설정, Vision API로 바로 진행");
  }
  
  // 2. Vision API 폴백
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!credentialsPath) {
    const errorMessage =
      "OCR 처리를 위한 인증 정보가 없습니다.\n" +
      "다음 중 하나를 설정해주세요:\n" +
      "1. GEMINI_API_KEY (권장, 무료 한도 1,500건/일)\n" +
      "2. GOOGLE_APPLICATION_CREDENTIALS (Vision API, 서비스 계정 파일 경로)\n\n" +
      "예시:\n" +
      "- GEMINI_API_KEY=AIzaSy...\n" +
      "- GOOGLE_APPLICATION_CREDENTIALS=./habitree-f49e1-63991a2f3290.json";
    
    console.error("[OCR] ========== OCR 인증 정보 없음 ==========");
    console.error("[OCR]", errorMessage);
    console.error("[OCR] ==========================================");
    
    throw new Error(errorMessage);
  }
  
  try {
    console.log("[OCR] ========== Vision API로 OCR 처리 시작 ==========");
    console.log("[OCR] 서비스 계정 파일:", credentialsPath);
    console.log("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    
    const text = await extractWithVision(imageUrl);
    
    console.log("[OCR] Vision API 성공!");
    console.log("[OCR] 추출된 텍스트 길이:", text.length);
    console.log("[OCR] ================================================");
    
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    console.error("[OCR] ========== Vision API OCR 처리 실패 ==========");
    console.error("[OCR] 서비스 계정 파일:", credentialsPath);
    console.error("[OCR] 에러 메시지:", errorMessage);
    console.error("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    if (error instanceof Error) {
      console.error("[OCR] 스택 트레이스:", error.stack);
    }
    console.error("[OCR] ==================================================");
    
    throw new Error(`OCR 처리 실패 (Gemini & Vision 모두 실패): ${errorMessage}`);
  }
}

