# Cloud Run OCR 인증 토큰 생성 가이드

**작성일:** 2026년 1월 12일  
**상황:** Cloud Run 함수가 비공개 함수로 설정되어 있어 인증 토큰 필요  
**서비스 계정:** `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com`

---

## ✅ 확인된 사항

### 1. Cloud Run 함수 보안 설정
- **함수명:** `extracttextfromimage`
- **URL:** `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`
- **인증 설정:** ✅ **인증 필요** (Authentication required)
- **인증 방식:** Identity and Access Management (IAM)

### 2. 서비스 계정 정보
- **서비스 계정 이메일:** `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com`
- **할당된 역할:**
  - 소유자 (Owner)
  - **Cloud Run 호출자 (Cloud Run Invoker)** ← 이 역할이 중요!

---

## 🔑 인증 토큰 생성 방법

### 방법 1: Google Cloud CLI 사용 (권장)

#### 1단계: 서비스 계정 키 파일 다운로드

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **IAM & Admin → Service Accounts 이동**
   - 프로젝트: `habitree-f49e1`
   - 서비스 계정: `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com`

3. **키 생성**
   - 서비스 계정 선택 → **Keys** 탭 → **Add Key** → **Create new key**
   - **Key type:** JSON 선택
   - **Create** 클릭 → JSON 파일 다운로드

4. **키 파일 저장**
   - 예: `readtree-vision-api-service-key.json`
   - ⚠️ **보안 주의:** 이 파일은 절대 Git에 커밋하지 마세요!

#### 2단계: gcloud CLI 설치 및 설정

```bash
# gcloud CLI 설치 (이미 설치되어 있다면 생략)
# Windows: https://cloud.google.com/sdk/docs/install

# 서비스 계정 키로 인증
gcloud auth activate-service-account readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com --key-file=readtree-vision-api-service-key.json

# ID 토큰 생성
gcloud auth print-identity-token --audiences=https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage
```

**출력 예시:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL3VzLWNlbnRyYWwxLWhhYml0cmVlLWY0OWUxLmNsb3VkZnVuY3Rpb25zLm5ldC9leHRyYWN0VGV4dEZyb21JbWFnZSIsImV4cCI6MTczNjYxNjkyOTcsImlhdCI6MTczNjYxMzMyOTcsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsInN1YiI6IjExMjIzMzQ0NTU2Njc3ODg5MDAxMTIyMzM0NDU1NjY3Nzg4OTAwIn0.abc123def456...
```

이 토큰을 `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수에 설정하세요.

---

### 방법 2: Node.js 스크립트 사용

서비스 계정 키 파일이 있다면, Node.js 스크립트로 토큰을 생성할 수 있습니다.

#### 스크립트 생성

```javascript
// generate-token.js
const { GoogleAuth } = require('google-auth-library');

async function generateToken() {
  const auth = new GoogleAuth({
    keyFile: './readtree-vision-api-service-key.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const url = 'https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage';
  
  const token = await client.getAccessToken();
  console.log('Access Token:', token.token);
  
  // ID 토큰 생성 (더 정확한 방법)
  const idToken = await client.getIdToken(url);
  console.log('ID Token:', idToken);
}

generateToken().catch(console.error);
```

#### 실행

```bash
npm install google-auth-library
node generate-token.js
```

---

### 방법 3: Vercel 환경 변수에 직접 설정 (임시)

⚠️ **주의:** 이 방법은 토큰이 만료되면 다시 생성해야 합니다.

1. **토큰 생성** (방법 1 또는 2 사용)
2. **Vercel 환경 변수 설정:**
   - Key: `CLOUD_RUN_OCR_AUTH_TOKEN`
   - Value: 생성한 토큰
   - Environment: Production, Preview, Development

---

## 🔄 토큰 갱신 방법

### 토큰 만료 시간
- ID 토큰은 일반적으로 **1시간** 동안 유효합니다.
- 토큰이 만료되면 새로운 토큰을 생성해야 합니다.

### 자동 갱신 (권장)

Vercel에서는 환경 변수를 직접 갱신할 수 없으므로, 다음 방법을 고려하세요:

1. **서버리스 함수에서 동적 토큰 생성** (복잡하지만 자동)
2. **정기적으로 토큰 갱신 및 Vercel 환경 변수 업데이트** (수동)

---

## 📋 Vercel 환경 변수 설정 단계

### 1. 토큰 생성
위의 방법 1 또는 2를 사용하여 인증 토큰 생성

### 2. Vercel 대시보드에서 설정

1. **Vercel 프로젝트 선택**
   - https://vercel.com/dashboard

2. **Settings → Environment Variables 이동**

3. **환경 변수 추가:**
   ```
   Key: CLOUD_RUN_OCR_AUTH_TOKEN
   Value: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9... (생성한 토큰)
   Environment: Production, Preview, Development (모두 선택)
   ```

4. **저장**

### 3. 재배포

환경 변수를 추가한 후:
- **자동 재배포:** Vercel이 자동으로 재배포하지 않을 수 있음
- **수동 재배포:** Deployments 탭 → 최신 배포 → **Redeploy** 클릭

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# .env.local 파일에 토큰 설정
CLOUD_RUN_OCR_AUTH_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# 개발 서버 실행
npm run dev

# OCR 기능 테스트
```

### 2. Vercel 배포 후 테스트

1. 환경 변수 설정 확인
2. 재배포 완료 대기
3. OCR 기능 테스트
4. Vercel Functions 로그 확인

---

## ❌ 문제 해결

### 문제 1: 401 Unauthorized

**증상:**
```
Cloud Run OCR API 호출 실패: 401 Unauthorized
```

**가능한 원인:**
1. `CLOUD_RUN_OCR_AUTH_TOKEN` 미설정
2. 토큰이 만료됨
3. 토큰 형식이 잘못됨

**해결 방법:**
1. Vercel 환경 변수 확인
2. 새로운 토큰 생성
3. 환경 변수 업데이트 및 재배포

---

### 문제 2: 403 Forbidden

**증상:**
```
Cloud Run OCR API 호출 실패: 403 Forbidden
```

**가능한 원인:**
1. 서비스 계정에 "Cloud Run 호출자" 역할이 없음
2. 함수에 서비스 계정 접근 권한이 없음

**해결 방법:**
1. Google Cloud Console → Cloud Functions → `extracttextfromimage` 함수
2. **Permissions** 탭 확인
3. 서비스 계정 `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com`에 "Cloud Run Invoker" 역할 부여

---

## 📊 체크리스트

### 토큰 생성 전
- [ ] 서비스 계정 키 파일 다운로드
- [ ] gcloud CLI 설치 (또는 Node.js 스크립트 준비)

### 토큰 생성 후
- [ ] 토큰 생성 확인
- [ ] Vercel 환경 변수 설정
- [ ] 재배포 완료 확인
- [ ] OCR 기능 테스트
- [ ] Vercel Functions 로그 확인

---

## 📝 요약

### 필수 설정
1. **서비스 계정 키 파일 다운로드**
2. **인증 토큰 생성** (gcloud CLI 또는 Node.js 스크립트)
3. **Vercel 환경 변수 설정:** `CLOUD_RUN_OCR_AUTH_TOKEN`
4. **재배포**

### 확인 사항
- ✅ Cloud Run 함수가 비공개 함수임 (인증 필요)
- ✅ 서비스 계정에 "Cloud Run 호출자" 역할 할당됨
- ✅ 인증 토큰이 올바르게 생성됨
- ✅ Vercel 환경 변수가 올바르게 설정됨

---

**이 문서는 Cloud Run OCR 인증 토큰 생성 및 설정 가이드입니다.**
