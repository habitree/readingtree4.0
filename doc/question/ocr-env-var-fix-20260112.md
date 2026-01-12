# Vercel 환경 변수 설정 오류 수정

**작성일:** 2026년 1월 12일  
**문제:** Vercel 환경 변수 이름 오류  
**해결:** 불필요한 변수 삭제

---

## ❌ 발견된 문제

### Vercel에 설정된 환경 변수
```
1. GOOGLE_VISION_API_KEY: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM
   ↑ ❌ 코드에서 사용하지 않는 변수! (잘못 추가됨)
   
2. GEMINI_API_KEY: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM
   ↑ ✅ 올바른 변수
```

**문제점:**
- `GOOGLE_VISION_API_KEY`는 **코드에서 사용하지 않는 환경 변수**입니다
- Gemini API 키가 두 번 중복 등록되었습니다
- 혼란을 야기할 수 있습니다

---

## 🔍 코드에서 실제로 사용하는 환경 변수

### lib/api/ocr.ts
```typescript
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // 1. Gemini API 우선 시도
  const geminiApiKey = process.env.GEMINI_API_KEY;  // ← 올바른 변수명
  
  if (geminiApiKey) {
    // Gemini 처리
  }
  
  // 2. Vision API 폴백
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;  // ← 서비스 계정 파일 경로
  
  if (!credentialsPath) {
    throw new Error("OCR 처리를 위한 인증 정보가 없습니다.");
  }
}
```

### lib/api/gemini.ts
```typescript
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;  // ← 올바른 변수명
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
}
```

### lib/api/vision.ts
```typescript
// Vision API는 API 키를 사용하지 않습니다!
// 대신 서비스 계정 파일 경로를 사용합니다:
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
```

---

## ✅ 올바른 환경 변수 목록

### 현재 코드에서 사용하는 환경 변수:

1. **GEMINI_API_KEY** (필수)
   - 용도: Gemini API 인증
   - 값: `AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM`
   - 환경: Production, Preview, Development

2. **GOOGLE_APPLICATION_CREDENTIALS** (선택 - 폴백용)
   - 용도: Google Vision API 서비스 계정 파일 경로
   - 값: `./habitree-f49e1-63991a2f3290.json` (로컬만)
   - **⚠️ Vercel에서는 파일 경로 방식이 작동하지 않으므로 설정하지 않음**

3. **NEXT_PUBLIC_SUPABASE_URL** (기존)
   - 용도: Supabase 프로젝트 URL

4. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (기존)
   - 용도: Supabase 익명 키

5. **NAVER_CLIENT_ID**, **NAVER_CLIENT_SECRET** (기존)
   - 용도: 네이버 책 검색 API

6. **NEXT_PUBLIC_KAKAO_APP_KEY** (기존)
   - 용도: 카카오 OAuth 로그인

---

## 🔧 수정 방법

### 1단계: Vercel 대시보드 접속

1. https://vercel.com/dashboard
2. `readingtree2-0` 프로젝트 선택
3. Settings → Environment Variables

---

### 2단계: 잘못된 환경 변수 삭제

#### 삭제할 변수: `GOOGLE_VISION_API_KEY`

1. `GOOGLE_VISION_API_KEY` 환경 변수 찾기
2. 우측 "..." 메뉴 클릭
3. "Delete" 선택
4. 확인 팝업에서 "Delete" 클릭

**이유:**
- 코드에서 사용하지 않는 변수
- `GEMINI_API_KEY`와 중복
- 혼란을 야기

---

### 3단계: GEMINI_API_KEY 확인

#### 확인 사항:

**현재 설정:**
```
이름: GEMINI_API_KEY
값: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM
환경: Production, Preview, Development (모두 체크되어 있는지 확인)
```

**만약 환경이 하나만 체크되어 있다면:**
1. `GEMINI_API_KEY` 우측 "..." 메뉴 클릭
2. "Edit" 선택
3. Production, Preview, Development 모두 체크
4. "Save" 클릭

---

### 4단계: 재배포 (선택)

환경 변수를 삭제만 한 경우 재배포는 필요하지 않습니다.  
하지만 혹시 모를 오류를 방지하기 위해 재배포를 권장합니다.

#### 방법 1: Vercel 대시보드에서 재배포

1. Deployments 메뉴 선택
2. 최신 배포 선택
3. "..." 메뉴 클릭 → "Redeploy"
4. "Use existing Build Cache" 체크 해제
5. "Redeploy" 클릭

#### 방법 2: 빈 커밋으로 재배포

```bash
git commit --allow-empty -m "chore: clean up env vars"
git push origin main
```

---

## 📊 환경 변수 정리 전/후 비교

### ❌ 수정 전 (잘못된 상태)
```
GOOGLE_VISION_API_KEY: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM  ← 삭제 필요
GEMINI_API_KEY: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM  ← 유지
NEXT_PUBLIC_SUPABASE_URL: https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY: ...
NAVER_CLIENT_ID: ...
NAVER_CLIENT_SECRET: ...
NEXT_PUBLIC_KAKAO_APP_KEY: ...
```

