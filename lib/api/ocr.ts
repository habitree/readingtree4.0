/**
 * 통합 OCR 처리 모듈
 * Cloud Run OCR 우선, Gemini API 폴백, Vision API 최종 폴백
 */

import { extractTextFromImage as extractWithCloudRun } from "./cloud-run-ocr";
import { extractTextFromImage as extractWithGemini } from "./gemini";
import { extractTextFromImage as extractWithVision } from "./vision";

/**
 * 이미지에서 텍스트 추출 (OCR)
 * 1순위: Cloud Run OCR (Google Cloud Functions)
 * 2순위: Gemini API
 * 3순위: Vision API
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // 디버깅: 환경 변수 확인
  const cloudRunUrl = process.env.CLOUD_RUN_OCR_URL;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const visionCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  console.log("[OCR] 환경 변수 확인:", {
    hasCloudRunUrl: !!cloudRunUrl,
    cloudRunUrl: cloudRunUrl || "기본값 사용",
    hasGeminiApiKey: !!geminiApiKey,
    geminiApiKeyLength: geminiApiKey?.length || 0,
    hasVisionCredentials: !!visionCredentialsPath,
    visionCredentialsPath: visionCredentialsPath || "없음",
  });

  // 1. Cloud Run OCR 우선 시도
  const defaultCloudRunUrl = "https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage";
  const cloudRunOcrUrl = cloudRunUrl || defaultCloudRunUrl;
  
  // Cloud Run OCR은 항상 시도 (기본 URL이 있으므로)
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
    console.error("[OCR] Gemini API로 폴백 시도...");
    console.error("[OCR] ========================================");
    
    // Cloud Run 실패 시 Gemini API로 계속 진행
  }

  // 2. Gemini API 폴백
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
  
  // 3. Vision API 최종 폴백
  if (!visionCredentialsPath) {
    // 환경 변수 상세 확인 (디버깅용)
    const allEnvKeys = Object.keys(process.env).filter(key => 
      key.includes("CLOUD_RUN") || key.includes("GEMINI") || key.includes("GOOGLE") || key.includes("VISION")
    );
    
    const errorMessage =
      "OCR 처리를 위한 인증 정보가 없습니다.\n" +
      "다음 중 하나를 설정해주세요:\n" +
      "1. CLOUD_RUN_OCR_URL (권장, Google Cloud Run OCR 서비스 URL)\n" +
      "2. GEMINI_API_KEY (무료 한도 1,500건/일)\n" +
      "3. GOOGLE_APPLICATION_CREDENTIALS (Vision API, 서비스 계정 파일 경로)\n\n" +
      "예시:\n" +
      "- CLOUD_RUN_OCR_URL=https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage\n" +
      "- GEMINI_API_KEY=AIzaSy...\n" +
      "- GOOGLE_APPLICATION_CREDENTIALS=./habitree-f49e1-63991a2f3290.json\n\n" +
      "현재 환경 변수 상태:\n" +
      `- CLOUD_RUN_OCR_URL: ${cloudRunUrl || "기본값 사용"}\n` +
      `- GEMINI_API_KEY: ${geminiApiKey ? "설정됨 (길이: " + geminiApiKey.length + ")" : "미설정"}\n` +
      `- GOOGLE_APPLICATION_CREDENTIALS: ${visionCredentialsPath || "미설정"}\n` +
      `- 관련 환경 변수 목록: ${allEnvKeys.length > 0 ? allEnvKeys.join(", ") : "없음"}`;
    
    console.error("[OCR] ========== OCR 인증 정보 없음 ==========");
    console.error("[OCR]", errorMessage);
    console.error("[OCR] 환경 변수 상세:", {
      cloudRunUrl: cloudRunUrl || "기본값 사용",
      geminiApiKey: geminiApiKey ? "설정됨" : "미설정",
      geminiApiKeyLength: geminiApiKey?.length || 0,
      credentialsPath: visionCredentialsPath || "미설정",
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
    console.log("[OCR] 서비스 계정 파일:", visionCredentialsPath);
    console.log("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    
    const text = await extractWithVision(imageUrl);
    
    console.log("[OCR] Vision API 성공!");
    console.log("[OCR] 추출된 텍스트 길이:", text.length);
    console.log("[OCR] ================================================");
    
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    console.error("[OCR] ========== Vision API OCR 처리 실패 ==========");
    console.error("[OCR] 서비스 계정 파일:", visionCredentialsPath);
    console.error("[OCR] 에러 메시지:", errorMessage);
    console.error("[OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    if (error instanceof Error) {
      console.error("[OCR] 스택 트레이스:", error.stack);
    }
    console.error("[OCR] ==================================================");
    
    throw new Error(`OCR 처리 실패 (Cloud Run & Gemini & Vision 모두 실패): ${errorMessage}`);
  }
}

