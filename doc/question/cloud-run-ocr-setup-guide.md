# Cloud Run OCR 설정 가이드

**작성일:** 2026년 1월 12일  
**목적:** Cloud Run OCR만 사용하도록 변경 후, 제대로 작동하기 위한 설정 및 확인 사항

---

## ✅ 코드 변경 완료 사항

### 1. OCR 처리 모듈 단순화
- **파일:** `lib/api/ocr.ts`
- **변경:** Cloud Run OCR만 사용하도록 변경 (Gemini API, Vision API 폴백 제거)
- **결과:** OCR 처리가 Cloud Run OCR에만 의존

### 2. Cloud Run OCR 요청 형식 개선
- **파일:** `lib/api/cloud-run-ocr.ts`
- **변경:**
  - MIME 타입을 명시적으로 요청 본문에 포함
  - 인증 토큰 처리 로직 개선
  - 상세한 디버깅 로그 추가

---

## 🔧 설정해야 할 환경 변수

### 필수 환경 변수

#### 1. `CLOUD_RUN_OCR_URL` (선택 사항)
- **설명:** Cloud Run OCR 서비스 URL
- **기본값:** `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`
- **설정 필요 여부:** ❌ 기본값이 있으므로 선택 사항
- **설정 방법:**
  ```
  CLOUD_RUN_OCR_URL=https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage
  ```

#### 2. `CLOUD_RUN_OCR_AUTH_TOKEN` (선택 사항)
- **설명:** Cloud Run OCR 서비스 인증 토큰 (비공개 함수인 경우 필요)
- **기본값:** 없음 (공개 함수 가정)
- **설정 필요 여부:** ⚠️ Cloud Run 함수가 비공개인 경우에만 필요
- **설정 방법:**
  ```
  CLOUD_RUN_OCR_AUTH_TOKEN=your-auth-token-here
  ```

---

## 🔍 확인해야 할 사항

### 1. Cloud Run 함수 접근 권한 확인

**확인 방법:**
1. Google Cloud Console 접속
2. Cloud Functions 또는 Cloud Run 서비스 확인
3. `extractTextFromImage` 함수의 접근 권한 확인

**가능한 시나리오:**

#### 시나리오 A: 공개 함수 (Public)
- ✅ **설정 불필요:** `CLOUD_RUN_OCR_AUTH_TOKEN` 설정하지 않아도 됨
- ✅ **작동 방식:** 누구나 호출 가능
- ⚠️ **주의:** 보안상 공개 함수는 권장하지 않음

#### 시나리오 B: 비공개 함수 (Private)
- ✅ **설정 필요:** `CLOUD_RUN_OCR_AUTH_TOKEN` 설정 필수
- ✅ **인증 방법:** Google Cloud Service Account의 ID 토큰 사용
- 📝 **토큰 생성 방법:** 아래 "인증 토큰 생성 방법" 참조

---

### 2. Cloud Run 함수 요청 형식 확인

**현재 코드에서 사용하는 요청 형식:**
```json
{
  "image": "BASE64_ENCODED_IMAGE_DATA",
  "mimeType": "image/jpeg"
}
```

**확인 사항:**
- ✅ 실제 Cloud Run 함수가 이 형식을 기대하는지 확인
- ✅ 다른 형식이 필요한 경우 코드 수정 필요

**가능한 다른 형식:**
```json
// 형식 1: 현재 사용 중
{
  "image": "BASE64_ENCODED_IMAGE_DATA",
  "mimeType": "image/jpeg"
}

// 형식 2: 중첩 객체
{
  "image": {
    "data": "BASE64_ENCODED_IMAGE_DATA",
    "mimeType": "image/jpeg"
  }
}

// 형식 3: image만 (mimeType 없음)
{
  "image": "BASE64_ENCODED_IMAGE_DATA"
}
```

**확인 방법:**
- Cloud Run 함수의 소스 코드 확인
- 또는 함수 개발자에게 요청 형식 확인

