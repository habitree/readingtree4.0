# 로컬 개발 환경 설정 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📋 목차

1. [필수 요구사항](#1-필수-요구사항)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [의존성 설치](#3-의존성-설치)
4. [개발 서버 실행](#4-개발-서버-실행)
5. [문제 해결](#5-문제-해결)

---

## 1. 필수 요구사항

### 1.1 시스템 요구사항

- **Node.js**: 18 이상 (현재 설치된 버전: v24.11.1 ✅)
- **npm**: Node.js와 함께 설치됨
- **Git**: 코드 저장소 클론용

### 1.2 외부 서비스 계정

다음 서비스의 API 키 또는 계정이 필요합니다:

- ✅ **Supabase**: 데이터베이스 및 인증
- ✅ **Naver 검색 API**: 책 검색 기능
- ⚠️ **Google Vision API 또는 Gemini API**: OCR 기능 (선택사항)
- ⚠️ **Kakao JavaScript SDK**: 공유 기능 (선택사항)

---

## 2. 환경 변수 설정

### 2.1 .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요.

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Windows (CMD)
type nul > .env.local

# Mac/Linux
touch .env.local
```

### 2.2 필수 환경 변수

`.env.local` 파일에 다음 내용을 추가하세요:

```env
# ============================================
# Supabase 설정 (필수)
# ============================================
# Supabase 프로젝트 대시보드에서 확인:
# Settings → API → Project URL, anon public key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 서비스 롤 키 (선택사항, 향후 확장용)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# Naver 검색 API (필수 - 책 검색 기능)
# ============================================
# 네이버 개발자 센터에서 발급:
# https://developers.naver.com/apps/#/register
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# ============================================
# Google Vision API (OCR 기능 - 선택사항)
# ============================================
# 방법 1: API 키 사용 (간단, 개발/테스트용)
GOOGLE_VISION_API_KEY=your_vision_api_key

# 방법 2: 서비스 계정 JSON 파일 경로 사용
# GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# 방법 3: 서비스 계정 JSON 문자열 사용
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# 참고: 위 세 가지 방법 중 하나만 설정하면 됩니다.

# ============================================
# Gemini API (OCR 기능 - 선택사항)
# ============================================
# Google AI Studio에서 발급:
# https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# 참고: Google Vision API 또는 Gemini API 중 하나만 설정해도 됩니다.

# ============================================
# Kakao JavaScript SDK (선택사항)
# ============================================
# 카카오 개발자 센터에서 발급:
# https://developers.kakao.com/
# 공유 기능을 사용하지 않는다면 선택사항입니다.
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_javascript_key

# ============================================
# App 설정
# ============================================
# 로컬 개발 환경 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.3 환경 변수별 상세 가이드

#### Supabase 설정

1. [Supabase](https://supabase.com/)에 로그인
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **Settings** → **API** 이동
4. 다음 값 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (선택사항)

#### Naver 검색 API

1. [네이버 개발자 센터](https://developers.naver.com/) 로그인
2. **내 애플리케이션** → **애플리케이션 등록**
3. **검색 API** 선택
4. **Client ID**와 **Client Secret** 복사

#### Google Vision API (선택사항)

자세한 설정 방법은 다음 문서를 참조하세요:
- `doc/question/google-vision-api-setup-guide.md`

#### Gemini API (선택사항)

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. **Get API Key** 클릭
3. API 키 생성 및 복사

#### Kakao JavaScript SDK (선택사항)

1. [카카오 개발자 센터](https://developers.kakao.com/) 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. **JavaScript 키** 복사

---

## 3. 의존성 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요:

```bash
npm install
```

이 명령어는 `package.json`에 정의된 모든 의존성을 설치합니다.

**예상 소요 시간:** 1-3분 (인터넷 속도에 따라 다름)

---

## 4. 개발 서버 실행

### 4.1 개발 서버 시작

```bash
npm run dev
```

### 4.2 서버 접속

브라우저에서 다음 URL을 열어주세요:

```
http://localhost:3000
```

### 4.3 서버 중지

터미널에서 `Ctrl + C`를 눌러 서버를 중지할 수 있습니다.

---

## 5. 문제 해결

### 5.1 환경 변수 오류

**증상:**
```
Error: Missing Supabase environment variables...
```

**해결 방법:**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
3. 값에 따옴표가 없는지 확인
4. 개발 서버를 재시작 (`Ctrl + C` 후 `npm run dev`)

### 5.2 포트 3000이 이미 사용 중

**증상:**
```
Error: Port 3000 is already in use
```

**해결 방법:**

방법 1: 다른 포트 사용
```bash
# Windows (PowerShell)
$env:PORT=3001; npm run dev

# Mac/Linux
PORT=3001 npm run dev
```

방법 2: 포트 3000을 사용하는 프로세스 종료
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### 5.3 의존성 설치 오류

**증상:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**해결 방법:**

```bash
# node_modules와 package-lock.json 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 5.4 TypeScript 오류

**증상:**
```
Type error: ...
```

**해결 방법:**

```bash
# 타입 체크 실행
npm run type-check
```

타입 오류가 있다면 수정하거나, 개발 중에는 무시하고 진행할 수 있습니다.

### 5.5 Supabase 연결 오류

**증상:**
```
Failed to fetch
Network error
```

**해결 방법:**
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 정확한지 확인
3. Supabase 대시보드에서 프로젝트 상태 확인

---

## 6. 추가 스크립트

### 6.1 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행 (빌드 후)
npm run start

# ESLint 실행
npm run lint

# TypeScript 타입 체크
npm run type-check

# Prettier 포맷팅
npm run format
```

---

## 7. 체크리스트

로컬 개발 환경 설정 완료 확인:

- [ ] Node.js 18+ 설치 확인
- [ ] `.env.local` 파일 생성
- [ ] Supabase 환경 변수 설정
- [ ] Naver API 환경 변수 설정
- [ ] (선택) Google Vision API 또는 Gemini API 설정
- [ ] (선택) Kakao JavaScript SDK 설정
- [ ] `npm install` 실행 완료
- [ ] `npm run dev` 실행 성공
- [ ] `http://localhost:3000` 접속 확인

---

## 8. 참고 문서

- [프로젝트 README](../README.md)
- [환경 변수 체크리스트](../question/environment-variables-checklist.md)
- [Google Vision API 설정 가이드](../question/google-vision-api-setup-guide.md)
- [프로젝트 설정 가이드](../tasks/front/01-task-project-setup-plan.md)

---

**이 가이드를 따라 설정하면 로컬에서 서비스를 확인할 수 있습니다!**

**문제가 발생하면 위의 "문제 해결" 섹션을 참조하거나, 팀에 문의하세요.**

