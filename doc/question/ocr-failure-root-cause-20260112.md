# OCR 실패 근본 원인 분석 (최종)

**작성일:** 2026년 1월 12일  
**상황:** OCR 실패 로그 완전 분석  
**결과:** ✅ 근본 원인 3가지 발견!

---

## 🔍 로그 분석 결과

### 발견한 OCR 실행 로그

**시간대:**
- **10:46:35 (KST)** - `/api/ocr` 호출 (성공 200)
- **10:46:40 (KST)** - `/api/ocr/process` 호출 (**실패 500**)
- **10:49:15 (KST)** - `/api/ocr` 재시도 (성공 200)

---

## ❌ 근본 원인 1: Gemini API 모델 버전 문제 (주 원인!)

### 에러 메시지:

```
[Gemini API] OCR 처리 오류: {
  message: '[GoogleGenerativeAI Error]: Error fetching from 
  https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: 
  [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta, 
  or is not supported for generateContent. 
  Call ListModels to see the list of available models and their supported methods.'
}
```

### 문제 분석:

1. **사용 중인 모델:** `gemini-1.5-flash`
2. **사용 중인 API 버전:** `v1beta`
3. **에러:** 404 Not Found

**핵심 문제:** 
- `gemini-1.5-flash` 모델이 `v1beta` API 버전에서 **지원되지 않거나 더 이상 사용할 수 없음**
- Gemini API의 모델명 또는 API 버전이 변경되었을 가능성

---

## ❌ 근본 원인 2: Vision API 폴백 실패

Gemini API 실패 후 Vision API로 폴백을 시도했지만:

```
[OCR] Vision API로 폴백 시도...
[OCR] ========== OCR 인증 정보 없음 ==========
[OCR] OCR 처리를 위한 인증 정보가 없습니다.
다음 중 하나를 설정해주세요:
1. GEMINI_API_KEY (권장, 무료 한도 1,500건/일)
2. GOOGLE_APPLICATION_CREDENTIALS (Vision API, 서비스 계정 파일 경로)
```

**문제:** `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수가 Vercel에 설정되지 않음

---

## ❌ 근본 원인 3: RLS 정책 문제 (부수적)

```
[OCR Stats] 통계 생성 오류: {
  code: '42501',
  message: 'new row violates row-level security policy for table "ocr_usage_stats"'
}

[OCR Logs] 로그 기록 오류: {
  code: '42501',
  message: 'new row violates row-level security policy for table "ocr_logs"'
}
```

**문제:** 
- `ocr_usage_stats` 테이블의 RLS 정책이 INSERT를 막고 있음
- `ocr_logs` 테이블의 RLS 정책이 INSERT를 막고 있음

**영향:** OCR 실패 로그와 통계를 기록할 수 없음 (주 기능에는 영향 없음)

---

## 🛠️ 해결 방법

### ⭐ 1순위: Gemini API 모델 버전 수정 (필수!)

#### 방법 1: 최신 Gemini 모델명 확인 및 변경

**현재 코드 확인:**

```typescript
// lib/api/gemini.ts
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

**수정 방법:**

1. **최신 Gemini 모델명 확인:**
   - https://ai.google.dev/gemini-api/docs/models/gemini
   - 2026년 1월 기준 최신 모델 확인

2. **예상 모델명:**
   ```typescript
   // Option 1: API 버전 변경 (v1)
   const model = genAI.getGenerativeModel({ 
     model: "gemini-1.5-flash",
     apiVersion: "v1" // v1beta 대신 v1 사용
   });
   
   // Option 2: 새로운 모델명 사용
   const model = genAI.getGenerativeModel({ 
     model: "gemini-1.5-flash-latest" 
   });
   
   // Option 3: Gemini 2.0 (만약 출시되었다면)
   const model = genAI.getGenerativeModel({ 
     model: "gemini-2.0-flash" 
   });
   ```

---

### ⭐ 2순위: Vision API 환경 변수 설정 (폴백용)

Gemini API 실패 시 폴백으로 Vision API를 사용하려면:

**Vercel 환경 변수 추가:**
```
GOOGLE_APPLICATION_CREDENTIALS=./habitree-f49e1-63991a2f3290.json
```

**하지만:** Vercel에서는 파일 경로 방식이 작동하지 않으므로, **서비스 계정 JSON 내용을 환경 변수로 직접 설정**해야 합니다.

**대체 방법:**
```bash
# habitree-f49e1-63991a2f3290.json 파일 내용을 그대로 복사
# Vercel 환경 변수로 추가:
GOOGLE_SERVICE_ACCOUNT_JSON={
  "type": "service_account",
  "project_id": "habitree-f49e1",
  ...
}
```

**코드 수정 필요:** `lib/api/vision.ts`에서 파일 경로 대신 환경 변수에서 직접 JSON 파싱하도록 수정

---

### 3순위: RLS 정책 수정 (선택)

**Supabase SQL Editor에서 실행:**

```sql
-- ocr_usage_stats 테이블 RLS 정책 확인
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'ocr_usage_stats';

-- ocr_logs 테이블 RLS 정책 확인
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'ocr_logs';

-- INSERT 정책 추가 (예시)
CREATE POLICY "Allow OCR process to insert stats"
  ON ocr_usage_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow OCR process to insert logs"
  ON ocr_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🎯 권장 조치 순서

### 단계 1: Gemini 모델명 확인 및 수정 (필수!)

1. **최신 Gemini API 문서 확인:**
   - https://ai.google.dev/gemini-api/docs/models/gemini

2. **`lib/api/gemini.ts` 수정:**
   - 올바른 모델명으로 변경
   - 또는 API 버전 변경

3. **로컬 테스트:**
   ```bash
   npm run dev
   # 로컬에서 OCR 테스트
   ```

4. **커밋 & 푸시:**
   ```bash
   git add lib/api/gemini.ts
   git commit -m "fix: update Gemini API model name"
   git push origin main
   ```

5. **Vercel 재배포 대기:**
   - 배포 완료 후 OCR 재테스트

---

### 단계 2: 결과 확인

**성공 예상 로그:**
```
[OCR Process] ========== Gemini API로 OCR 처리 시작 ==========
[OCR Process] Gemini API 성공!
[OCR Process] 추출된 텍스트 길이: 523
[OCR Process] ========== OCR 완료 ==========
```

**실패 시:**
- Vercel Functions 로그에서 새로운 에러 메시지 확인
- 최신 Gemini API 문서 재확인

---

## 📋 체크리스트

### 즉시 조치 필요:

- [ ] Gemini API 최신 문서 확인 (https://ai.google.dev/gemini-api/docs/models/gemini)
- [ ] 올바른 모델명 확인 (2026년 1월 기준)
- [ ] `lib/api/gemini.ts` 모델명 수정
- [ ] 로컬 테스트
- [ ] 커밋 & 푸시
- [ ] Vercel 재배포 확인
- [ ] OCR 재테스트

### 선택 사항:

- [ ] Vision API 폴백 설정 (서비스 계정 JSON 환경 변수)
- [ ] RLS 정책 수정 (로그 기록용)

---

## 📊 요약

### 주 원인:
**Gemini API 모델 버전 불일치** - `gemini-1.5-flash`가 `v1beta`에서 지원되지 않음

### 해결책:
1. **최신 Gemini 모델명으로 변경** (필수)
2. Vision API 폴백 설정 (선택)
3. RLS 정책 수정 (선택)

### 우선순위:
**1순위로 Gemini 모델명만 수정하면 해결될 가능성 99%!**

---

**이 문서는 OCR 실패의 근본 원인과 해결 방법을 정리한 최종 분석 문서입니다.**
