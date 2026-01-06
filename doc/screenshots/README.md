# 화면 캡처 관리 가이드

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 1월  
**버전:** 1.0

---

## 목차

1. [폴더 구조](#1-폴더-구조)
2. [캡처 체크리스트](#2-캡처-체크리스트)
3. [캡처 방법](#3-캡처-방법)
4. [파일 명명 규칙](#4-파일-명명-규칙)
5. [업데이트 관리](#5-업데이트-관리)

---

## 1. 폴더 구조

```
doc/screenshots/
├── README.md (이 파일)
├── 01-main/
│   ├── 01-home/
│   │   ├── desktop/
│   │   │   ├── home-desktop-v4.0.0.png
│   │   │   └── home-desktop-v4.0.1.png (업데이트 시)
│   │   └── mobile/
│   │       ├── home-mobile-v4.0.0.png
│   │       └── home-mobile-v4.0.1.png
│   └── README.md
│
├── 02-books/
│   ├── 01-book-list/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 02-book-detail/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 03-book-search/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 03-notes/
│   ├── 01-note-list/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 02-note-detail/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 03-note-create/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 04-note-edit/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 05-share-page/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 04-search/
│   ├── 01-search-main/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 05-timeline/
│   ├── 01-timeline-view/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 06-groups/
│   ├── 01-group-list/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 02-group-detail/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 03-group-create/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 07-profile/
│   ├── 01-profile-view/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 08-auth/
│   ├── 01-login/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 02-signup/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── 03-onboarding/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 09-admin/
│   ├── 01-admin-dashboard/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
├── 10-share/
│   ├── 01-share-note-page/
│   │   ├── desktop/
│   │   └── mobile/
│   └── README.md
│
└── 00-common/
    ├── 01-layout/
    │   ├── desktop-header.png
    │   ├── desktop-sidebar.png
    │   ├── mobile-header.png
    │   └── mobile-nav.png
    └── 02-components/
        ├── share-dialog.png
        ├── note-card.png
        └── book-card.png
```

---

## 2. 캡처 체크리스트

### 2.1 메인 메뉴별 필수 캡처 화면

#### ✅ 홈 (`/`)
- [ ] 데스크톱: 전체 화면
- [ ] 모바일: 전체 화면 (세로)
- [ ] 모바일: 전체 화면 (가로, 선택)

#### ✅ 내 서재 (`/books`)
- [ ] 서재 목록 (데스크톱)
- [ ] 서재 목록 (모바일)
- [ ] 책 상세 페이지 (데스크톱)
- [ ] 책 상세 페이지 (모바일)
- [ ] 책 검색 화면 (데스크톱)
- [ ] 책 검색 화면 (모바일)

#### ✅ 기록 (`/notes`)
- [ ] 기록 목록 (데스크톱)
- [ ] 기록 목록 (모바일)
- [ ] 기록 상세 (데스크톱)
- [ ] 기록 상세 (모바일)
- [ ] 기록 생성 (데스크톱)
- [ ] 기록 생성 (모바일)
- [ ] 기록 수정 (데스크톱)
- [ ] 기록 수정 (모바일)
- [ ] 공유 페이지 (데스크톱)
- [ ] 공유 페이지 (모바일)

#### ✅ 검색 (`/search`)
- [ ] 검색 메인 (데스크톱)
- [ ] 검색 메인 (모바일)
- [ ] 검색 결과 (데스크톱)
- [ ] 검색 결과 (모바일)

#### ✅ 타임라인 (`/timeline`)
- [ ] 타임라인 뷰 (데스크톱)
- [ ] 타임라인 뷰 (모바일)

#### ✅ 독서모임 (`/groups`)
- [ ] 모임 목록 (데스크톱)
- [ ] 모임 목록 (모바일)
- [ ] 모임 상세 (데스크톱)
- [ ] 모임 상세 (모바일)
- [ ] 모임 생성 (데스크톱)
- [ ] 모임 생성 (모바일)

#### ✅ 프로필 (`/profile`)
- [ ] 프로필 뷰 (데스크톱)
- [ ] 프로필 뷰 (모바일)

#### ✅ 인증 (`/login`, `/signup`, `/onboarding`)
- [ ] 로그인 (데스크톱)
- [ ] 로그인 (모바일)
- [ ] 회원가입 (데스크톱)
- [ ] 회원가입 (모바일)
- [ ] 온보딩 (데스크톱)
- [ ] 온보딩 (모바일)

#### ✅ 관리자 (`/admin`)
- [ ] 관리자 대시보드 (데스크톱)
- [ ] 관리자 대시보드 (모바일)

#### ✅ 공유 페이지 (`/share/notes/[id]`)
- [ ] 공유 페이지 (데스크톱)
- [ ] 공유 페이지 (모바일)

---

## 3. 캡처 방법

### 3.1 데스크톱 캡처

**권장 도구:**
- Windows: `Win + Shift + S` (스니핑 도구)
- Mac: `Cmd + Shift + 4` (영역 선택)
- 브라우저 확장: Full Page Screen Capture (Chrome)

**권장 해상도:**
- 데스크톱: 1920x1080 또는 1440x900
- 태블릿: 1024x768

**캡처 설정:**
- 전체 페이지 캡처 (스크롤 포함)
- 브라우저 개발자 도구에서 반응형 모드 사용 가능
- 다크 모드/라이트 모드 모두 캡처 (선택)

### 3.2 모바일 캡처

**권장 방법:**
1. 실제 모바일 기기에서 캡처
2. Chrome DevTools의 디바이스 모드 사용
3. 모바일 에뮬레이터 사용

**권장 해상도:**
- iPhone: 390x844 (iPhone 12/13/14)
- Android: 360x800 (일반적인 안드로이드)

**캡처 설정:**
- 세로 모드 우선
- 가로 모드는 선택적으로 캡처
- Safe Area 고려 (iPhone X 이상)

### 3.3 캡처 시 주의사항

- ✅ 개인정보 제거 (이름, 이메일 등)
- ✅ 샘플 데이터 사용 (실제 사용자 데이터 X)
- ✅ 일관된 브라우저/기기 사용
- ✅ 동일한 브라우저 확대/축소 비율 유지
- ✅ 스크롤 위치 통일 (최상단 우선)

---

## 4. 파일 명명 규칙

### 4.1 기본 형식

```
{화면명}-{플랫폼}-v{버전}.png
```

**예시:**
- `home-desktop-v4.0.0.png`
- `book-list-mobile-v4.0.0.png`
- `note-detail-desktop-v4.0.1.png`

### 4.2 화면명 규칙

| 화면 | 화면명 |
|------|--------|
| 홈 | `home` |
| 서재 목록 | `book-list` |
| 책 상세 | `book-detail` |
| 책 검색 | `book-search` |
| 기록 목록 | `note-list` |
| 기록 상세 | `note-detail` |
| 기록 생성 | `note-create` |
| 기록 수정 | `note-edit` |
| 공유 페이지 | `share-note-page` |
| 검색 | `search` |
| 타임라인 | `timeline` |
| 모임 목록 | `group-list` |
| 모임 상세 | `group-detail` |
| 모임 생성 | `group-create` |
| 프로필 | `profile` |
| 로그인 | `login` |
| 회원가입 | `signup` |
| 온보딩 | `onboarding` |
| 관리자 | `admin-dashboard` |

### 4.3 플랫폼 규칙

- `desktop`: 데스크톱/태블릿 가로
- `mobile`: 모바일/태블릿 세로

### 4.4 버전 규칙

- `v4.0.0`: 메이저.마이너.패치
- 업데이트 시 새 파일 생성 (기존 파일 유지)

---

## 5. 업데이트 관리

### 5.1 업데이트 시 절차

1. **변경 사항 확인**
   - 어떤 화면이 변경되었는지 확인
   - 버전 번호 확인

2. **기존 파일 백업**
   - 기존 파일은 그대로 유지
   - 새 버전 파일 생성

3. **새 캡처 생성**
   - 변경된 화면만 재캡처
   - 동일한 조건에서 캡처 (해상도, 브라우저 등)

4. **문서 업데이트**
   - 해당 폴더의 `README.md` 업데이트
   - 변경 사항 기록

### 5.2 버전별 폴더 구조 (선택)

대안으로 버전별 폴더 구조도 가능합니다:

```
doc/screenshots/
├── v4.0.0/
│   ├── 01-main/
│   └── ...
├── v4.0.1/
│   ├── 01-main/
│   └── ...
└── current/ (현재 버전 심볼릭 링크 또는 복사본)
```

### 5.3 변경 로그 작성

각 폴더의 `README.md`에 변경 사항을 기록:

```markdown
## 변경 로그

### v4.0.1 (2025-01-XX)
- 기록 상세 페이지 UI 개선
- 공유 다이얼로그 디자인 변경

### v4.0.0 (2025-01-XX)
- 초기 화면 캡처
```

---

## 6. 각 폴더별 README 템플릿

각 메뉴 폴더에 `README.md`를 생성하여 다음 내용을 기록:

```markdown
# {메뉴명} 화면 캡처

## 화면 목록

### 1. {화면명}
- **경로:** `/{경로}`
- **파일:** `{파일명}.png`
- **설명:** {화면 설명}

## 변경 로그

### v4.0.1 (날짜)
- {변경 사항}

### v4.0.0 (날짜)
- 초기 캡처
```

---

## 7. 빠른 시작 가이드

### Step 1: 폴더 생성
```bash
mkdir -p doc/screenshots/{01-main,02-books,03-notes,04-search,05-timeline,06-groups,07-profile,08-auth,09-admin,10-share,00-common}
```

### Step 2: 첫 캡처
1. 개발 서버 실행 (`npm run dev`)
2. 각 화면 접속
3. 캡처 도구로 스크린샷 저장
4. 파일명 규칙에 따라 저장

### Step 3: 문서화
- 각 폴더에 `README.md` 생성
- 화면 설명 및 변경 로그 기록

---

## 8. 참고 사항

### 8.1 Git 관리
- 이미지 파일은 `.gitignore`에 추가 고려 (용량)
- 또는 Git LFS 사용 고려

### 8.2 이미지 최적화
- PNG → WebP 변환 고려 (용량 절감)
- 이미지 압축 도구 사용 권장

### 8.3 자동화 (선택)
- Puppeteer/Playwright로 자동 캡처 스크립트 작성 가능
- CI/CD 파이프라인에 통합 가능

---

**이 가이드를 따라 화면 캡처를 체계적으로 관리하세요!**

