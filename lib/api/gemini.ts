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
 * 책소개를 25~35자 이내의 완결된 평서문 2~3문장으로 요약
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (25~35자 이내, 완결된 평서문 2~3문장)
 */
export async function summarizeBookDescription(description: string): Promise<string> {
  if (!description || description.trim().length === 0) {
    return "";
  }

  // 이미 짧은 경우 그대로 반환
  if (description.length <= 35) {
    return description.trim();
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `다음 책소개를 다음 조건에 맞게 요약해주세요:

조건:
- 25~35자 이내의 한국어 문장
- 완결된 평서문 2문장~3문장
- 따옴표, 백틱, *, 줄바꿈, 이모지, 특수기호 사용 금지
- 문장이 완성되도록 작성
- 요약만 반환하고 다른 설명은 포함하지 마세요

책소개:
${description}`;

    const result = await model.generateContent(prompt);
    let summary = result.response.text().trim();

    // 특수문자 제거 (따옴표, 백틱, *, 줄바꿈, 이모지 등)
    summary = summary
      .replace(/["'`*]/g, "") // 따옴표, 백틱, * 제거
      .replace(/\n/g, " ") // 줄바꿈을 공백으로
      .replace(/\s+/g, " ") // 연속된 공백을 하나로
      .trim();

    // 35자 초과 시 자르기 (문장이 끊기지 않도록)
    if (summary.length > 35) {
      // 마지막 문장 부호(., !, ?) 앞에서 자르기
      const lastPeriod = summary.lastIndexOf(".", 35);
      const lastExclamation = summary.lastIndexOf("!", 35);
      const lastQuestion = summary.lastIndexOf("?", 35);
      const lastPunctuation = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastPunctuation > 25) {
        summary = summary.substring(0, lastPunctuation + 1);
      } else {
        // 문장 부호가 없거나 너무 앞에 있으면 35자에서 자르기
        summary = summary.substring(0, 35);
      }
    }

    // 25자 미만이면 원본에서 적절히 자르기
    if (summary.length < 25) {
      const truncated = description.substring(0, 35).trim();
      return truncated;
    }

    return summary;
  } catch (error) {
    console.error("[Gemini] 책소개 요약 실패:", error);
    // 오류 발생 시 원본 텍스트를 35자로 자르기
    return description.substring(0, 35).trim();
  }
}
