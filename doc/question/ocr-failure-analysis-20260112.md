# OCR 실패 원인 분석 및 해결 방안

**분석 날짜:** 2026년 1월 12일  
**대상 기록:** https://readingtree2-0.vercel.app/notes/5c941547-c3ea-4763-a5c6-7ce7ea432e52  
**상태:** OCR 실패 (빨간색 배지)

---

## 1. 현재 상황

### 1.1 UI 상태
- **OCR 상태 배지:** 빨간색 "OCR 실패" 표시
- **재실행 버튼:** 활성화됨
- **이미지:** 정상적으로 표시됨 (손글씨 독서 기록)

### 1.2 환경 설정 확인

```
✅ GEMINI_API_KEY: 설정됨 (AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM)
✅ GOOGLE_APPLICATION_CREDENTIALS: 설정됨 (./habitree-f49e1-63991a2f3290.json)
✅ 서비스 계정 파일: 존재함 (habitree-f49e1-63991a2f3290.json)
```

---

## 2. 코드 분석

### 2.1 OCR 처리 흐름

```
1. 클라이언트 → /api/ocr (요청 등록)
   ↓
2. /api/ocr → /api/ocr/process 호출 (실제 처리)
   ↓
3. /api/ocr/process → lib/api/ocr.ts (extractTextFromImage)
   ↓
4. lib/api/ocr.ts → lib/api/vision.ts (Google Vision API)
```

### 2.2 현재 사용 중인 OCR 방식

**파일: `lib/api/ocr.ts`**

```typescript
// 현재는 Google Vision API (서비스 계정 파일 방식)만 사용
import { extractTextFromImage as extractWithVision } from "./vision";

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const config = checkServiceAccount();
  
  // 서비스 계정 파일 경로가 없으면 에러
  if (!config.hasServiceAccount) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 설정해주세요.");
  }
  
  // Vision API로 처리
  return await extractWithVision(imageUrl);
}
```

**주요 발견:**
- ✅ 환경 변수는 모두 설정되어 있음
- ❌ Gemini API는 사용하지 않고 있음 (Vision API만 사용)
- ❓ Vision API 호출이 실패하는 원인을 확인해야 함

---

## 3. 실패 원인 추정

### 3.1 가능한 원인

#### 원인 1: Vision API 호출 실패 (가장 가능성 높음)
- **증상:** Vision API 요청 시 오류 발생
- **원인:**
  - 서비스 계정 파일이 손상되었거나 권한이 없음
  - Vision API가 활성화되지 않음
  - 프로덕션(Vercel) 환경에서 서비스 계정 파일 경로가 잘못됨
  - API 할당량 초과

#### 원인 2: 이미지 다운로드 실패
- **증상:** Supabase Storage에서 이미지를 가져올 수 없음
- **원인:**
  - 이미지 URL이 만료됨
  - 네트워크 타임아웃 (30초)
  - CORS 또는 인증 문제

#### 원인 3: RLS 정책 문제
- **증상:** Transcription 저장 시 권한 오류
- **원인:**
  - RLS 정책이 INSERT를 차단함
  - 세션이 만료됨

---

## 4. 해결 방안

### 4.1 즉시 확인 사항

#### ✅ 로컬 환경 테스트
```bash
# 1. 환경 변수 확인
echo $env:GOOGLE_APPLICATION_CREDENTIALS
echo $env:GEMINI_API_KEY

# 2. 서비스 계정 파일 확인
Test-Path ./habitree-f49e1-63991a2f3290.json

# 3. 로컬에서 OCR 테스트
npm run dev
# → 브라우저에서 OCR 재실행 버튼 클릭
```

#### ✅ Vercel 환경 확인
```bash
# Vercel 대시보드 → Settings → Environment Variables
# 다음 항목 확인:
- GOOGLE_APPLICATION_CREDENTIALS (파일 내용을 JSON으로 저장해야 함)
- GEMINI_API_KEY
```

**중요:** Vercel에서는 파일 경로가 아닌 **JSON 내용 자체**를 환경 변수로 설정해야 합니다.

### 4.2 Gemini API 우선 사용 (권장)

**현재 문제:**
- Vision API는 서비스 계정 파일이 필요 → Vercel 배포 시 복잡함
- Gemini API는 API 키만 있으면 됨 → 더 간단함

**해결 방법:** `lib/api/ocr.ts` 수정

