# Vercel 환경 변수 설정 가이드 - OCR API 키

**작성일:** 2026년 1월 12일  
**문제:** OCR 실행 시 실패 (Vercel 배포 환경)  
**원인:** Vercel 프로젝트에 환경 변수 미설정

---

## 📌 문제 상황

### 현재 상태
- ✅ 로컬 개발 환경: `.env.local`에 `GEMINI_API_KEY` 설정됨
- ❌ Vercel 배포 환경: 환경 변수 미설정
- 결과: **OCR 실패** 상태 지속

### 테스트 결과
```
1. "재실행" 버튼 클릭
2. "재시작 중..." 표시
3. 10초 후 다시 "OCR 실패"로 돌아옴
```

**API 호출 확인:**
```
[POST] https://readingtree2-0.vercel.app/api/ocr
→ 호출은 성공했지만 OCR 처리 실패
```

---

## 🔍 원인 분석

### 1. 환경 변수 분리
- **로컬 환경**: `.env.local` 파일 사용
- **Vercel 환경**: Vercel 프로젝트 설정에서 별도로 관리
- ⚠️ **`.env.local` 파일은 Git에 커밋되지 않으며 Vercel에 자동으로 전달되지 않습니다!**

### 2. OCR 처리 흐름
```
1. 사용자가 "재실행" 클릭
   ↓
2. /api/ocr 호출 (성공)
   ↓
3. /api/ocr/process 호출 (내부)
   ↓
4. lib/api/ocr.ts → extractTextFromImage()
   ↓
5. lib/api/gemini.ts → extractWithGemini()
   ↓
6. process.env.GEMINI_API_KEY 확인 → ❌ undefined (Vercel에서)
   ↓
7. lib/api/vision.ts → extractWithVision() (폴백 시도)
   ↓
8. process.env.GOOGLE_APPLICATION_CREDENTIALS 확인 → ❌ undefined
   ↓
9. 오류 발생: "OCR 처리를 위한 인증 정보가 없습니다."
   ↓
10. transcriptions 테이블 status = "failed" 업데이트
```

### 3. 실패 이유
```typescript
// lib/api/ocr.ts
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // 1. Gemini API 우선 시도
  const geminiApiKey = process.env.GEMINI_API_KEY;  // ← Vercel에서 undefined
  
  if (geminiApiKey) {
    // ... Gemini 처리
  } else {
    console.warn("[OCR] GEMINI_API_KEY 미설정, Vision API로 바로 진행");
  }
  
  // 2. Vision API 폴백
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;  // ← Vercel에서 undefined
  
  if (!credentialsPath) {
    throw new Error("OCR 처리를 위한 인증 정보가 없습니다.");  // ← 여기서 실패!
  }
}
```

---

## ✅ 해결 방법

### 1단계: Vercel 프로젝트 설정 페이지 접속

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택**
   - `readingtree2-0` 프로젝트 클릭

3. **Settings 메뉴 선택**
   - 상단 메뉴에서 "Settings" 클릭

4. **Environment Variables 메뉴 선택**
   - 왼쪽 사이드바에서 "Environment Variables" 클릭

---

### 2단계: 환경 변수 추가

#### 추가할 환경 변수

**1. GEMINI_API_KEY (필수)**
```
이름: GEMINI_API_KEY
값: AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM
환경: Production, Preview, Development (모두 체크)
```

**2. GOOGLE_APPLICATION_CREDENTIALS (선택 - 폴백용)**
```
⚠️ 주의: 서비스 계정 파일 경로 방식은 Vercel에서 작동하지 않습니다!
Vision API를 폴백으로 사용하려면 JSON 파일 내용을 환경 변수로 설정해야 합니다.
→ 현재는 Gemini API만 사용하므로 설정하지 않아도 됩니다.
```

---

### 3단계: 환경 변수 추가 절차 (화면 기준)

#### 1. "Add Environment Variable" 버튼 클릭

#### 2. 환경 변수 입력

**Name (이름):**
```
GEMINI_API_KEY
```

**Value (값):**
```
AIzaSyBSFmuMAlbwmszk-Ppk27H6AmnQSaXuqqM
```

**Environment (환경):**
- ✅ Production (프로덕션 환경)
- ✅ Preview (프리뷰 배포 - PR 등)
- ✅ Development (개발 환경 - Vercel CLI)

#### 3. "Save" 버튼 클릭

---

