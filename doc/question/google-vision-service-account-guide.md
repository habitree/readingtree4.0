# Google Vision API 서비스 계정 설정 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**목적:** 서비스 계정을 사용한 Google Vision API 설정 (프로덕션 권장)

---

## 목차

1. [서비스 계정이란?](#1-서비스-계정이란)
2. [서비스 계정 생성](#2-서비스-계정-생성)
3. [Vision API 권한 부여](#3-vision-api-권한-부여)
4. [JSON 키 다운로드](#4-json-키-다운로드)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [코드에서 사용 방법](#6-코드에서-사용-방법)
7. [보안 주의사항](#7-보안-주의사항)
8. [문제 해결](#8-문제-해결)

---

## 1. 서비스 계정이란?

### 1.1 서비스 계정의 개념

**서비스 계정**은 사람이 아닌 애플리케이션이 Google Cloud 서비스를 사용하기 위한 특수 계정입니다.

**주요 특징:**
- ✅ **제한사항 문제 없음**: 웹사이트 제한사항, IP 제한 등이 필요 없음
- ✅ **보안 강화**: API 키보다 안전한 인증 방식
- ✅ **프로덕션 적합**: 서버 사이드 호출에 최적화
- ✅ **권한 관리**: IAM을 통한 세밀한 권한 제어

### 1.2 API 키 vs 서비스 계정

| 항목 | API 키 | 서비스 계정 |
|------|--------|-------------|
| **설정 난이도** | 간단 | 보통 |
| **보안** | 상대적으로 낮음 | 높음 |
| **제한사항** | 웹사이트/IP 제한 필요 | 제한사항 없음 |
| **서버 사이드** | 제한사항 문제 발생 가능 | 문제 없음 |
| **프로덕션** | 비권장 | 권장 |
| **비용** | 동일 | 동일 |

---

## 2. 서비스 계정 생성

### 2.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인
3. **프로젝트 선택**: `habitree-f49e1` (또는 해당 프로젝트)

### 2.2 IAM 및 관리자 메뉴 접속

1. 왼쪽 메뉴에서 **IAM 및 관리자** 클릭
2. **서비스 계정** 클릭

**경로:**
```
Google Cloud Console
  → IAM 및 관리자
    → 서비스 계정
```

### 2.3 서비스 계정 생성

1. 상단 **+ 서비스 계정 만들기** 버튼 클릭

2. **서비스 계정 세부정보** 입력:
   - **서비스 계정 이름**: `vision-api-service` (또는 원하는 이름)
   - **서비스 계정 ID**: 자동 생성됨 (변경 가능)
   - **설명** (선택): `OCR 처리를 위한 Vision API 서비스 계정`
   - **만들기 및 계속** 클릭

3. **이 서비스 계정에 역할 부여** (선택):
   - 이 단계는 건너뛰고 나중에 설정할 수 있습니다
   - **계속** 클릭

4. **사용자에게 이 서비스 계정에 대한 액세스 권한 부여** (선택):
   - 일반적으로 필요 없음
   - **완료** 클릭

**완료:** 서비스 계정이 생성되었습니다!

---

## 3. Vision API 권한 부여

### 3.1 서비스 계정에 역할 부여

1. **서비스 계정 목록**에서 방금 생성한 서비스 계정 클릭
2. **권한** 탭 클릭
3. **역할 추가** 버튼 클릭
4. **역할** 드롭다운에서 다음 중 하나 선택:
   - **Cloud Vision API 사용자** (권장)
   - 또는 **Cloud Vision API 클라이언트**
5. **저장** 클릭

**참고:** 
- **Cloud Vision API 사용자**: Vision API를 사용할 수 있는 권한
- **Cloud Vision API 클라이언트**: Vision API를 사용하고 관리할 수 있는 권한 (더 넓은 권한)

### 3.2 프로젝트 레벨 권한 확인

**대안 방법:** 프로젝트 레벨에서 Vision API가 활성화되어 있으면 서비스 계정도 사용할 수 있습니다.

1. **API 및 서비스** → **사용 설정된 API** 클릭
2. **Cloud Vision API**가 목록에 있는지 확인
3. 없으면 **+ API 및 서비스 사용 설정** 클릭하여 활성화

---

## 4. JSON 키 다운로드

### 4.1 키 생성

1. **서비스 계정 목록**에서 서비스 계정 클릭
2. **키** 탭 클릭
3. **키 추가** → **새 키 만들기** 클릭
4. **키 유형**: **JSON** 선택
5. **만들기** 클릭

**중요:** JSON 파일이 자동으로 다운로드됩니다. 이 파일은 **한 번만 다운로드**되므로 안전하게 보관하세요!

### 4.2 JSON 키 파일 구조

다운로드된 JSON 파일 예시:

```json
{
  "type": "service_account",
  "project_id": "habitree-f49e1",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "vision-api-service@habitree-f49e1.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/vision-api-service%40habitree-f49e1.iam.gserviceaccount.com"
}
```




**보안 주의:**
- ⚠️ 이 파일은 **절대 공개 저장소에 커밋하지 마세요!**
- ⚠️ `.gitignore`에 추가되어 있는지 확인하세요
- ⚠️ 파일이 노출되면 즉시 삭제하고 새로 생성하세요

---

## 5. 환경 변수 설정

서비스 계정을 사용하는 방법은 **2가지**가 있습니다:

### 방법 1: JSON 파일 경로 사용 (로컬 개발용)

#### 5.1.1 파일 위치

JSON 키 파일을 프로젝트 루트에 저장 (`.gitignore`에 추가되어 있어야 함):

```
readingtree_v4.0.0/
├── .env.local
├── service-account-key.json  ← 여기에 저장 (절대 커밋하지 마세요!)
└── ...
```

**또는 프로젝트 외부에 저장:**

```
C:\Users\YourName\Documents\google-credentials\
└── vision-api-service-account.json
```

#### 5.1.2 `.env.local` 설정

```env
# Google Vision API (서비스 계정 - 파일 경로 방식)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

**절대 경로 사용 시:**

```env
# Windows
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\Documents\google-credentials\vision-api-service-account.json

# 또는 상대 경로
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

#### 5.1.3 `.gitignore` 확인

`.gitignore` 파일에 다음이 포함되어 있는지 확인:

```
# Google service account keys
service-account-key.json
*.json
!package.json
!package-lock.json
!tsconfig.json
```

### 방법 2: JSON 문자열 사용 (Vercel 배포용 권장)

#### 5.2.1 JSON 내용을 환경 변수로 변환

1. 다운로드한 JSON 파일을 텍스트 에디터로 열기
2. 전체 내용 복사
3. 한 줄로 만들기 (줄바꿈 제거)

**예시:**
```json
{"type":"service_account","project_id":"habitree-f49e1","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"vision-api-service@habitree-f49e1.iam.gserviceaccount.com",...}
```

#### 5.2.2 `.env.local` 설정

```env
# Google Vision API (서비스 계정 - JSON 문자열 방식)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"habitree-f49e1",...}
```

**주의:** JSON 문자열 내부의 따옴표는 이스케이프 처리할 필요 없습니다 (환경 변수는 전체를 문자열로 처리).

---

## 6. 코드에서 사용 방법

### 6.1 현재 코드 구조

현재 `lib/api/vision.ts`는 이미 서비스 계정을 지원합니다:

```typescript
function getVisionClient(): ImageAnnotatorClient {
  // 방법 1: 서비스 계정 JSON 파일 경로
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // 방법 2: 서비스 계정 JSON 문자열
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (credentialsPath) {
    return new ImageAnnotatorClient({
      keyFilename: credentialsPath,
    });
  } else if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    return new ImageAnnotatorClient({
      credentials,
    });
  }
  // ...
}
```

### 6.2 우선순위

코드는 다음 순서로 인증 방식을 확인합니다:

1. **API 키 방식** (`GOOGLE_VISION_API_KEY`) - 우선순위 1
2. **서비스 계정 파일 경로** (`GOOGLE_APPLICATION_CREDENTIALS`) - 우선순위 2
3. **서비스 계정 JSON 문자열** (`GOOGLE_SERVICE_ACCOUNT_JSON`) - 우선순위 3

**현재 상황:**
- API 키가 설정되어 있으면 API 키 방식 사용
- API 키가 없으면 서비스 계정 방식 시도

**서비스 계정만 사용하려면:**
- `.env.local`에서 `GOOGLE_VISION_API_KEY` 제거 또는 주석 처리
- `GOOGLE_APPLICATION_CREDENTIALS` 또는 `GOOGLE_SERVICE_ACCOUNT_JSON` 설정

---

## 7. 보안 주의사항

### 7.1 절대 하지 말아야 할 것

❌ **JSON 키 파일을 Git에 커밋**
```bash
# 나쁜 예
git add service-account-key.json
git commit -m "Add service account key"
```

❌ **JSON 키를 코드에 하드코딩**
```typescript
// 나쁜 예
const credentials = {
  type: "service_account",
  project_id: "habitree-f49e1",
  private_key: "-----BEGIN PRIVATE KEY-----\n...",
  // ...
};
```

❌ **공개 저장소에 JSON 키 업로드**
- GitHub, GitLab 등 공개 저장소에 업로드 금지

### 7.2 올바른 보안 관행

✅ **`.gitignore`에 추가**
```
service-account-key.json
*.json
!package.json
!tsconfig.json
```

✅ **환경 변수 사용**
- 로컬: `.env.local` (Git에 커밋하지 않음)
- Vercel: Environment Variables
- GitHub: Secrets

✅ **최소 권한 원칙**
- 필요한 권한만 부여 (Cloud Vision API 사용자)

✅ **정기적인 키 로테이션**
- 3-6개월마다 새 키 생성 및 교체

### 7.3 키 노출 시 대응

만약 JSON 키가 노출되었다면:

1. **즉시 키 삭제**
   - Google Cloud Console → 서비스 계정 → 키 → 삭제

2. **새 키 생성**
   - 위의 "4. JSON 키 다운로드" 과정 반복

3. **환경 변수 업데이트**
   - 로컬, Vercel, GitHub Secrets 모두 업데이트

---

## 8. 문제 해결

### 8.1 "GOOGLE_APPLICATION_CREDENTIALS 파일을 찾을 수 없습니다"

**증상:**
```
Error: Could not load the default credentials
```

**해결:**
1. 파일 경로 확인:
   ```bash
   # Windows PowerShell
   Test-Path ".\service-account-key.json"
   ```
2. 절대 경로 사용:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=C:\full\path\to\service-account-key.json
   ```
3. 파일 권한 확인 (읽기 권한 필요)

### 8.2 "GOOGLE_SERVICE_ACCOUNT_JSON 파싱 오류"

**증상:**
```
SyntaxError: Unexpected token
```

**해결:**
1. JSON 형식 확인:
   - JSON이 유효한지 확인
   - 줄바꿈이 제거되었는지 확인
   - 따옴표가 올바르게 이스케이프되었는지 확인

2. 온라인 JSON 검증 도구 사용:
   - [JSONLint](https://jsonlint.com/)

### 8.3 "Permission denied"

**증상:**
```
Error: Permission denied. Please enable Cloud Vision API.
```

**해결:**
1. Vision API 활성화 확인:
   - Google Cloud Console → API 및 서비스 → 사용 설정된 API
   - Cloud Vision API가 목록에 있는지 확인

2. 서비스 계정 권한 확인:
   - 서비스 계정 → 권한 탭
   - "Cloud Vision API 사용자" 역할이 있는지 확인

3. 프로젝트 선택 확인:
   - 올바른 프로젝트를 선택했는지 확인

### 8.4 "Invalid credentials"

**증상:**
```
Error: Invalid credentials
```

**해결:**
1. JSON 키 파일이 올바른지 확인
2. 서비스 계정이 삭제되지 않았는지 확인
3. 프로젝트 ID가 일치하는지 확인

---

## 9. Vercel 배포 설정

### 9.1 Vercel 환경 변수 설정

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables** 클릭
3. **Add New** 클릭
4. 다음 정보 입력:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value**: JSON 파일 내용을 한 줄로 변환한 문자열
   - **Environment**: Production, Preview, Development 모두 선택
5. **Save** 클릭

**주의:** 
- JSON 문자열 내부의 따옴표는 그대로 유지
- 전체 JSON을 하나의 문자열로 입력

### 9.2 JSON 문자열 변환 방법

**PowerShell:**
```powershell
# JSON 파일을 한 줄로 변환
$json = Get-Content "service-account-key.json" -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
$json
```

**또는 수동:**
1. JSON 파일을 텍스트 에디터로 열기
2. 전체 선택 (Ctrl+A)
3. 복사 (Ctrl+C)
4. Vercel 환경 변수에 붙여넣기

---

## 10. 테스트 방법

### 10.1 환경 변수 확인

```bash
# PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS
# 또는
$env:GOOGLE_SERVICE_ACCOUNT_JSON
```

### 10.2 서버 재시작

환경 변수를 변경했다면 서버를 재시작하세요:

```bash
# 현재 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

### 10.3 OCR 테스트

1. 브라우저에서 필사 이미지 업로드
2. 터미널 로그 확인:
   ```
   [Vision API] API 키가 없습니다. 서비스 계정 방식으로 시도합니다.
   [Vision API] 이미지 다운로드 시작: ...
   [Vision API] Vision API 호출 성공
   ```

---

## 11. 체크리스트

서비스 계정 설정 완료 체크리스트:

- [ ] Google Cloud Console에서 서비스 계정 생성
- [ ] 서비스 계정에 "Cloud Vision API 사용자" 역할 부여
- [ ] JSON 키 다운로드 및 안전하게 보관
- [ ] `.gitignore`에 JSON 파일 추가 확인
- [ ] `.env.local`에 환경 변수 설정
- [ ] 서버 재시작
- [ ] OCR 테스트 성공 확인
- [ ] Vercel 환경 변수 설정 (배포 시)
- [ ] GitHub Secrets 설정 (CI/CD 사용 시)

---

## 12. 참고 자료

- [Google Cloud 서비스 계정 문서](https://cloud.google.com/iam/docs/service-accounts)
- [Vision API Node.js 클라이언트](https://github.com/googleapis/nodejs-vision)
- [서비스 계정 인증 가이드](https://cloud.google.com/docs/authentication/production)

---

**이 가이드를 따라 설정하면 서비스 계정을 사용하여 Google Vision API를 안전하게 사용할 수 있습니다.**