```typescript
// Before (Vision API만 사용)
import { extractTextFromImage as extractWithVision } from "./vision";

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  return await extractWithVision(imageUrl);
}

// After (Gemini API 우선, Vision API 폴백)
import { extractTextFromImage as extractWithGemini } from "./gemini";
import { extractTextFromImage as extractWithVision } from "./vision";

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // Gemini API 우선 시도
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (geminiApiKey) {
    try {
      console.log("[OCR] Gemini API로 OCR 처리 시도");
      return await extractWithGemini(imageUrl);
    } catch (error) {
      console.error("[OCR] Gemini API 실패, Vision API로 폴백:", error);
    }
  }
  
  // Vision API 폴백
  console.log("[OCR] Vision API로 OCR 처리 시도");
  return await extractWithVision(imageUrl);
}
```

### 4.3 서버 로그 확인

**Vercel 배포 환경:**
```bash
# Vercel 대시보드 → Functions → Logs
# 또는
vercel logs
```

**로컬 환경:**
```bash
# 터미널에서 실시간 로그 확인
npm run dev

# 또는 브라우저 개발자 도구 → Network → ocr/process 요청 확인
```

---

## 5. 단계별 디버깅 가이드

### 단계 1: 로컬에서 재실행 테스트

1. **브라우저에서 "재실행" 버튼 클릭**
2. **브라우저 개발자 도구 (F12) 열기**
   - Network 탭 → `ocr/process` 요청 확인
   - Console 탭 → 에러 메시지 확인
3. **터미널 로그 확인**
   - `[OCR Process]` 로그 검색

### 단계 2: 환경 변수 재확인

```powershell
# .env.local 파일 확인
Get-Content .env.local | Select-String "GEMINI|GOOGLE"

# 서비스 계정 파일 내용 확인 (JSON 형식인지)
Get-Content ./habitree-f49e1-63991a2f3290.json | ConvertFrom-Json
```

### 단계 3: Gemini API 우선 사용 설정

**위의 "4.2 Gemini API 우선 사용" 방법 적용**

### 단계 4: Vercel 환경 변수 설정 확인

**Vercel 대시보드:**
1. 프로젝트 선택
2. Settings → Environment Variables
3. `GOOGLE_APPLICATION_CREDENTIALS` 확인
   - **잘못된 방법:** `./habitree-f49e1-63991a2f3290.json` (파일 경로)
   - **올바른 방법:** JSON 파일 내용 전체 복사

---

## 6. 권장 조치 사항

### 우선순위 1: Gemini API 우선 사용 (즉시 적용 가능)

**이유:**
- ✅ 설정이 간단함 (API 키만 필요)
- ✅ 이미 환경 변수 설정됨
- ✅ Vercel 배포 시 문제없음
- ✅ 한글 OCR 성능 우수

**작업:**
1. `lib/api/ocr.ts` 수정 (위의 코드 참조)
2. 커밋 및 푸시
3. Vercel 자동 재배포
4. OCR 재실행 테스트

### 우선순위 2: 서버 로그 확인 (원인 파악)

**작업:**
1. Vercel 대시보드 → Functions → Logs
2. 실패 시점의 로그 확인
3. 정확한 에러 메시지 확인

### 우선순위 3: Vision API 설정 점검 (필요 시)

**작업:**
1. Google Cloud Console → Vision API 활성화 확인
2. 서비스 계정 권한 확인
3. API 할당량 확인

---

## 7. 예상 결과

### Gemini API 우선 사용 적용 후

```
✅ 로컬 환경: Gemini API로 OCR 성공
✅ Vercel 환경: Gemini API로 OCR 성공
✅ 빠른 처리 속도 (Gemini는 Vision보다 빠름)
✅ 한글 인식 정확도 향상
```

### Vision API 문제 해결 후

```
✅ Gemini API 실패 시 Vision API로 자동 폴백
✅ 안정적인 이중화 구조
```

---

## 8. 다음 단계

1. **즉시:** `lib/api/ocr.ts` 수정하여 Gemini API 우선 사용
2. **확인:** 로컬 환경에서 OCR 재실행 테스트
3. **배포:** GitHub 푸시 → Vercel 자동 배포
4. **검증:** 프로덕션 환경에서 OCR 재실행 테스트
5. **모니터링:** 서버 로그로 성공/실패 확인

---

## 9. 참고 사항

### Gemini API vs Vision API 비교

| 항목 | Gemini API | Vision API |
|-----|-----------|-----------|
| 설정 복잡도 | 간단 (API 키) | 복잡 (서비스 계정 파일) |
| Vercel 배포 | 쉬움 | 어려움 (파일 처리 필요) |
| 한글 인식 | 우수 | 우수 |
| 처리 속도 | 빠름 | 보통 |
| 비용 | 낮음 | 보통 |
| 안정성 | 높음 | 높음 |

**결론:** Gemini API를 우선 사용하고, Vision API는 폴백으로 유지하는 것이 최선입니다.

---

**작성자:** AI Assistant  
**분석 도구:** 브라우저 점검, 코드 리뷰, 환경 변수 확인
