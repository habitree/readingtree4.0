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
  
  // 디버깅: 환경 변수 확인
  console.log("[OCR] 환경 변수 확인:", {
    hasGeminiApiKey: !!geminiApiKey,
    geminiApiKeyLength: geminiApiKey?.length || 0,
    geminiApiKeyPreview: geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : "없음",
    hasVisionCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    visionCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "없음",
  });
  
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
    // 환경 변수 상세 확인 (디버깅용)
    const allEnvKeys = Object.keys(process.env).filter(key => 
      key.includes("GEMINI") || key.includes("GOOGLE") || key.includes("VISION")
    );
    
    const errorMessage =
      "OCR 처리를 위한 인증 정보가 없습니다.\n" +
      "다음 중 하나를 설정해주세요:\n" +
      "1. GEMINI_API_KEY (권장, 무료 한도 1,500건/일)\n" +
      "2. GOOGLE_APPLICATION_CREDENTIALS (Vision API, 서비스 계정 파일 경로)\n\n" +
      "예시:\n" +
      "- GEMINI_API_KEY=AIzaSy...\n" +
      "- GOOGLE_APPLICATION_CREDENTIALS=./habitree-f49e1-63991a2f3290.json\n\n" +
      "현재 환경 변수 상태:\n" +
      `- GEMINI_API_KEY: ${geminiApiKey ? "설정됨 (길이: " + geminiApiKey.length + ")" : "미설정"}\n` +
      `- GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPath || "미설정"}\n` +
      `- 관련 환경 변수 목록: ${allEnvKeys.length > 0 ? allEnvKeys.join(", ") : "없음"}`;
    
    console.error("[OCR] ========== OCR 인증 정보 없음 ==========");
    console.error("[OCR]", errorMessage);
    console.error("[OCR] 환경 변수 상세:", {
      geminiApiKey: geminiApiKey ? "설정됨" : "미설정",
      geminiApiKeyLength: geminiApiKey?.length || 0,
      credentialsPath: credentialsPath || "미설정",
      relatedEnvKeys: allEnvKeys,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
    });
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

