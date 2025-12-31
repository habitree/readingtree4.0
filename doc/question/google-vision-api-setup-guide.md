# Google Vision API 설정 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**목적:** Gemini API에서 Google Vision API로 OCR 처리 방식 변경

---

## 목차

1. [Google Vision API 개요](#1-google-vision-api-개요)
2. [API 키 발급 방법](#2-api-키-발급-방법)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [코드 변경 사항](#4-코드-변경-사항)
5. [비용 및 제한사항](#5-비용-및-제한사항)
6. [문제 해결](#6-문제-해결)

---

## 1. Google Vision API 개요

### 1.1 Google Vision API란?

Google Vision API는 이미지에서 텍스트를 추출하는 OCR(Optical Character Recognition) 서비스입니다.

**주요 특징:**
- 한글, 영어, 일본어, 중국어 등 다양한 언어 지원
- 높은 정확도의 텍스트 인식
- 이미지 분석, 라벨 감지 등 추가 기능 제공

### 1.2 Gemini API vs Google Vision API

| 항목 | Gemini API | Google Vision API |
|------|------------|-------------------|
| **용도** | 멀티모달 AI (텍스트, 이미지, 오디오) | 이미지 분석 전용 |
| **OCR 정확도** | 높음 | 매우 높음 (OCR 전문) |
| **한글 지원** | 지원 | 우수한 지원 |
| **비용** | 무료 티어 제공 | 무료 티어 제공 (월 1,000건) |
| **속도** | 보통 | 빠름 |
| **API 키** | 간단한 API 키 | API 키 또는 서비스 계정 |

---

## 2. API 키 발급 방법

### 2.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 2.2 프로젝트 생성 (또는 기존 프로젝트 선택)

1. 상단 메뉴에서 **프로젝트 선택** 클릭
2. **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: `readingtree-vision-api`)
4. **만들기** 클릭

### 2.3 Vision API 활성화

1. 왼쪽 메뉴에서 **API 및 서비스** → **라이브러리** 클릭
2. 검색창에 "Vision API" 입력
3. **Cloud Vision API** 선택
4. **사용 설정** 클릭

### 2.4 API 키 생성

#### 방법 1: API 키 방식 (간단, 개발/테스트용)

1. **API 및 서비스** → **사용자 인증 정보** 클릭
2. 상단 **+ 사용자 인증 정보 만들기** → **API 키** 선택
3. API 키가 생성되면 복사하여 안전하게 보관
4. **제한사항** 클릭하여 API 키 보안 설정:
   - **애플리케이션 제한사항**: HTTP 리퍼러(웹사이트) 선택
   - **API 제한사항**: Cloud Vision API만 선택
   - **웹사이트 제한사항**: 허용된 리퍼러 추가
     - `http://localhost:3000/*` (개발 환경)
     - `https://your-domain.vercel.app/*` (프로덕션 환경)

#### 방법 2: 서비스 계정 방식 (권장, 프로덕션용)

1. **API 및 서비스** → **사용자 인증 정보** 클릭
2. **+ 사용자 인증 정보 만들기** → **서비스 계정** 선택
3. 서비스 계정 이름 입력 (예: `vision-api-service`)
4. **역할**: **Cloud Vision API 사용자** 선택
5. **키 만들기** → **JSON** 선택
6. JSON 파일이 다운로드됨 (안전하게 보관)

**주의:** 서비스 계정 키는 절대 공개 저장소에 커밋하지 마세요!

---

## 3. 환경 변수 설정

### 3.1 로컬 개발 환경 (`.env.local`)

#### API 키 방식 사용 시:

```env
# Google Vision API
GOOGLE_VISION_API_KEY=your_api_key_here
```

#### 서비스 계정 방식 사용 시:

```env
# Google Vision API (서비스 계정)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
```

또는 JSON 내용을 환경 변수로 직접 설정:

```env
# Google Vision API (서비스 계정 JSON)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

### 3.2 Vercel 환경 변수 설정

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables** 클릭
3. 다음 변수 추가:

**API 키 방식:**
```
GOOGLE_VISION_API_KEY = your_api_key_here
```

**서비스 계정 방식:**
```
GOOGLE_SERVICE_ACCOUNT_JSON = {"type":"service_account",...}
```

### 3.3 GitHub Secrets 설정 (CI/CD용)

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 다음 Secrets 추가:

```
GOOGLE_VISION_API_KEY
또는
GOOGLE_SERVICE_ACCOUNT_JSON
```

---

## 4. 코드 변경 사항

### 4.1 패키지 설치

```bash
npm install @google-cloud/vision
```

### 4.2 코드 수정

기존 `lib/api/gemini.ts` 파일을 `lib/api/vision.ts`로 변경하거나 수정합니다.

**주요 변경점:**
- `@google/generative-ai` → `@google-cloud/vision`
- API 호출 방식 변경
- 응답 형식 변경

---

## 5. 비용 및 제한사항

### 5.1 무료 티어

- **월 1,000건 무료** (텍스트 감지)
- 초과 시 건당 $1.50 (1,000건 단위)

### 5.2 제한사항

- **이미지 크기**: 최대 20MB
- **요청 크기**: 최대 10MB
- **분당 요청 수**: 기본 1,800건

### 5.3 비용 최적화 팁

1. 이미지 크기 최적화 (업로드 시 압축)
2. 불필요한 OCR 요청 방지
3. 캐싱 활용 (같은 이미지 재처리 방지)

---

## 6. 문제 해결

### 6.1 API 키 오류

**오류 메시지:**
```
API key not valid. Please pass a valid API key.
```

**해결 방법:**
- API 키가 올바른지 확인
- Vision API가 활성화되어 있는지 확인
- API 키 제한사항 확인 (도메인, IP 등)

### 6.2 권한 오류

**오류 메시지:**
```
Permission denied. Please enable Cloud Vision API.
```

**해결 방법:**
- Google Cloud Console에서 Vision API 활성화 확인
- 서비스 계정 권한 확인

### 6.3 이미지 크기 오류

**오류 메시지:**
```
Image size exceeds maximum allowed size.
```

**해결 방법:**
- 이미지 크기를 20MB 이하로 압축
- 이미지 업로드 시 자동 압축 기능 활용

---

## 7. 참고 자료

- [Google Vision API 공식 문서](https://cloud.google.com/vision/docs)
- [Vision API 가격](https://cloud.google.com/vision/pricing)
- [Vision API Node.js 클라이언트](https://github.com/googleapis/nodejs-vision)

---

## 8. 마이그레이션 체크리스트

- [ ] Google Cloud Console에서 프로젝트 생성
- [ ] Vision API 활성화
- [ ] API 키 또는 서비스 계정 생성
- [ ] 환경 변수 설정 (로컬, Vercel, GitHub)
- [ ] `@google-cloud/vision` 패키지 설치
- [ ] 코드 수정 (`lib/api/gemini.ts` → `lib/api/vision.ts`)
- [ ] 테스트 (로컬 환경)
- [ ] 배포 및 검증

---

**이 가이드를 따라 설정하면 Google Vision API를 사용할 수 있습니다.**

