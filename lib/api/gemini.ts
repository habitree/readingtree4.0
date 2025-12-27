/**
 * Gemini API 클라이언트
 * OCR 텍스트 추출 기능 제공
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini API 인스턴스 생성
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * 이미지에서 텍스트 추출 (OCR)
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    // MIME 타입 확인
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.startsWith("image/") ? contentType : "image/jpeg";

    // OCR 요청
    const prompt = `
이 이미지에서 텍스트를 추출해주세요. 
한글과 영어를 모두 정확하게 인식하고, 
줄바꿈과 문단을 유지해주세요.
텍스트만 반환하고 다른 설명은 포함하지 마세요.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error("OCR 처리 오류:", error);
    throw new Error(
      `텍스트 추출 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

