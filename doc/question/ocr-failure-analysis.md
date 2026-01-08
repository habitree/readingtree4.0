# OCR 인식 실패 원인 분석 및 해결 방안

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📋 문제 개요

OCR 인식이 계속 실패하는 문제를 분석하고 해결 방안을 제시합니다.

---

## 🔍 원인 분석

### 1. 환경 변수 설정 문제

**가능한 원인:**
- `GOOGLE_VISION_API_KEY` 환경 변수가 설정되지 않음
- 환경 변수 이름 오타 또는 잘못된 값
- 서버 재시작 없이 환경 변수 변경

**확인 방법:**
```bash
# 로컬 개발 환경
# .env.local 파일 확인
cat .env.local | grep GOOGLE_VISION_API_KEY

# Vercel 환경
# Vercel Dashboard → Settings → Environment Variables 확인
```

**해결 방법:**
1. `.env.local` 파일에 다음 추가:
   ```env
   GOOGLE_VISION_API_KEY=AIzaSy...
   ```
2. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

### 2. API 키 제한사항 문제

**가능한 원인:**
- API 키가 웹사이트 제한사항으로 설정되어 있음
- 서버 사이드 호출 시 Referer 헤더가 없어서 차단됨

**증상:**
```
"message": "Requests from referer <empty> are blocked.",
"reason": "API_KEY_HTTP_REFERRER_BLOCKED"
```

**해결 방법:**
1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보
2. API 키 클릭 → 제한사항 수정
3. **"애플리케이션 제한사항"**에서:
   - **"키 제한 안함"** 선택 (개발 환경)
   - 또는 **"IP 주소"** 선택 (프로덕션 환경)

**상세 가이드:** `doc/question/ocr-api-key-fix-guide.md` 참조

### 3. 서비스 계정 설정 문제

**가능한 원인:**
- API 키가 없을 때 서비스 계정 방식으로 전환되는데, 서비스 계정도 설정되지 않음
- 서비스 계정 JSON 파일 경로 오류
- 서비스 계정 JSON 문자열 파싱 오류

**확인 방법:**
```typescript
// lib/api/vision.ts의 getVisionClient() 함수 확인
// 다음 환경 변수 중 하나가 설정되어 있어야 함:
// - GOOGLE_APPLICATION_CREDENTIALS (파일 경로)
// - GOOGLE_SERVICE_ACCOUNT_JSON (JSON 문자열)
```

**해결 방법:**
1. 서비스 계정 JSON 파일 경로 설정:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
   ```
2. 또는 JSON 문자열로 설정 (Vercel 권장):
   ```env
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
   ```

### 4. 이미지 다운로드 실패

**가능한 원인:**
- 이미지 URL이 유효하지 않음
- Supabase Storage 접근 권한 문제
- 네트워크 타임아웃 (30초)

**확인 방법:**
서버 로그에서 다음 메시지 확인:
```
[Vision API] 이미지 다운로드 실패: ...
```

**해결 방법:**
1. 이미지 URL 유효성 확인
2. Supabase Storage 버킷 권한 확인
3. 이미지 크기 확인 (최대 20MB)

### 5. Vision API 호출 실패

**가능한 원인:**
- API 키가 유효하지 않음
- API 할당량 초과
- API가 활성화되지 않음
- 네트워크 연결 문제

**확인 방법:**
서버 로그에서 다음 메시지 확인:
```
[Vision API] Vision API 호출 실패: ...
```

**해결 방법:**
1. Google Cloud Console에서 API 키 유효성 확인
2. Cloud Vision API 활성화 확인
3. API 할당량 확인
4. 네트워크 연결 확인

### 6. 이미지 URL 접근 권한 문제

**가능한 원인:**
- Supabase Storage의 이미지가 공개 버킷이 아님
- 이미지 URL이 서버에서 접근 불가능한 위치
- CORS 설정 문제

**확인 방법:**
1. 이미지 URL을 브라우저에서 직접 접근해보기
2. Supabase Storage 버킷 설정 확인

**해결 방법:**
1. Supabase Storage 버킷을 공개로 설정
2. 또는 서명된 URL 사용

---

## 🔧 단계별 진단 방법

### 1단계: 환경 변수 확인

```bash
# 로컬 개발 환경
# .env.local 파일 확인
cat .env.local | grep -E "GOOGLE_VISION|GEMINI"

