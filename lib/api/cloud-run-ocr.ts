/**
 * Google Cloud Run OCR 서비스 클라이언트
 * extractTextFromImage Cloud Function을 사용한 OCR 처리
 */

const CLOUD_RUN_OCR_URL = process.env.CLOUD_RUN_OCR_URL || 
  "https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage";

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Google Cloud Run OCR 서비스를 사용
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log("[Cloud Run OCR] ========== Cloud Run OCR 처리 시작 ==========");
    console.log("[Cloud Run OCR] Image URL:", imageUrl.substring(0, 100) + "...");
    console.log("[Cloud Run OCR] Service URL:", CLOUD_RUN_OCR_URL);

    // 1. 이미지 다운로드
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000), // 30초 타임아웃
    });

    if (!imageResponse.ok) {
      throw new Error(
        `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    const buffer = await imageResponse.arrayBuffer();

    // 파일 크기 확인 (최대 10MB - Cloud Run 제한 고려)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error("이미지 크기가 너무 큽니다. (최대 10MB)");
    }

    // 2. Base64 인코딩
    const base64Image = Buffer.from(buffer).toString("base64");
    
    // MIME 타입 확인
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.startsWith("image/")
      ? contentType
      : "image/jpeg";
    
    console.log("[Cloud Run OCR] 이미지 다운로드 완료, 크기:", buffer.byteLength, "bytes");
    console.log("[Cloud Run OCR] MIME 타입:", mimeType);
    console.log("[Cloud Run OCR] Base64 길이:", base64Image.length);

    // 3. Cloud Run OCR API 호출
    // 요청 본문 형식: { image: base64Image } 또는 { image: base64Image, mimeType: "image/jpeg" }
    const requestBody: { image: string; mimeType?: string } = {
      image: base64Image,
    };
    
    // MIME 타입이 명확한 경우 추가 (일부 API가 요구할 수 있음)
    if (mimeType && mimeType !== "image/jpeg") {
      requestBody.mimeType = mimeType;
    }
    
    const response = await fetch(CLOUD_RUN_OCR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 인증이 필요한 경우 Authorization 헤더 추가
        ...(process.env.CLOUD_RUN_OCR_AUTH_TOKEN && {
          Authorization: `Bearer ${process.env.CLOUD_RUN_OCR_AUTH_TOKEN}`,
        }),
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃 (OCR 처리 시간 고려)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = null;
      
      // JSON 형식의 에러 메시지 파싱 시도
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
      }
      
      console.error("[Cloud Run OCR] API 호출 실패:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        errorData,
        requestBodySize: JSON.stringify(requestBody).length,
        base64ImageLength: base64Image.length,
      });
      
      // 400 Bad Request인 경우 더 자세한 정보 제공
      if (response.status === 400) {
        throw new Error(
          `Cloud Run OCR API 호출 실패 (400 Bad Request): 요청 형식이 올바르지 않습니다. ${errorData?.error?.message || errorText || ""}`
        );
      }
      
      throw new Error(
        `Cloud Run OCR API 호출 실패: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    // 4. 응답 파싱
    const data = await response.json();
    
    // 응답 형식 확인 (문서에 따르면 response.data.text)
    const extractedText = data.text || data.extractedText || data.result || "";
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn("[Cloud Run OCR] 추출된 텍스트가 비어있습니다.");
      throw new Error("Cloud Run OCR에서 텍스트를 추출하지 못했습니다.");
    }

    console.log("[Cloud Run OCR] OCR 처리 성공!");
    console.log("[Cloud Run OCR] 추출된 텍스트 길이:", extractedText.length);
    console.log("[Cloud Run OCR] ================================================");

    return extractedText.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[Cloud Run OCR] OCR 처리 오류:", {
      message: errorMessage,
      imageUrl: imageUrl.substring(0, 100) + "...",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Cloud Run OCR 텍스트 추출 실패: ${errorMessage}`);
  }
}
