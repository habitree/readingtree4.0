# 환경 변수 및 설정 점검 결과

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📋 점검 결과 요약

### ✅ 완료된 항목
1. `.env.example` 파일 생성 완료
2. 필수 환경 변수 목록 정리 완료
3. GitHub Actions 워크플로우 환경 변수 확인 완료
4. Prettier 설정 파일 확인 완료

### ⚠️ 주의사항
1. 카카오 SDK 초기화 코드 누락 (선택사항)
2. `package.json`에 `type-check` 스크립트 누락 (CI에서 사용 중)

---

## 🔑 필수 환경 변수 목록

### Supabase 설정
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 현재 미사용, 향후 확장용
```

**사용 위치:**
- `lib/supabase/client.ts` - 클라이언트 사이드
- `lib/supabase/server.ts` - 서버 사이드
- `lib/supabase/middleware.ts` - 미들웨어

### Naver 검색 API
```env
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

**사용 위치:**
- `lib/api/naver.ts` - 책 검색 API
- `app/api/books/search/route.ts` - API Route

### Google Gemini API
```env
GEMINI_API_KEY=your_gemini_api_key
```

**사용 위치:**
- `lib/api/gemini.ts` - OCR 텍스트 추출
- `app/api/ocr/process/route.ts` - OCR 처리 API

### Kakao JavaScript SDK
```env
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_javascript_key
```

**사용 위치:**
- `components/share/share-buttons.tsx` - 카카오톡 공유 기능
- **주의:** 현재 카카오 SDK 초기화 코드가 없음 (아래 참고)

### 애플리케이션 설정
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 선택사항 (Vercel 자동 감지)
```

**사용 위치:**
- `app/actions/auth.ts` - OAuth 리다이렉트 URL
- `app/share/notes/[id]/page.tsx` - 공유 페이지 메타 태그

**주의사항:**
- Vercel에서는 `VERCEL_URL` 환경 변수를 자동으로 제공합니다
- `lib/utils/url.ts`의 `getAppUrl()` 함수가 다음 순서로 URL을 결정합니다:
  1. `VERCEL_URL` (Vercel 자동 제공) - 우선 사용
  2. `NEXT_PUBLIC_APP_URL` (수동 설정) - Vercel URL이 없을 때
  3. 기본값 (개발: `http://localhost:3000`, 프로덕션: `https://readingtree.vercel.app`)
- **Vercel 배포 시 별도 설정 불필요** - 자동으로 감지됩니다
- 프로덕션 도메인이 있다면 `NEXT_PUBLIC_APP_URL`에 설정하거나 `getAppUrl()` 함수의 기본값을 수정하세요

---

## 📝 설정 파일 점검

### 1. `.env.example` 파일
✅ **생성 완료** - 프로젝트 루트에 `.env.example` 파일이 생성되었습니다.

**사용 방법:**
```bash
# .env.example을 복사하여 .env.local 생성
cp .env.example .env.local

# 실제 값으로 채우기
# .env.local 파일을 열어서 각 환경 변수에 실제 값 입력
```

### 2. `next.config.js`
✅ **정상** - 이미지 도메인 설정이 올바르게 되어 있습니다.

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
    {
      protocol: 'https',
      hostname: 'bookthumb.phinf.pstatic.net',
    },
  ],
}
```

### 3. `package.json`
⚠️ **주의:** `type-check` 스크립트가 없지만 CI에서 사용 중입니다.

**현재 스크립트:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\""
  }
}
```

**CI에서 사용 중인 스크립트:**
- `.github/workflows/ci.yml`에서 `npm run type-check` 호출
- 현재는 `npx tsc --noEmit`로 대체되어 있음

**권장 사항:** `package.json`에 다음 스크립트 추가:
```json
"type-check": "tsc --noEmit"
```

### 4. `.prettierrc`
✅ **정상** - Prettier 설정 파일이 올바르게 구성되어 있습니다.

### 5. `.eslintrc.json`
✅ **정상** - ESLint 설정이 올바르게 구성되어 있습니다.

### 6. `tsconfig.json`
✅ **정상** - TypeScript 설정이 올바르게 구성되어 있습니다.

---

## ⚠️ 발견된 문제점