# 서버 로그 확인
# 다음 메시지가 나타나는지 확인:
# - "[Vision API] API 키 방식으로 OCR 처리 시작" (정상)
# - "[Vision API] API 키가 없습니다. 서비스 계정 방식으로 시도합니다." (API 키 없음)
# - "Google Vision API 인증 정보가 설정되지 않았습니다." (모든 인증 정보 없음)
```

### 2단계: API 키 유효성 확인

1. Google Cloud Console 접속
2. API 및 서비스 → 사용자 인증 정보
3. API 키 클릭 → 제한사항 확인
4. **애플리케이션 제한사항** 확인:
   - "키 제한 안함" 또는 "IP 주소" 설정 확인
   - "HTTP 리퍼러(웹사이트)" 제한이 있으면 제거

### 3단계: 서버 로그 확인

OCR 요청 시 서버 로그에서 다음 순서로 확인:

**정상 케이스:**
```
[OCR] 요청 수신 시작
[OCR] 인증 확인: { hasUser: true, userId: '...' }
[OCR] 기록 소유 확인 결과: { hasOwnership: true }
[OCR] Transcription 초기 상태 생성 완료
[OCR] 처리 요청 성공
[OCR Process] 처리 시작
[Vision API] API 키 방식으로 OCR 처리 시작
[Vision API] 이미지 다운로드 시작: ...
[Vision API] 이미지 다운로드 완료, 크기: ...KB
[Vision API] Base64 인코딩 완료, Vision API 호출 시작
[Vision API] Vision API 호출 성공
[Vision API] 텍스트 추출 완료, 길이: ...
[OCR Process] Vision API 호출 완료
[OCR Process] Transcription 저장 완료
[OCR Process] 처리 완료: noteId=..., 소요시간=...ms
```

**실패 케이스:**
```
[OCR Process] ========== OCR 처리 오류 발생 ==========
[OCR Process] 에러 메시지: ...
[OCR Process] Note ID: ...
[OCR Process] Image URL: ...
```

### 4단계: 데이터베이스 확인

```sql
-- 최근 OCR 로그 확인
SELECT 
  id,
  user_id,
  note_id,
  status,
  error_message,
  processing_duration_ms,
  created_at
FROM ocr_logs
ORDER BY created_at DESC
LIMIT 10;

-- Transcription 상태 확인
-- 최근 OCR 로그 확인
SELECT 
  id,
  user_id,
  note_id,
  status,
  error_message,
  processing_duration_ms,
  created_at
FROM ocr_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🛠️ 해결 방안

### 해결 방안 1: API 키 설정 및 제한사항 수정 (가장 빠른 해결)

1. **환경 변수 설정:**
   ```env
   # .env.local
   GOOGLE_VISION_API_KEY=AIzaSy...
   ```

2. **API 키 제한사항 수정:**
   - Google Cloud Console → API 및 서비스 → 사용자 인증 정보
   - API 키 클릭 → 제한사항
   - **"애플리케이션 제한사항"**에서 **"키 제한 안함"** 선택
   - 저장

3. **서버 재시작:**
   ```bash
   npm run dev
   ```

4. **테스트:**
   - 필사 이미지 업로드
   - 서버 로그 확인

### 해결 방안 2: 서비스 계정 사용 (프로덕션 권장)

1. **서비스 계정 생성:**
   - Google Cloud Console → IAM 및 관리자 → 서비스 계정
   - 서비스 계정 생성
   - Vision API 권한 부여
   - JSON 키 다운로드

