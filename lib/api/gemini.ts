/**
 * Gemini API 클라이언트
 * OCR 텍스트 추출 기능 제공
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini API 인스턴스 생성
 * @returns GoogleGenerativeAI 인스턴스
 * @throws Error 환경 변수가 설정되지 않은 경우
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. 환경 변수를 확인해주세요."
    );
  }

  // API 키 형식 검증 (Gemini API 키는 보통 특정 형식을 가짐)
  if (apiKey.length < 20) {
    console.warn("[Gemini API] API 키 길이가 짧습니다. 올바른 키인지 확인해주세요.");
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
    // gemini-1.5-flash 사용 (v1beta API 호환 안정 버전)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 이미지 다운로드
    const response = await fetch(imageUrl, {
      // 타임아웃 설정 (30초)
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `이미지 다운로드 실패: ${response.status} ${response.statusText}`
      );
    }

    const buffer = await response.arrayBuffer();

    // 파일 크기 확인 (최대 20MB)
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error("이미지 크기가 너무 큽니다. (최대 20MB)");
    }

    const base64Image = Buffer.from(buffer).toString("base64");

    // MIME 타입 확인
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.startsWith("image/")
      ? contentType
      : "image/jpeg";

    // OCR 요청 (한글 지원 프롬프트)
    const prompt = `
이 이미지에서 텍스트를 추출해주세요. 
다음 사항을 준수해주세요:
1. 한글과 영어를 모두 정확하게 인식
2. 줄바꿈과 문단 구조를 유지
3. 숫자와 특수문자도 정확하게 인식
4. 텍스트만 반환하고 다른 설명이나 주석은 포함하지 않음
5. 불필요한 공백은 제거하되, 의미 있는 공백은 유지
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
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[Gemini API] OCR 처리 오류:", {
      message: errorMessage,
      imageUrl: imageUrl.substring(0, 100) + "...",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `Gemini API 텍스트 추출 실패: ${errorMessage}`
    );
  }
}

