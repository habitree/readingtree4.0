# OCR 오류 전체 점검 및 수정 (2026-01-12)

**작성일:** 2026년 1월 12일  
**상황:** Cloud Run OCR 400 에러 및 Gemini API 모델명 오류 해결  
**결과:** ✅ 주요 문제 수정 완료

---

## 🔍 발견된 문제

### 1. Cloud Run OCR 400 Bad Request

**에러 메시지:**
```
[Cloud Run OCR] API 호출 실패: {
  status: 400,
  statusText: 'Bad Request',
  error: '{"error":{"message":"Bad Request","status":"INVALID_ARGUMENT"}}'
}
```

**원인 분석:**
- 요청 형식이 실제 API 구현과 일치하지 않을 가능성
- 문서에는 `{ image: base64Image }` 형식이라고 명시되어 있으나, 실제 구현이 다를 수 있음

**수정 사항:**
- 에러 로깅 강화 (요청 본문 크기, MIME 타입, API URL 등 상세 정보 추가)
- 요청 형식 확인을 위한 디버깅 로그 추가

---

### 2. Gemini API 모델명 오류

**에러 메시지:**
```
[GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent: 
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

**원인 분석:**
- `gemini-pro` 모델이 `v1beta` API 버전에서 지원되지 않음
- `@google/generative-ai` SDK는 기본적으로 v1 API를 사용하므로, v1에서 지원되는 모델명 사용 필요

**수정 사항:**
- 모델명을 `gemini-1.5-flash`로 변경 (v1 API에서 안정적으로 지원)
- 주석 업데이트: v1 API 사용 명시

---

### 3. Vision API 인증 정보 없음

**상황:**
- `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수가 Vercel에 설정되지 않음
- Cloud Run OCR과 Gemini API가 모두 실패할 경우 최종 폴백으로 사용 불가

**해결 방법:**
- Vercel 환경 변수에 서비스 계정 JSON 파일 경로 설정 (또는 JSON 내용을 환경 변수로 직접 설정)

---

## 🛠️ 적용된 수정 사항

### 1. `lib/api/gemini.ts`

**변경 전:**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

**변경 후:**
```typescript
// gemini-1.5-flash 사용 (v1 API에서 안정적으로 지원되는 모델)
// v1beta에서는 지원되지 않으므로 기본 v1 API 사용
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

---

### 2. `lib/api/cloud-run-ocr.ts`

**추가된 디버깅 로그:**
```typescript
console.log("[Cloud Run OCR] 요청 본문 준비 완료:", {
  imageLength: base64Image.length,
  mimeType,
  requestBodyKeys: Object.keys(requestBody),
});
```

**강화된 에러 메시지:**
```typescript
if (response.status === 400) {
  const detailedError = errorData?.error?.message || errorData?.message || errorText || "알 수 없는 오류";
  console.error("[Cloud Run OCR] 400 Bad Request 상세 정보:", {
    errorData,
    errorText,
    requestBodySize: JSON.stringify(requestBody).length,
    base64ImageLength: base64Image.length,
    mimeType,
  });
  throw new Error(
    `Cloud Run OCR API 호출 실패 (400 Bad Request): 요청 형식이 올바르지 않습니다. ${detailedError}\n` +
    `요청 본문 크기: ${JSON.stringify(requestBody).length} bytes\n` +
    `Base64 이미지 길이: ${base64Image.length} chars\n` +
    `MIME 타입: ${mimeType}\n` +
    `API URL: ${CLOUD_RUN_OCR_URL}`
  );
}
```

---

### 3. `app/actions/admin.ts`

**관리자 대시보드 API 정보 업데이트:**
- Gemini API 모델명: `gemini-pro` → `gemini-1.5-flash`
- API 버전: `v1beta` → `v1`
- 주석 업데이트: v1 API 사용 명시

---

## 📋 추가 확인 사항

### Cloud Run OCR 400 에러 해결을 위한 추가 조치

**가능한 원인:**
1. 실제 API 구현이 문서와 다를 수 있음
2. 요청 본문 크기 제한 (현재 약 2.2MB)
3. MIME 타입 처리 방식 차이

**추가 조치 필요:**
- Cloud Run OCR 서비스의 실제 구현 코드 확인
- 요청 형식이 `{ image: base64Image }` 외에 다른 형식인지 확인
- API 문서 재확인 또는 서비스 개발자와 협의

---

### Vision API 폴백 설정 (선택 사항)

**현재 상태:**
- `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수 미설정
- Cloud Run OCR과 Gemini API가 모두 실패할 경우 최종 폴백 불가

**설정 방법:**
1. **서비스 계정 JSON 파일 다운로드**
2. **Vercel 환경 변수 설정:**
   - 방법 1: 파일 경로 설정 (Vercel에서는 작동하지 않을 수 있음)
   - 방법 2: JSON 내용을 환경 변수로 직접 설정 (권장)

---

## ✅ 수정 완료 체크리스트

- [x] Gemini API 모델명 변경 (`gemini-pro` → `gemini-1.5-flash`)
- [x] Gemini API 주석 업데이트 (v1 API 사용 명시)
- [x] Cloud Run OCR 에러 로깅 강화
- [x] 관리자 대시보드 API 정보 업데이트
- [ ] Cloud Run OCR 400 에러 원인 추가 확인 (실제 API 구현 확인 필요)
- [ ] Vision API 폴백 설정 (선택 사항)

---

## 🚀 다음 단계

1. **Git 커밋 및 푸시**
2. **Vercel 재배포**
3. **OCR 재테스트**
   - Cloud Run OCR이 정상 작동하는지 확인
   - Gemini API 폴백이 정상 작동하는지 확인
4. **로그 확인**
   - Cloud Run OCR 400 에러가 지속되는 경우, 상세 로그를 통해 원인 파악
   - 실제 API 구현과 요청 형식 비교

---

## 📊 예상 결과

### 성공 시나리오:
1. **Cloud Run OCR 성공** → 텍스트 추출 완료 ✅
2. **Cloud Run OCR 실패 → Gemini API 폴백 성공** → 텍스트 추출 완료 ✅
3. **Cloud Run OCR 실패 → Gemini API 실패 → Vision API 폴백 성공** → 텍스트 추출 완료 ✅

### 실패 시나리오:
- Cloud Run OCR 400 에러가 지속되는 경우, 실제 API 구현 확인 필요
- Gemini API도 실패하는 경우, API 키 및 모델명 재확인 필요

---

**이 문서는 OCR 오류 전체 점검 및 수정 내용을 정리한 문서입니다.**
