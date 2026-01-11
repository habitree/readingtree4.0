# 로컬 개발 서버 실행 가이드

**작성일:** 2026년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 로컬 개발 서버 실행 방법

### 1. 터미널에서 직접 실행 (권장)

PowerShell 또는 명령 프롬프트에서 다음 명령어를 실행하세요:

```powershell
npm run dev
```

### 2. 서버 시작 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in X.XXs
```

### 3. 브라우저에서 접속

서버가 시작되면 브라우저에서 다음 URL로 접속하세요:

- **로컬 서버:** http://localhost:3000
- **기록 상세 페이지:** http://localhost:3000/notes/{note-id}

---

## 문제 해결

### Turbopack 오류 발생 시

**증상:**
```
FATAL: An unexpected Turbopack error occurred.
Error [TurbopackInternalError]: failed to create whole tree
```

**해결 방법:**

1. **Turbopack 비활성화 (이미 적용됨)**
   - `package.json`의 `dev` 스크립트에 `--turbo=false` 옵션이 추가되어 있습니다.
   - 일반 webpack 모드로 실행됩니다.

2. **.next 폴더 삭제 후 재시작**
   ```powershell
   Remove-Item -Path .next -Recurse -Force
   npm run dev
   ```

3. **node_modules 재설치 (필요한 경우)**
   ```powershell
   Remove-Item -Path node_modules -Recurse -Force
   npm install
   npm run dev
   ```

### 포트 3000이 이미 사용 중인 경우

다른 포트로 실행:

```powershell
$env:PORT=3001; npm run dev
```

또는:

```powershell
npx next dev -p 3001
```

---

## 카드 복사 기능 테스트

로컬 서버가 실행되면:

1. 브라우저에서 http://localhost:3000 접속
2. 로그인 (필요한 경우)
3. 기록 상세 페이지로 이동: `/notes/{note-id}`
4. "공유" 버튼 클릭
5. "카드 복사" 버튼 클릭하여 테스트

---

## 참고 사항

- 로컬 서버는 코드 변경 시 자동으로 새로고침됩니다 (Hot Reload)
- 개발 서버는 프로덕션 빌드와 다를 수 있습니다
- 환경 변수는 `.env.local` 파일에 설정하세요
