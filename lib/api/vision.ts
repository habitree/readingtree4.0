/**
 * Google Vision API 클라이언트
 * OCR 텍스트 추출 기능 제공
 */

import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

/**
 * Vision API 클라이언트 생성 (서비스 계정 방식)
 * @returns ImageAnnotatorClient 인스턴스
 * @throws Error 환경 변수가 설정되지 않은 경우
 */
function getVisionClient(): ImageAnnotatorClient {
  // 방법 1: 서비스 계정 JSON 파일 경로
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // 방법 2: 서비스 계정 JSON 문자열
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  try {
    if (credentialsPath) {
      // 상대 경로를 절대 경로로 변환 (프로젝트 루트 기준)
      const resolvedPath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.resolve(process.cwd(), credentialsPath);
      
      console.log("[Vision API] 서비스 계정 파일 경로:", {
        원본: credentialsPath,
        절대경로: resolvedPath,
      });
      
      // 서비스 계정 파일 경로 사용
      return new ImageAnnotatorClient({
        keyFilename: resolvedPath,
      });
    } else if (serviceAccountJson) {
      // 서비스 계정 JSON 문자열 사용
      const credentials = JSON.parse(serviceAccountJson);
      return new ImageAnnotatorClient({
        credentials,
      });
    } else {
      throw new Error(
        "Google Vision API 인증 정보가 설정되지 않았습니다.\n" +
        "다음 중 하나를 설정해주세요:\n" +
        "- GOOGLE_APPLICATION_CREDENTIALS (서비스 계정 파일 경로)\n" +
        "- GOOGLE_SERVICE_ACCOUNT_JSON (서비스 계정 JSON 문자열)\n\n" +
        "참고: API 키 방식은 REST API를 통해 사용할 수 있습니다. (extractTextFromImageWithApiKey 함수 참고)"
      );
    }
  } catch (error) {
    throw new Error(
      `Vision API 클라이언트 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * Vision API REST API를 사용한 텍스트 추출 (API 키 방식)
 * @param imageUrl 이미지 URL
 * @param apiKey Google Vision API 키
 * @returns 추출된 텍스트
 */
async function extractTextFromImageWithApiKey(
  imageUrl: string,
  apiKey: string
): Promise<string> {
  console.log("[Vision API] 이미지 다운로드 시작:", imageUrl);
  
  // 이미지 다운로드
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorMsg = `이미지 다운로드 실패: ${response.status} ${response.statusText}`;
    console.error("[Vision API]", errorMsg);
    throw new Error(errorMsg);
  }

  const buffer = await response.arrayBuffer();
  console.log("[Vision API] 이미지 다운로드 완료, 크기:", `${(buffer.byteLength / 1024).toFixed(2)}KB`);

  // 파일 크기 확인 (최대 20MB)
  const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    const errorMsg = `이미지 크기가 너무 큽니다. (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB / 최대 20MB)`;
    console.error("[Vision API]", errorMsg);
    throw new Error(errorMsg);
  }

  const base64Image = Buffer.from(buffer).toString("base64");
  console.log("[Vision API] Base64 인코딩 완료, Vision API 호출 시작");

  // Vision API REST API 호출
  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const apiResponse = await fetch(visionApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 1,
            },
          ],
        },
      ],
    }),
  });

  if (!apiResponse.ok) {
    let errorData: any = {};
    try {
      const responseText = await apiResponse.text();
      console.error("[Vision API] Vision API 응답 본문 (원본):", responseText);
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[Vision API] JSON 파싱 실패, 원본 응답:", await apiResponse.text().catch(() => "응답 읽기 실패"));
    }
    
    const errorMsg = `Vision API 호출 실패: ${apiResponse.status} ${apiResponse.statusText}`;
    console.error("[Vision API] 상세 에러 정보:", {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      errorData: JSON.stringify(errorData, null, 2),
      headers: Object.fromEntries(apiResponse.headers.entries()),
    });
    
    // 상세 에러 정보 추출
    if (errorData.error) {
      const errorDetails = errorData.error.message || JSON.stringify(errorData.error);
      const fullError = `${errorMsg} - ${errorDetails}`;
      console.error("[Vision API] 최종 에러 메시지:", fullError);
      throw new Error(fullError);
    }
    
    const fullError = `${errorMsg} - ${JSON.stringify(errorData)}`;
    console.error("[Vision API] 최종 에러 메시지:", fullError);
    throw new Error(fullError);
  }

  const result = await apiResponse.json();
  console.log("[Vision API] Vision API 호출 성공");

  // 텍스트 추출
  const textAnnotations =
    result.responses?.[0]?.textAnnotations;

  if (!textAnnotations || textAnnotations.length === 0) {
    console.log("[Vision API] 텍스트가 감지되지 않았습니다.");
    return ""; // 텍스트가 없는 경우
  }

  // 첫 번째 annotation은 전체 텍스트
  const fullText = textAnnotations[0].description || "";
  console.log("[Vision API] 텍스트 추출 완료, 길이:", fullText.length);

  // 텍스트 정리
  const cleanedText = fullText
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .join("\n")
    .trim();

  console.log("[Vision API] 텍스트 정리 완료, 최종 길이:", cleanedText.length);
  return cleanedText;
}

/**
 * API 키 검증
 * @param apiKey Google Vision API 키
 * @returns 검증 결과
 */
function validateApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) {
    return false;
  }
  
  // API 키는 보통 "AIza"로 시작
  if (!apiKey.startsWith("AIza")) {
    console.warn("API 키 형식이 올바르지 않을 수 있습니다. (예상: AIza로 시작)");
  }
  
  // 최소 길이 확인
  if (apiKey.length < 30) {
    console.warn("API 키 길이가 짧습니다. 올바른 키인지 확인해주세요.");
  }
  
  return true;
}

/**
 * 이미지에서 텍스트 추출 (OCR)
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    // API 키 방식 우선 확인 (간단한 설정용)
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (apiKey && validateApiKey(apiKey)) {
      console.log("[Vision API] API 키 방식으로 OCR 처리 시작");
      return extractTextFromImageWithApiKey(imageUrl, apiKey);
    } else if (apiKey) {
      console.warn("[Vision API] API 키가 설정되어 있지만 형식이 올바르지 않습니다.");
    } else {
      console.log("[Vision API] API 키가 없습니다. 서비스 계정 방식으로 시도합니다.");
    }

    // 서비스 계정 방식 사용
    const client = getVisionClient();

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

    // Vision API 요청
    const [result] = await client.textDetection({
      image: {
        content: Buffer.from(buffer),
      },
    });

    // 텍스트 추출
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return ""; // 텍스트가 없는 경우
    }

    // 첫 번째 detection은 전체 텍스트 (가장 신뢰도 높음)
    const fullText = detections[0].description || "";

    // 텍스트 정리
    // - 불필요한 공백 제거
    // - 줄바꿈 유지
    const cleanedText = fullText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .trim();

    return cleanedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[Vision API] OCR 처리 오류:", {
      message: errorMessage,
      imageUrl: imageUrl.substring(0, 100) + "...", // URL 일부만 로깅
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`텍스트 추출 실패: ${errorMessage}`);
  }
}