### 1. 카카오 SDK 초기화 코드 누락

**현재 상태:**
- `components/share/share-buttons.tsx`에서 `window.Kakao`를 사용하지만 초기화 코드가 없음
- 카카오 공유 기능이 작동하려면 SDK 초기화가 필요함

**해결 방법:**

#### 옵션 1: `app/layout.tsx`에 스크립트 추가 (권장)
```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          src="https://developers.kakao.com/sdk/js/kakao.js"
          async
          onLoad={() => {
            if (typeof window !== 'undefined' && (window as any).Kakao) {
              const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
              if (appKey) {
                (window as any).Kakao.init(appKey);
              }
            }
          }}
        />
      </head>
      <body className={inter.className}>
        {/* ... */}
      </body>
    </html>
  );
}
```

#### 옵션 2: 별도 유틸리티 파일 생성
```typescript
// lib/kakao.ts
export function initKakao() {
  if (typeof window === 'undefined') return;
  
  if (!(window as any).Kakao) {
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
      if (appKey && (window as any).Kakao) {
        (window as any).Kakao.init(appKey);
      }
    };
  } else if (!(window as any).Kakao.isInitialized()) {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (appKey) {
      (window as any).Kakao.init(appKey);
    }
  }
}
```

**참고:** 현재는 Supabase OAuth를 사용하므로 카카오 SDK는 공유 기능에만 필요합니다. 공유 기능을 사용하지 않는다면 선택사항입니다.

### 2. `SUPABASE_SERVICE_ROLE_KEY` 미사용

**현재 상태:**
- 문서에는 있지만 실제 코드에서 사용하지 않음
- 향후 확장을 위해 `.env.example`에 포함

**권장 사항:**
- 현재는 필요 없으므로 선택적으로 설정 가능
- 향후 서버 사이드에서 관리자 권한이 필요한 작업 시 사용 예정

---

## 🚀 배포 환경 설정

### Vercel 환경 변수 설정

Vercel Dashboard에서 다음 환경 변수를 설정해야 합니다:

1. **Settings** → **Environment Variables** 이동
2. 다음 변수들을 추가:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
GEMINI_API_KEY
NEXT_PUBLIC_KAKAO_APP_KEY
NEXT_PUBLIC_APP_URL
```

### GitHub Secrets 설정

GitHub Actions에서 사용하는 Secrets:

```
SUPABASE_URL (→ NEXT_PUBLIC_SUPABASE_URL로 매핑)
SUPABASE_ANON_KEY (→ NEXT_PUBLIC_SUPABASE_ANON_KEY로 매핑)
SUPABASE_SERVICE_ROLE_KEY
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
GEMINI_API_KEY
KAKAO_APP_KEY (→ NEXT_PUBLIC_KAKAO_APP_KEY로 매핑)
NEXT_PUBLIC_APP_URL
```

**참고:** GitHub Secrets 이름과 실제 환경 변수 이름이 다를 수 있습니다. 워크플로우 파일에서 매핑을 확인하세요.

---

## ✅ 체크리스트

프로젝트 설정 시 다음 항목을 확인하세요:

### 로컬 개발 환경
- [ ] `.env.local` 파일 생성
- [ ] 모든 필수 환경 변수 설정
- [ ] `npm install` 실행
- [ ] `npm run dev`로 개발 서버 실행 확인

### 프로덕션 환경 (Vercel)
- [ ] Vercel 프로젝트 생성
- [ ] 모든 환경 변수 설정
- [ ] 배포 확인

### GitHub Actions
- [ ] GitHub Secrets 설정
- [ ] CI/CD 워크플로우 테스트

### 기능별 확인
- [ ] Supabase 연결 확인
- [ ] Naver 검색 API 테스트
- [ ] Gemini OCR 기능 테스트
- [ ] 카카오 공유 기능 테스트 (선택사항)

---

## 📚 참고 문서

- [환경 변수 설정 가이드](./github-action.md)
- [카카오 앱 키 가이드](./kakao-app-key-guide.md)
- [프로젝트 설정 문서](../tasks/front/01-task-project-setup-plan.md)
- [소프트웨어 디자인 문서](../software_design.md)

---

**문서 끝**

