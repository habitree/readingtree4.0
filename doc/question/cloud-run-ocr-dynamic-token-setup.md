# Cloud Run OCR 동적 토큰 생성 설정 가이드

**작성일:** 2026년 1월 12일  
**목적:** 런타임에 자동으로 인증 토큰을 생성하여 토큰 만료 문제 해결  
**방식:** 서비스 계정 키를 환경 변수로 저장하고, OCR 호출 시마다 토큰 자동 생성

---

## ✅ 코드 변경 완료

### 변경 사항
- **파일:** `lib/api/cloud-run-ocr.ts`
- **변경 내용:**
  - 동적 토큰 생성 로직 추가
  - 토큰 캐싱 (55분 유효, 5분 여유)
  - 정적 토큰 방식과 하위 호환성 유지

### 동작 방식
1. **우선순위 1:** 정적 토큰 (`CLOUD_RUN_OCR_AUTH_TOKEN`) - 기존 방식 유지
2. **우선순위 2:** 동적 토큰 생성 (`GOOGLE_SERVICE_ACCOUNT_KEY`) - 새 방식
3. **우선순위 3:** 인증 없음 (공개 함수 가정)

---

## 🔧 Vercel 환경 변수 설정

### 방법 1: 동적 토큰 생성 (권장) ⭐

서비스 계정 키를 환경 변수로 저장하면 자동으로 토큰이 생성됩니다.

#### 1단계: 서비스 계정 키 JSON을 한 줄로 변환

서비스 계정 키 파일(`habitree-f49e1-f25aade084d3.json`)의 내용을 한 줄로 변환합니다.

**PowerShell 명령어:**
```powershell
# JSON 파일을 한 줄로 읽기
$json = Get-Content -Path "habitree-f49e1-f25aade084d3.json" -Raw
$json = $json -replace "`r`n", "" -replace "`n", "" -replace "  ", ""
$json
```

**또는 수동으로:**
1. JSON 파일 열기
2. 모든 줄바꿈 제거
3. 공백 최소화 (선택 사항)

#### 2단계: Vercel 환경 변수 설정

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables 이동**

3. **환경 변수 추가:**
   ```
   Key: GOOGLE_SERVICE_ACCOUNT_KEY
   Value: {"type":"service_account","project_id":"habitree-f49e1",...} (한 줄 JSON)
   Environment: Production, Preview, Development (모두 선택)
   ```

4. **저장**

#### 3단계: 기존 정적 토큰 제거 (선택 사항)

동적 토큰 생성이 정상 작동하면 `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수는 제거해도 됩니다.

---

### 방법 2: 정적 토큰 유지 (기존 방식)

기존 방식대로 정적 토큰을 사용할 수도 있습니다. 다만 1시간마다 수동으로 갱신해야 합니다.

```
Key: CLOUD_RUN_OCR_AUTH_TOKEN
Value: eyJhbGciOiJSUzI1NiIs... (생성한 토큰)
```

---

## 🎯 권장 설정

### ✅ 권장: 동적 토큰 생성

**장점:**
- ✅ 토큰 만료 걱정 없음
- ✅ 자동 갱신
- ✅ 수동 작업 불필요
- ✅ 운영 안정성 향상

**설정:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수만 설정

---

## 📊 토큰 캐싱 동작

### 캐싱 전략
- **토큰 유효 시간:** 약 1시간
- **캐시 만료 시간:** 55분 (5분 여유)
- **캐시 재사용:** 만료 1분 전까지 재사용

### 동작 흐름
```
1. OCR 요청
   ↓
2. 토큰 캐시 확인
   ↓
3. 캐시 유효? → 재사용
   ↓
4. 캐시 만료? → 새 토큰 생성 및 캐싱
   ↓
5. Cloud Run OCR 호출
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# .env.local 파일에 환경 변수 설정
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 개발 서버 실행
npm run dev

# OCR 기능 테스트
```

### 2. Vercel 배포 후 테스트

1. 환경 변수 설정 확인
2. 재배포 완료 대기
3. OCR 기능 테스트
4. Vercel Functions 로그 확인:
   ```
   [Cloud Run OCR] 동적 인증 토큰 생성 중...
   [Cloud Run OCR] 동적 인증 토큰 생성 완료 (캐시됨)
   [Cloud Run OCR] 인증 토큰 포함하여 호출
   ```

---

## ❌ 문제 해결

### 문제 1: 토큰 생성 실패

**증상:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: ...
```

**가능한 원인:**
1. `GOOGLE_SERVICE_ACCOUNT_KEY` 형식 오류 (JSON 파싱 실패)
2. 서비스 계정 키가 잘못됨
3. 네트워크 문제

**해결 방법:**
1. JSON 형식 확인 (한 줄로 변환되었는지)
2. 서비스 계정 키 파일 재다운로드
3. 환경 변수 재설정 및 재배포

---

### 문제 2: 401 Unauthorized

**증상:**
```
Cloud Run OCR API 호출 실패: 401 Unauthorized
```

**가능한 원인:**
1. 토큰 생성 실패
2. 서비스 계정 권한 부족
3. Cloud Run 함수 접근 권한 문제

**해결 방법:**
1. Vercel Functions 로그에서 토큰 생성 여부 확인
2. Google Cloud Console에서 서비스 계정 권한 확인
3. Cloud Run 함수에 "Cloud Run Invoker" 역할 부여 확인

---

## 📋 체크리스트

### 설정 전
- [ ] 서비스 계정 키 파일 확인
- [ ] JSON을 한 줄로 변환하는 방법 확인

### 설정 중
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정
- [ ] JSON 형식 확인 (한 줄, 유효한 JSON)
- [ ] 환경 변수 저장

### 설정 후
- [ ] 재배포 완료 확인
- [ ] OCR 기능 테스트
- [ ] Vercel Functions 로그 확인
- [ ] 동적 토큰 생성 로그 확인

---

## 📝 요약

### 변경 사항
- ✅ 동적 토큰 생성 로직 추가
- ✅ 토큰 캐싱으로 성능 최적화
- ✅ 정적 토큰 방식과 하위 호환성 유지

### 설정 방법
1. **서비스 계정 키 JSON을 한 줄로 변환**
2. **Vercel 환경 변수 설정:** `GOOGLE_SERVICE_ACCOUNT_KEY`
3. **재배포**

### 장점
- ✅ 토큰 만료 걱정 없음
- ✅ 자동 갱신
- ✅ 수동 작업 불필요
- ✅ 운영 안정성 향상

---

**이 문서는 Cloud Run OCR 동적 토큰 생성 설정 가이드입니다.**