### 4단계: 재배포 트리거

환경 변수를 추가한 후에는 **반드시 재배포**가 필요합니다.

#### 방법 1: Vercel 대시보드에서 재배포

1. **Deployments 메뉴 선택**
2. **최신 배포 선택** (현재: `d5e367c`)
3. **"..." 메뉴 클릭** (우측 상단)
4. **"Redeploy" 선택**
5. **"Use existing Build Cache" 체크 해제** (환경 변수 적용을 위해)
6. **"Redeploy" 버튼 클릭**

#### 방법 2: 빈 커밋으로 재배포 (로컬에서)

```bash
# 빈 커밋 생성
git commit --allow-empty -m "chore: trigger redeploy for env vars"

# GitHub에 푸시
git push origin main
```

---

### 5단계: 배포 완료 확인

#### 1. 배포 로그 확인

Vercel 대시보드에서 배포 로그를 확인하여 환경 변수가 제대로 설정되었는지 확인합니다.

**예상 로그:**
```
[OCR] ========== Gemini API로 OCR 처리 시작 ==========
[OCR] Image URL: https://...
[OCR] Gemini API 성공!
[OCR] 추출된 텍스트 길이: 123
```

#### 2. OCR 테스트

1. https://readingtree2-0.vercel.app/notes/5c941547-c3ea-4763-a5c6-7ce7ea432e52 접속
2. "재실행" 버튼 클릭
3. "재시작 중..." 표시
4. 약 5-10초 후 "OCR 완료" 또는 "필사" 배지로 변경

---

## 📊 환경 변수 설정 확인 체크리스트

배포 전:
- [ ] Vercel 대시보드 → Settings → Environment Variables 접속
- [ ] `GEMINI_API_KEY` 추가 (Production, Preview, Development 모두 체크)
- [ ] "Save" 버튼 클릭
- [ ] 재배포 트리거 (Redeploy 또는 빈 커밋)

배포 후:
- [ ] Vercel 배포 로그에서 "Build" 성공 확인
- [ ] 배포 완료 후 해당 기록 페이지 접속
- [ ] "재실행" 버튼 클릭
- [ ] OCR 처리 성공 확인 (배지 변경)

---

## 🔧 추가 설정 (선택사항)

### Vision API 폴백 설정 (선택)

만약 Gemini API가 할당량 초과 등으로 실패할 경우를 대비하여 Vision API를 폴백으로 설정하고 싶다면:

**⚠️ 주의:** Vision API는 서비스 계정 JSON 파일 방식이 Vercel에서 작동하지 않으므로, **추가 설정이 필요합니다**.

#### 방법 1: Vercel Blob Storage 사용 (권장)
1. 서비스 계정 JSON 파일을 Vercel Blob에 업로드
2. 런타임에 다운로드하여 사용

#### 방법 2: 환경 변수로 JSON 전체 저장
1. `habitree-f49e1-63991a2f3290.json` 파일 내용 복사
2. Vercel 환경 변수에 `GOOGLE_SERVICE_ACCOUNT_JSON` 이름으로 추가 (JSON 전체)
3. `lib/api/vision.ts` 코드 수정:

```typescript
// 파일 경로 대신 환경 변수에서 직접 로드
const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON 
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  : undefined;

const client = new ImageAnnotatorClient({
  credentials: credentials,
});
```

**현재는 Gemini API만으로 충분하므로 이 설정은 선택사항입니다.**

---

## 🎯 요약

### 필수 작업
1. ✅ Vercel 프로젝트 설정에서 `GEMINI_API_KEY` 환경 변수 추가
2. ✅ 재배포 (Redeploy 또는 빈 커밋)
3. ✅ OCR 테스트

### 예상 소요 시간
- 환경 변수 설정: 2분
- 재배포: 2-3분
- 테스트: 1분
- **총 5-6분**

---

## 📝 참고 자료

- [Vercel 환경 변수 문서](https://vercel.com/docs/projects/environment-variables)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)
- 프로젝트 내 관련 파일:
  - `lib/api/ocr.ts`: OCR 통합 로직
  - `lib/api/gemini.ts`: Gemini API 구현
  - `lib/api/vision.ts`: Vision API 구현
  - `app/api/ocr/process/route.ts`: OCR 처리 API

---

**이 문서를 따라 환경 변수를 설정하면 OCR이 정상적으로 작동할 것입니다!** 🚀