2. **환경 변수 설정:**
   ```env
   # 방법 1: 파일 경로
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
   
   # 방법 2: JSON 문자열 (Vercel 권장)
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

3. **서버 재시작 및 테스트**

### 해결 방안 3: Gemini API 사용 (대안)

현재 프로젝트에는 Gemini API도 지원합니다:

1. **환경 변수 설정:**
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

2. **코드 수정:**
   ```typescript
   // app/api/ocr/process/route.ts
   // import { extractTextFromImage } from "@/lib/api/vision";
   import { extractTextFromImage } from "@/lib/api/gemini";
   ```

**참고:** Gemini API는 Vision API보다 설정이 간단하고 한글 인식 성능이 좋을 수 있습니다.

---

## 📊 체크리스트

다음 항목을 순서대로 확인하세요:

### 환경 변수 확인
- [ ] `.env.local`에 `GOOGLE_VISION_API_KEY` 설정되어 있음
- [ ] API 키가 "AIza"로 시작함
- [ ] API 키 길이가 30자 이상임
- [ ] 서버 재시작 완료

### API 키 설정 확인
- [ ] Google Cloud Console에서 API 키 확인
- [ ] Cloud Vision API 활성화 확인
- [ ] API 키 제한사항 확인 (웹사이트 제한 제거)
- [ ] API 할당량 확인

### 서버 로그 확인
- [ ] OCR 요청 시 로그가 정상적으로 출력됨
- [ ] 에러 메시지가 없음
- [ ] Vision API 호출 성공 메시지 확인

### 데이터베이스 확인
- [ ] `transcriptions` 테이블에 레코드 생성됨
- [ ] `status`가 "completed"로 업데이트됨
- [ ] `extracted_text`에 텍스트가 저장됨
- [ ] `ocr_logs` 테이블에 성공 로그 기록됨

---

## 🚨 자주 발생하는 에러 메시지

### 에러 1: "API 키가 없습니다"
```
[Vision API] API 키가 없습니다. 서비스 계정 방식으로 시도합니다.
```

**해결:** `.env.local`에 `GOOGLE_VISION_API_KEY` 추가

### 에러 2: "API_KEY_HTTP_REFERRER_BLOCKED"
```
"message": "Requests from referer <empty> are blocked.",
"reason": "API_KEY_HTTP_REFERRER_BLOCKED"
```

**해결:** API 키 제한사항에서 웹사이트 제한 제거

### 에러 3: "Google Vision API 인증 정보가 설정되지 않았습니다"
```
Google Vision API 인증 정보가 설정되지 않았습니다.
```

**해결:** API 키 또는 서비스 계정 설정

### 에러 4: "이미지 다운로드 실패"
```
[Vision API] 이미지 다운로드 실패: ...
```

**해결:** 이미지 URL 유효성 및 Supabase Storage 권한 확인

### 에러 5: "Vision API 호출 실패"
```
[Vision API] Vision API 호출 실패: ...
```

**해결:** API 키 유효성, API 활성화, 할당량 확인

---

## 📝 추가 참고 자료

- **API 키 제한사항 수정 가이드:** `doc/question/ocr-api-key-fix-guide.md`
- **OCR 테스트 가이드:** `doc/question/ocr-test-guide.md`
- **Google Vision API 설정 가이드:** `doc/question/google-vision-api-setup-guide.md`
- **환경 변수 체크리스트:** `doc/question/environment-variables-checklist.md`

---

## 💡 권장 사항

1. **개발 환경:** API 키 방식 사용 (설정 간단)
2. **프로덕션 환경:** 서비스 계정 방식 사용 (보안 강화)
3. **대안:** Gemini API 사용 (한글 인식 성능 우수)

---

**이 문서는 OCR 인식 실패 문제를 해결하기 위한 종합 가이드입니다. 위의 체크리스트를 순서대로 확인하여 문제를 해결하세요.**