---

### 3. Cloud Run 함수 응답 형식 확인

**현재 코드에서 기대하는 응답 형식:**
```json
{
  "text": "추출된 텍스트"
}
```

**대체 응답 형식 (자동 처리):**
- `data.extractedText`
- `data.result`

**확인 사항:**
- ✅ 실제 Cloud Run 함수가 어떤 형식으로 응답하는지 확인
- ✅ 다른 형식인 경우 코드 수정 필요

---

### 4. 이미지 크기 제한 확인

**현재 코드 제한:**
- **최대 이미지 크기:** 10MB (원본)
- **Base64 인코딩 후:** 약 13.3MB (Base64는 원본의 약 1.33배)

**Cloud Run 제한:**
- **요청 본문 크기:** 최대 32MB (일반적으로)
- **함수별 제한:** 함수 설정에 따라 다를 수 있음

**확인 사항:**
- ✅ Cloud Run 함수의 요청 크기 제한 확인
- ✅ 필요 시 코드의 `MAX_IMAGE_SIZE` 조정

---

## 🛠️ 인증 토큰 생성 방법 (비공개 함수인 경우)

### 방법 1: Google Cloud Service Account ID 토큰

```bash
# 1. 서비스 계정 키 파일 다운로드
# Google Cloud Console → IAM & Admin → Service Accounts → 키 생성

# 2. gcloud CLI로 ID 토큰 생성
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud auth print-identity-token --audiences=https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage
```

### 방법 2: 환경 변수로 직접 설정

Vercel 환경 변수에 생성한 토큰을 직접 설정:
```
CLOUD_RUN_OCR_AUTH_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Vercel 환경 변수 설정 방법

### 1. Vercel 대시보드에서 설정

1. **Vercel 프로젝트 선택**
2. **Settings** → **Environment Variables** 이동
3. **환경 변수 추가:**
   - **Key:** `CLOUD_RUN_OCR_URL` (선택 사항)
   - **Value:** `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`
   - **Environment:** Production, Preview, Development (필요에 따라)
4. **환경 변수 추가:**
   - **Key:** `CLOUD_RUN_OCR_AUTH_TOKEN` (비공개 함수인 경우)
   - **Value:** 인증 토큰
   - **Environment:** Production, Preview, Development (필요에 따라)

### 2. 재배포 필요

환경 변수를 추가/수정한 후:
- ✅ **자동 재배포:** Vercel이 자동으로 재배포하지 않을 수 있음
- ✅ **수동 재배포:** Deployments 탭에서 최신 배포를 "Redeploy" 클릭

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# .env.local 파일에 환경 변수 설정
CLOUD_RUN_OCR_URL=https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage
CLOUD_RUN_OCR_AUTH_TOKEN=your-token-here  # 비공개 함수인 경우

# 개발 서버 실행
npm run dev

# OCR 기능 테스트
# 브라우저에서 기록 생성 및 OCR 실행
```

### 2. Vercel 배포 후 테스트

1. **환경 변수 설정 확인**
2. **재배포 완료 대기**
3. **OCR 기능 테스트:**
   - 기록 생성
   - 이미지 업로드
   - OCR 실행
   - 결과 확인

### 3. 로그 확인

**Vercel Functions 로그 확인:**
1. Vercel 대시보드 → **Deployments** → 최신 배포 선택
2. **Functions** 탭 → `/api/ocr/process` 선택
3. **Runtime Logs** 확인

**확인할 로그:**
```
[Cloud Run OCR] ========== Cloud Run OCR 처리 시작 ==========
[Cloud Run OCR] Service URL: https://...
[Cloud Run OCR] 이미지 다운로드 완료, 크기: ... bytes
[Cloud Run OCR] 요청 본문 준비 완료: ...
[Cloud Run OCR] OCR 처리 성공!
```

---

## ❌ 문제 해결

### 문제 1: 400 Bad Request

