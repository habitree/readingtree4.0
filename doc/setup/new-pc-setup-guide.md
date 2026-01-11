# 새 PC 프로젝트 설치 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📋 설치 체크리스트

### 1단계: Node.js 설치 (필수)

**현재 상태:** ❌ 미설치

**설치 방법:**

1. **Node.js 다운로드**
   - [Node.js 공식 웹사이트](https://nodejs.org/ko/download/) 접속
   - **LTS 버전** (Long Term Support) 다운로드 권장
   - 최소 버전: **Node.js 18 이상**

2. **설치 프로그램 실행**
   - 다운로드한 `.msi` 파일 실행
   - 설치 중 **"Add to PATH"** 옵션 체크 확인 (기본적으로 체크됨)
   - 설치 완료

3. **설치 확인**
   - PowerShell 또는 CMD를 **새로 열기** (중요!)
   - 다음 명령어 실행:
   ```powershell
   node --version
   npm --version
   ```
   - 버전이 표시되면 설치 성공 ✅

**참고:** 
- 설치 후 반드시 터미널을 재시작해야 PATH가 적용됩니다
- Cursor도 재시작하는 것을 권장합니다

---

### 2단계: 프로젝트 의존성 설치

Node.js 설치가 완료되면 다음 명령어를 실행하세요:

```powershell
# 프로젝트 디렉토리로 이동 (이미 있는 경우 생략)
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0

# 의존성 설치
npm install
```

**예상 소요 시간:** 1-3분 (인터넷 속도에 따라 다름)

**설치되는 패키지:**
- Next.js 16.1.1
- React 19.2.3
- TypeScript 5.9.3
- Supabase 클라이언트
- 기타 프로젝트 의존성 (약 100개 이상)

---

### 3단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# ============================================
# Supabase 설정 (필수)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# Naver 검색 API (필수 - 책 검색 기능)
# ============================================
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# ============================================
# Google Vision API 또는 Gemini API (선택사항 - OCR)
# ============================================
# 방법 1: API 키 사용
GOOGLE_VISION_API_KEY=your_vision_api_key

# 방법 2: 서비스 계정 JSON 파일 경로 사용
# GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# 방법 3: 서비스 계정 JSON 문자열 사용
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Gemini API (선택사항)
GEMINI_API_KEY=your_gemini_api_key

# ============================================
# Kakao JavaScript SDK (선택사항 - 공유 기능)
# ============================================
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_javascript_key

# ============================================
# App URL
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**환경 변수 획득 방법:**

#### Supabase 설정
1. [Supabase 대시보드](https://app.supabase.com/) 접속
2. 프로젝트 선택 → **Settings** → **API**
3. 다음 값 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Naver 검색 API
1. [네이버 개발자 센터](https://developers.naver.com/) 로그인
2. **내 애플리케이션** → **애플리케이션 등록**
3. **검색 API** 선택
4. **Client ID**와 **Client Secret** 복사

#### Google Vision API (선택사항)
- 자세한 설정 방법: `doc/question/google-vision-api-setup-guide.md` 참조

#### Gemini API (선택사항)
1. [Google AI Studio](https://aistudio.google.com/) 접속
2. **Get API Key** 클릭
3. API 키 생성 및 복사

---

### 4단계: 개발 서버 실행

모든 설치가 완료되면 개발 서버를 실행하세요:

```powershell
npm run dev
```

**서버 접속:**
- 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

**서버 중지:**
- 터미널에서 `Ctrl + C` 누르기

---

## 🔧 문제 해결

### Node.js/npm 명령어를 찾을 수 없는 경우

**증상:**
```
'node'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```

**해결 방법:**

1. **터미널 재시작**
   - Cursor를 완전히 종료 후 재시작
   - PowerShell 또는 CMD를 새로 열기

2. **환경 변수 확인**
   - Windows 설정 → 시스템 → 정보 → 고급 시스템 설정
   - 환경 변수 클릭
   - 시스템 변수에서 "Path" 선택 → 편집
   - `C:\Program Files\nodejs\` 경로가 있는지 확인
   - 없으면 추가 후 터미널 재시작

3. **Node.js 재설치**
   - 기존 Node.js 제거
   - [Node.js 공식 웹사이트](https://nodejs.org/ko/download/)에서 최신 LTS 버전 다운로드
   - 설치 시 "Add to PATH" 옵션 확인
   - 설치 완료 후 터미널 재시작

### npm install 오류

**증상:**
```
npm ERR! code ENOTFOUND
npm ERR! errno ENOTFOUND
```

**해결 방법:**
1. 인터넷 연결 확인
2. 방화벽/프록시 설정 확인
3. npm 캐시 클리어:
   ```powershell
   npm cache clean --force
   npm install
   ```

### 포트 3000이 이미 사용 중

**증상:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결 방법:**
1. 다른 터미널에서 실행 중인 서버 종료
2. 또는 다른 포트 사용:
   ```powershell
   npm run dev -- -p 3001
   ```

### 환경 변수 오류

**증상:**
```
Error: Missing Supabase environment variables...
```

**해결 방법:**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
3. 값에 따옴표가 없는지 확인
4. 개발 서버를 재시작 (`Ctrl + C` 후 `npm run dev`)

---

## ✅ 설치 완료 확인

다음 명령어로 설치 상태를 확인하세요:

```powershell
# Node.js 버전 확인
node --version
# 예상 출력: v18.x.x 이상

# npm 버전 확인
npm --version
# 예상 출력: 9.x.x 이상

# 프로젝트 의존성 확인
npm list --depth=0
# 설치된 패키지 목록 확인

# 개발 서버 실행
npm run dev
# 서버가 정상적으로 시작되면 성공!
```

---

## 📚 참고 문서

- [로컬 개발 환경 설정 가이드](./local-development-setup.md)
- [환경 변수 체크리스트](../question/environment-variables-checklist.md)
- [프로젝트 README](../../README.md)

---

**이 가이드를 따라 설치를 완료하면 프로젝트를 실행할 수 있습니다!**