### ✅ 수정 후 (올바른 상태)
```
GEMINI_API_KEY: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM  ← 유지 (Production, Preview, Development)
NEXT_PUBLIC_SUPABASE_URL: https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY: ...
NAVER_CLIENT_ID: ...
NAVER_CLIENT_SECRET: ...
NEXT_PUBLIC_KAKAO_APP_KEY: ...
```

---

## 🧪 OCR 테스트

### `GEMINI_API_KEY`가 이미 설정되어 있으므로 OCR은 작동해야 합니다!

#### 테스트 방법:

1. https://readingtree2-0.vercel.app/notes/5c941547-c3ea-4763-a5c6-7ce7ea432e52 접속
2. "재실행" 버튼 클릭
3. "재시작 중..." 표시
4. 약 5-10초 후 결과 확인

#### 예상 결과:

**성공 시:**
- ✅ 배지가 "OCR 완료" 또는 "필사"로 변경
- ✅ 추출된 텍스트가 표시됨

**실패 시:**
- ❌ 여전히 "OCR 실패" 표시
- → Vercel 함수 로그 확인 필요

---

## 🔍 실패 시 디버깅

### 1. Vercel 함수 로그 확인

1. Vercel 대시보드 → `readingtree2-0` 프로젝트
2. **Functions** 탭 선택
3. `/api/ocr/process` 함수 클릭
4. 로그 확인

**예상 로그 (성공 시):**
```
[OCR Process] 인증 확인: { hasUser: true, userId: '...' }
[OCR Process] 처리 시작: { noteId: '...', imageUrl: '...' }
[OCR Process] OCR API 호출 시작
[OCR] ========== Gemini API로 OCR 처리 시작 ==========
[OCR] Gemini API 성공!
[OCR Process] Transcription 저장 완료
[OCR Process] 처리 완료
```

**예상 로그 (실패 시):**
```
[OCR Process] 인증 확인: { hasUser: true, userId: '...' }
[OCR Process] 처리 시작: { noteId: '...', imageUrl: '...' }
[OCR Process] OCR API 호출 시작
[OCR] ========== Gemini API 실패 ==========
[OCR] 에러: API key not valid. Please pass a valid API key.
[OCR Process] ========== OCR 처리 오류 발생 ==========
```

### 2. 로그에 따른 조치

#### "API key not valid" 에러 발생 시:
- API 키가 잘못되었거나 할당량 초과
- Gemini API 콘솔에서 키 상태 확인: https://aistudio.google.com/app/apikey

#### "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다" 에러 발생 시:
- Vercel 환경 변수가 재배포 후에도 적용되지 않음
- 재배포 시 "Use existing Build Cache" 체크 해제 후 재시도

---

## 📋 체크리스트

### 필수 작업:
- [ ] Vercel 대시보드에서 `GOOGLE_VISION_API_KEY` 삭제
- [ ] `GEMINI_API_KEY` 환경 설정 확인 (Production, Preview, Development 모두 체크)
- [ ] OCR 테스트 실행
- [ ] 결과 확인 (성공/실패)

### 선택 작업:
- [ ] 재배포 (권장)
- [ ] Vercel 함수 로그 확인

---

## 💡 추가 정보

### 왜 `GOOGLE_VISION_API_KEY`가 생긴 건가요?

**추정 원인:**

1. **초기 OCR 구현 시도 시 착오**
   - Vision API를 API 키로 사용하려고 시도했을 가능성
   - 하지만 Vision API는 **서비스 계정 파일 경로** 방식을 사용합니다

2. **문서나 가이드 오해**
   - 일부 가이드에서 `GOOGLE_VISION_API_KEY`를 언급했을 가능성
   - 하지만 실제 코드에서는 `GEMINI_API_KEY`와 `GOOGLE_APPLICATION_CREDENTIALS`만 사용

3. **자동 생성된 환경 변수**
   - Vercel이 자동으로 제안한 환경 변수일 가능성 (낮음)

**결론:**
- `GOOGLE_VISION_API_KEY`는 사용하지 않으므로 **안전하게 삭제** 가능
- 삭제해도 시스템에 아무런 영향이 없습니다

---

## 🎯 요약

### 현재 상황
- ✅ `GEMINI_API_KEY`가 이미 설정되어 있음 → **OCR 작동 가능**
- ❌ `GOOGLE_VISION_API_KEY`는 불필요 → 삭제 권장

### 조치 사항
1. **필수**: OCR 테스트 실행 (이미 작동할 가능성 높음)
2. **권장**: `GOOGLE_VISION_API_KEY` 삭제 (혼란 방지)
3. **선택**: 재배포 (안정성 확보)

### 예상 소요 시간
- 환경 변수 삭제: 1분
- OCR 테스트: 1분
- 재배포 (선택): 2-3분
- **총 2-5분**

---

## 📝 참고 자료

- Gemini API 키 관리: https://aistudio.google.com/app/apikey
- Vercel 환경 변수 문서: https://vercel.com/docs/projects/environment-variables
- 프로젝트 관련 파일:
  - `lib/api/ocr.ts`: OCR 통합 로직
  - `lib/api/gemini.ts`: Gemini API 구현
  - `lib/api/vision.ts`: Vision API 구현

---

**`GEMINI_API_KEY`가 이미 설정되어 있으므로, OCR 테스트를 먼저 해보시는 것을 권장합니다!** 🚀