**증상:**
```
Cloud Run OCR API 호출 실패 (400 Bad Request): 요청 형식이 올바르지 않습니다.
```

**가능한 원인:**
1. 요청 형식이 실제 API와 일치하지 않음
2. MIME 타입 처리 방식 차이
3. Base64 인코딩 문제

**해결 방법:**
1. Cloud Run 함수의 실제 요청 형식 확인
2. 함수 개발자에게 요청 형식 확인
3. 필요 시 코드 수정

---

### 문제 2: 401 Unauthorized

**증상:**
```
Cloud Run OCR API 호출 실패: 401 Unauthorized
```

**가능한 원인:**
1. `CLOUD_RUN_OCR_AUTH_TOKEN` 미설정
2. 인증 토큰이 만료됨
3. 인증 토큰 형식이 잘못됨

**해결 방법:**
1. `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수 확인
2. 인증 토큰 재생성
3. Vercel 환경 변수 재설정 및 재배포

---

### 문제 3: 403 Forbidden

**증상:**
```
Cloud Run OCR API 호출 실패: 403 Forbidden
```

**가능한 원인:**
1. Cloud Run 함수 접근 권한 문제
2. 서비스 계정 권한 부족

**해결 방법:**
1. Google Cloud Console에서 함수 접근 권한 확인
2. 서비스 계정에 적절한 권한 부여

---

### 문제 4: 500 Internal Server Error

**증상:**
```
Cloud Run OCR API 호출 실패: 500 Internal Server Error
```

**가능한 원인:**
1. Cloud Run 함수 내부 오류
2. Cloud Vision API 오류
3. 이미지 처리 오류

**해결 방법:**
1. Google Cloud Console에서 Cloud Run 로그 확인
2. 함수 개발자에게 문의

---

### 문제 5: 타임아웃

**증상:**
```
Cloud Run OCR 텍스트 추출 실패: AbortError: The operation was aborted
```

**가능한 원인:**
1. 이미지 크기가 너무 큼
2. Cloud Run 함수 처리 시간 초과
3. 네트워크 문제

**해결 방법:**
1. 이미지 크기 확인 (10MB 이하)
2. Cloud Run 함수 타임아웃 설정 확인
3. 코드의 타임아웃 시간 조정 (현재 60초)

---

## 📊 체크리스트

### 배포 전 확인
- [ ] `CLOUD_RUN_OCR_URL` 환경 변수 설정 (선택 사항, 기본값 사용 가능)
- [ ] `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수 설정 (비공개 함수인 경우 필수)
- [ ] Cloud Run 함수 접근 권한 확인
- [ ] Cloud Run 함수 요청/응답 형식 확인

### 배포 후 확인
- [ ] Vercel 환경 변수 설정 확인
- [ ] 재배포 완료 확인
- [ ] OCR 기능 테스트
- [ ] Vercel Functions 로그 확인

### 문제 발생 시
- [ ] 에러 메시지 확인
- [ ] Vercel Functions 로그 확인
- [ ] Google Cloud Console 로그 확인
- [ ] 요청/응답 형식 재확인

---

## 📝 요약

### 필수 설정
1. **환경 변수:** `CLOUD_RUN_OCR_AUTH_TOKEN` (비공개 함수인 경우만)
2. **재배포:** 환경 변수 설정 후 Vercel 재배포

### 확인 사항
1. **Cloud Run 함수 접근 권한:** 공개/비공개 확인
2. **요청 형식:** 실제 API 구현과 일치하는지 확인
3. **응답 형식:** `{ text: "..." }` 형식인지 확인

### 예상 결과
- ✅ Cloud Run OCR만 사용하여 OCR 처리
- ✅ 폴백 없이 단일 OCR 제공자 사용
- ✅ 더 간단하고 예측 가능한 동작

---

**이 문서는 Cloud Run OCR만 사용하도록 변경한 후, 제대로 작동하기 위한 설정 및 확인 사항을 정리한 문서입니다.**
