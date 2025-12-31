# GitHub Actions 워크플로우 가이드

이 폴더에는 Habitree Reading Hub 프로젝트의 자동화된 CI/CD 워크플로우가 포함되어 있습니다.

## 워크플로우 목록

### 1. CI (`ci.yml`)
**트리거:** `main`, `develop` 브랜치에 push 또는 PR 생성 시

**기능:**
- 코드 체크아웃
- Node.js 환경 설정
- 의존성 설치
- ESLint 실행
- TypeScript 타입 체크
- 빌드 테스트

### 2. Code Quality (`code-quality.yml`)
**트리거:** `main`, `develop` 브랜치에 push 또는 PR 생성 시

**기능:**
- ESLint 검사
- Prettier 포맷팅 검사
- TypeScript 타입 체크
- 빌드 검증

### 3. Deploy Preview (`deploy-preview.yml`)
**트리거:** `main`, `develop` 브랜치로의 Pull Request 생성 시

**기능:**
- Preview 환경 빌드
- Vercel Preview 배포
- PR에 배포 링크 자동 추가

### 4. Deploy Production (`deploy-production.yml`)
**트리거:** `main` 브랜치에 push 시 또는 수동 실행

**기능:**
- 프로덕션 빌드
- Vercel Production 배포
- 모든 환경 변수 포함

## 필수 Secrets 설정

GitHub 저장소의 **Settings → Secrets and variables → Actions**에서 다음 Secrets를 설정해야 합니다:

### 필수 Secrets

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NAVER_CLIENT_ID` | 네이버 API Client ID | `your_naver_client_id` |
| `NAVER_CLIENT_SECRET` | 네이버 API Client Secret | `your_naver_client_secret` |
| `GOOGLE_VISION_API_KEY` | Google Vision API Key | `your_vision_api_key` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Service Account JSON (선택) | `{"type":"service_account",...}` |
| `KAKAO_APP_KEY` | 카카오 앱 키 | `your_kakao_app_key` |
| `NEXT_PUBLIC_APP_URL` | 앱 URL (프로덕션) | `https://readingtree2-0.vercel.app` |

### Vercel 배포용 Secrets

| Secret 이름 | 설명 | 얻는 방법 |
|------------|------|----------|
| `VERCEL_TOKEN` | Vercel 배포 토큰 | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel 조직/팀 ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | Vercel Dashboard → 프로젝트 Settings → General |

## Vercel 토큰 및 ID 얻기

### 1. Vercel 토큰 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **Settings** → **Tokens** 이동
3. **Create Token** 클릭
4. 토큰 이름 입력 (예: `github-actions`)
5. **Create** 클릭
6. 생성된 토큰을 복사하여 GitHub Secrets에 추가

### 2. Vercel Org ID 및 Project ID 얻기

**방법 1: Vercel Dashboard에서**
1. Vercel 프로젝트 페이지 접속
2. **Settings** → **General** 이동
3. **Project ID** 확인
4. 팀/조직 이름 옆의 ID 확인 (Org ID)

**방법 2: Vercel CLI 사용**
```bash
npm i -g vercel
vercel login
vercel link
# .vercel/project.json 파일에서 확인 가능
```

## 워크플로우 실행 확인

1. GitHub 저장소의 **Actions** 탭 이동
2. 왼쪽 사이드바에서 워크플로우 선택
3. 실행 이력 확인
4. 각 단계의 로그 확인

## 문제 해결

### 빌드 실패 시

1. **로컬에서 빌드 테스트**
   ```bash
   npm run build
   ```

2. **환경 변수 확인**
   - 모든 필수 환경 변수가 Secrets에 설정되었는지 확인
   - 변수 이름이 정확한지 확인 (대소문자 구분)

3. **의존성 문제**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 배포 실패 시

1. **Vercel 토큰 확인**
   - 토큰이 만료되지 않았는지 확인
   - 올바른 권한이 있는지 확인

2. **Vercel 프로젝트 확인**
   - 프로젝트가 Vercel에 존재하는지 확인
   - Org ID와 Project ID가 올바른지 확인

3. **Vercel 대시보드 확인**
   - Vercel Dashboard에서 배포 로그 확인
   - 환경 변수가 Vercel에도 설정되어 있는지 확인

## 워크플로우 수정

워크플로우 파일을 수정한 후:

1. 변경사항 커밋
   ```bash
   git add .github/workflows/
   git commit -m "chore: update workflow"
   git push
   ```

2. GitHub Actions에서 자동으로 새 워크플로우 실행

## 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel Action 문서](https://github.com/amondnet/vercel-action)
- [프로젝트 GitHub Actions 가이드](../../doc/question/github-action.md)

