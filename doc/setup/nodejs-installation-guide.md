# Node.js 설치 가이드 (Windows)

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 현재 상태

❌ **Node.js가 설치되어 있지 않습니다.**

터미널에서 `npm` 명령어를 실행하면 다음 오류가 발생합니다:
```
'npm'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```

---

## 설치 방법

### 방법 1: 공식 웹사이트에서 설치 (권장)

1. **Node.js 다운로드**
   - 브라우저에서 [Node.js 공식 웹사이트](https://nodejs.org/ko/download/) 접속
   - **LTS 버전** (Long Term Support) 다운로드
     - 예: `node-v20.11.0-x64.msi` (Windows 64-bit)
   - 최소 버전: **Node.js 18 이상** (프로젝트 요구사항)

2. **설치 프로그램 실행**
   - 다운로드한 `.msi` 파일을 더블클릭하여 실행
   - 설치 마법사에서 **"Next"** 클릭
   - **중요:** 설치 옵션에서 **"Add to PATH"** 체크 확인 (기본적으로 체크됨)
   - 설치 완료까지 기다림

3. **설치 확인**
   - **Cursor를 완전히 종료** 후 재시작 (중요!)
   - 또는 **새 PowerShell/CMD 창** 열기
   - 다음 명령어 실행:
   ```powershell
   node --version
   npm --version
   ```
   - 버전이 표시되면 설치 성공 ✅

### 방법 2: Chocolatey 사용 (선택사항)

Chocolatey가 설치되어 있다면:

```powershell
choco install nodejs-lts
```

---

## 설치 후 확인

### 1. 터미널 재시작

**중요:** Node.js 설치 후 반드시 터미널을 재시작해야 합니다.

- Cursor를 완전히 종료 후 재시작
- 또는 새 터미널 창 열기

### 2. 버전 확인

```powershell
node --version
# 예상 출력: v20.11.0 (또는 그 이상)

npm --version
# 예상 출력: 10.2.4 (또는 그 이상)
```

### 3. 프로젝트 의존성 설치

Node.js 설치가 확인되면:

```powershell
# 프로젝트 디렉토리로 이동
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0

# 의존성 설치
npm install
```

---

## 문제 해결

### 문제 1: 설치 후에도 npm 명령어를 찾을 수 없음

**원인:** PATH 환경 변수에 Node.js 경로가 추가되지 않음

**해결 방법:**

1. **환경 변수 수동 추가**
   - Windows 설정 → 시스템 → 정보 → 고급 시스템 설정
   - 환경 변수 클릭
   - 시스템 변수에서 "Path" 선택 → 편집
   - 다음 경로 추가:
     ```
     C:\Program Files\nodejs\
     ```
   - 확인 클릭
   - **터미널 재시작** (중요!)

2. **Node.js 재설치**
   - 기존 Node.js 제거
   - [Node.js 공식 웹사이트](https://nodejs.org/ko/download/)에서 최신 LTS 버전 다운로드
   - 설치 시 "Add to PATH" 옵션 확인
   - 설치 완료 후 터미널 재시작

### 문제 2: 버전이 너무 낮음

**증상:**
```
node --version
v16.15.0  # 18 미만
```

**해결 방법:**
- [Node.js 공식 웹사이트](https://nodejs.org/ko/download/)에서 최신 LTS 버전 다운로드
- 기존 버전 제거 후 새 버전 설치

### 문제 3: 설치 프로그램이 실행되지 않음

**해결 방법:**
1. 관리자 권한으로 실행
2. 바이러스 백신 소프트웨어 일시 비활성화
3. 다른 브라우저에서 다운로드 시도

---

## 설치 완료 후 다음 단계

Node.js 설치가 완료되면:

1. ✅ 터미널 재시작
2. ✅ `node --version` 및 `npm --version` 확인
3. ✅ 프로젝트 디렉토리로 이동
4. ✅ `npm install` 실행
5. ✅ `npm run dev` 실행

---

## 참고 자료

- [Node.js 공식 웹사이트](https://nodejs.org/ko/)
- [Node.js 설치 가이드 (공식)](https://nodejs.org/ko/download/package-manager/)
- [프로젝트 설치 가이드](./new-pc-setup-guide.md)

---

**Node.js 설치가 완료되면 프로젝트 의존성 설치를 진행할 수 있습니다!**
