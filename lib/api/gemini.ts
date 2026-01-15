/**
 * Gemini API 클라이언트
 * 텍스트 요약 및 AI 기능 제공
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini API 클라이언트 초기화
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 책소개를 20자 내외로 요약
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (20자 내외)
 */
export async function summarizeBookDescription(description: string): Promise<string> {
  if (!description || description.trim().length === 0) {
    return "";
  }

  // 이미 짧은 경우 그대로 반환
  if (description.length <= 20) {
    return description.trim();
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `다음 책소개를 20자 내외로 간결하게 요약해주세요. 핵심 내용만 담아주세요. 요약만 반환하고 다른 설명은 포함하지 마세요.

책소개:
${description}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    // 20자 초과 시 자르기
    if (summary.length > 25) {
      return summary.substring(0, 22) + "...";
    }

    return summary;
  } catch (error) {
    console.error("[Gemini] 책소개 요약 실패:", error);
    // 오류 발생 시 원본 텍스트를 20자로 자르기
    return description.substring(0, 20) + "...";
  }
}
