# Git 및 GitHub 연결 설정 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**저장소:** https://github.com/habitree/readingtree4.0.git

---

## 현재 상태

✅ **Git 설치 확인:** Git 2.52.0.windows.1 설치됨  
✅ **원격 저장소 연결:** https://github.com/habitree/readingtree4.0.git 연결됨

---

## Git 사용자 정보 설정

Git 커밋에 사용할 이름과 이메일을 설정해야 합니다.

### 1. 사용자 이름 설정

```powershell
git config --global user.name "Your Name"
```

**예시:**
```powershell
git config --global user.name "홍길동"
```

### 2. 이메일 설정

```powershell
git config --global user.email "your.email@example.com"
```

**예시:**
```powershell
git config --global user.email "hong@example.com"
```

**참고:** GitHub에 등록된 이메일을 사용하는 것을 권장합니다.

### 3. 설정 확인

```powershell
git config --global user.name
git config --global user.email
```

---

## GitHub 인증 설정

### 방법 1: Personal Access Token (권장)

GitHub에서 Personal Access Token을 생성하여 사용합니다.

#### 1. GitHub에서 토큰 생성

1. [GitHub Settings](https://github.com/settings/tokens) 접속
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → **Generate new token (classic)** 클릭
4. 토큰 이름 입력 (예: "readingtree-dev")
5. 권한 선택:
   - ✅ `repo` (전체 저장소 접근)
   - ✅ `workflow` (GitHub Actions 사용 시)
6. **Generate token** 클릭
7. **토큰 복사** (한 번만 표시되므로 반드시 복사!)

#### 2. Git Credential 설정

**Windows Credential Manager 사용 (권장):**

```powershell
# GitHub 사용자 이름과 토큰으로 인증
git config --global credential.helper wincred
```

**토큰 사용 방법:**
- 사용자 이름: GitHub 사용자 이름
- 비밀번호: Personal Access Token

**또는 URL에 토큰 포함:**

```powershell
git remote set-url origin https://YOUR_TOKEN@github.com/habitree/readingtree4.0.git
```

### 방법 2: SSH 키 사용 (선택사항)

SSH 키를 사용하면 토큰 없이 인증할 수 있습니다.

#### 1. SSH 키 생성

```powershell
ssh-keygen -t ed25519 -C "your.email@example.com"
```

#### 2. 공개 키 복사

```powershell
cat ~/.ssh/id_ed25519.pub
```

#### 3. GitHub에 SSH 키 추가

1. [GitHub SSH Settings](https://github.com/settings/keys) 접속
2. **New SSH key** 클릭
3. 제목 입력 (예: "Windows PC")
4. 공개 키 붙여넣기
5. **Add SSH key** 클릭

#### 4. 원격 저장소를 SSH로 변경

```powershell
git remote set-url origin git@github.com:habitree/readingtree4.0.git
```

---

## 커밋 및 푸시 방법

### 1. 변경 사항 확인

```powershell
git status
```

### 2. 변경 사항 스테이징

**특정 파일만 추가:**
```powershell
git add 파일경로
```

**모든 변경 사항 추가:**
```powershell
git add .
```

### 3. 커밋

```powershell
git commit -m "커밋 메시지"
```

**예시:**
```powershell
git commit -m "기록 버튼 클릭 시 책 정보로 스크롤되도록 수정"
```

### 4. 푸시 (GitHub에 업로드)

```powershell
git push origin main
```

**또는 브랜치가 다른 경우:**
```powershell
git push origin 브랜치명
```

---

## 일반적인 Git 워크플로우

### 새 기능 개발 시

```powershell
# 1. 최신 코드 가져오기
git pull origin main

# 2. 새 브랜치 생성 (선택사항)
git checkout -b feature/새기능명

# 3. 코드 수정 후 스테이징
git add .

# 4. 커밋
git commit -m "기능 설명"

# 5. 푸시
git push origin feature/새기능명

# 6. GitHub에서 Pull Request 생성
```

### 변경 사항 업데이트

```powershell
# 1. 원격 저장소에서 최신 변경 사항 가져오기
git pull origin main

# 2. 충돌이 있으면 해결 후
git add .
git commit -m "충돌 해결"
git push origin main
```

---

## 문제 해결

### 문제 1: 인증 실패

**증상:**
```
remote: Support for password authentication was removed on August 13, 2021.
Please use a personal access token instead.
```

**해결 방법:**
- Personal Access Token 생성 및 사용 (위 "GitHub 인증 설정" 참조)

### 문제 2: 푸시 거부

**증상:**
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs
```

**해결 방법:**
```powershell
# 원격 저장소의 최신 변경 사항 가져오기
git pull origin main

# 충돌 해결 후 다시 푸시
git push origin main
```

### 문제 3: 커밋 메시지 편집기 열림

**증상:**
- `git commit` 실행 시 편집기가 열림

**해결 방법:**
- `-m "메시지"` 옵션 사용:
  ```powershell
  git commit -m "커밋 메시지"
  ```

### 문제 4: Git 사용자 정보가 설정되지 않음

**증상:**
```
*** Please tell me who you are.
```

**해결 방법:**
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 유용한 Git 명령어

### 상태 확인
```powershell
git status              # 현재 상태 확인
git log                 # 커밋 히스토리 확인
git log --oneline       # 간단한 커밋 히스토리
```

### 변경 사항 확인
```powershell
git diff                # 스테이징되지 않은 변경 사항
git diff --staged       # 스테이징된 변경 사항
```

### 브랜치 관리
```powershell
git branch              # 브랜치 목록
git branch 새브랜치명   # 새 브랜치 생성
git checkout 브랜치명   # 브랜치 전환
git checkout -b 새브랜치명  # 새 브랜치 생성 및 전환
```

### 원격 저장소 관리
```powershell
git remote -v           # 원격 저장소 확인
git remote set-url origin 새URL  # 원격 저장소 URL 변경
```

---

## 보안 주의사항

1. **Personal Access Token 보안**
   - 토큰을 절대 공개 저장소에 커밋하지 마세요
   - `.env.local` 파일처럼 `.gitignore`에 추가되어 있는지 확인
   - 토큰이 노출되면 즉시 GitHub에서 토큰 삭제

2. **SSH 키 보안**
   - 개인 키(`id_ed25519`)는 절대 공유하지 마세요
   - 공개 키(`id_ed25519.pub`)만 GitHub에 등록

3. **환경 변수 보안**
   - `.env.local` 파일은 절대 커밋하지 마세요
   - `.gitignore`에 포함되어 있는지 확인

---

## 체크리스트

Git 및 GitHub 설정 완료 확인:

- [ ] Git 설치 확인 (`git --version`)
- [ ] Git 사용자 이름 설정 (`git config --global user.name`)
- [ ] Git 이메일 설정 (`git config --global user.email`)
- [ ] GitHub Personal Access Token 생성
- [ ] 원격 저장소 연결 확인 (`git remote -v`)
- [ ] 테스트 커밋 및 푸시 성공

---

## 참고 자료

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub 문서](https://docs.github.com/)
- [Personal Access Token 생성](https://github.com/settings/tokens)
- [SSH 키 설정](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

**Git 및 GitHub 설정이 완료되면 코드를 커밋하고 푸시할 수 있습니다!**
