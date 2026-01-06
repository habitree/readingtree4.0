# Habitree Reading Hub - 메뉴 구조 및 기능 가이드

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 1월  
**버전:** 1.0

---

## 목차

1. [전체 메뉴 구조 개요](#1-전체-메뉴-구조-개요)
2. [메인 메뉴 상세](#2-메인-메뉴-상세)
3. [인증 관련 메뉴](#3-인증-관련-메뉴)
4. [공유 페이지](#4-공유-페이지)
5. [파일 구조 매핑](#5-파일-구조-매핑)
6. [접근 권한 요약](#6-접근-권한-요약)
7. [주요 기능별 User Story 매핑](#7-주요-기능별-user-story-매핑)

---

## 1. 전체 메뉴 구조 개요

### 1.1 데스크톱 사이드바 메뉴

```
홈 (/)
├── 랜딩 페이지
│
내 서재 (/books)
├── 서재 목록
├── 책 상세 (/books/[id])
└── 책 검색 (/books/search)
│
검색 (/search)
├── 통합 검색 (기록, 책, 문장)
│
타임라인 (/timeline)
├── 시간순 기록 조회
│
독서모임 (/groups)
├── 모임 목록
├── 모임 상세 (/groups/[id])
└── 모임 생성 (/groups/new)
│
기록 (/notes)
├── 기록 목록
├── 기록 상세 (/notes/[id])
├── 기록 생성 (/notes/new)
└── 기록 수정 (/notes/[id]/edit)
│
프로필 (/profile)
├── 프로필 정보
├── 프로필 수정
│
관리자 (/admin) [관리자 전용]
└── 관리자 대시보드
```

### 1.2 모바일 하단 네비게이션

```
홈 | 서재 | 타임라인 | 검색 | 프로필
```

**차이점:**
- 모바일: 주요 5개 메뉴만 표시 (독서모임, 관리자 제외)
- 데스크톱: 전체 메뉴 표시

---

## 2. 메인 메뉴 상세

### 2.1 홈 (`/`)

**경로:** `/`  
**파일:** `app/(main)/page.tsx`  
**컴포넌트:** `components/landing/landing-page.tsx`

**기능:**
- 서비스 소개 랜딩 페이지
- 비로그인 사용자 대상 서비스 가치 전달
- 로그인 유도 CTA

**주요 섹션:**
- Hero 섹션
- 문제 해결 섹션
- 솔루션 소개
- 기능 하이라이트
- 사용자 후기
- FAQ

**접근 권한:**
- 공개 (로그인 불필요)

---

### 2.2 내 서재 (`/books`)

**경로:** `/books`  
**파일:** `app/(main)/books/page.tsx`  
**액션:** `app/actions/books.ts`

#### 2.2.1 서재 목록

**기능:**
- 내가 읽고 있는 책 목록 조회
- 독서 상태별 필터링 (읽는 중, 완독, 일시정지, 미시작, 재독)
- 그리드/테이블 뷰 전환
- 서재 내 검색
- 통계 카드 (전체, 읽는 중, 완독 등)

**주요 컴포넌트:**
- `components/books/book-list.tsx` (그리드 뷰)
- `components/books/book-table.tsx` (테이블 뷰)
- `components/books/book-stats-cards.tsx` (통계)
- `components/books/book-search-input.tsx` (검색)
- `components/books/status-filter.tsx` (상태 필터)
- `components/books/view-mode-toggle.tsx` (뷰 전환)

**쿼리 파라미터:**
- `status`: 독서 상태 필터
- `view`: 그리드/테이블 뷰
- `q`: 검색어

**접근 권한:**
- 로그인 사용자: 개인 서재
- 게스트: 샘플 데이터 조회 가능

#### 2.2.2 책 상세 (`/books/[id]`)

**경로:** `/books/[id]`  
**파일:** `app/(main)/books/[id]/page.tsx`

**기능:**
- 책 상세 정보 조회
- 독서 상태 변경
- 책 정보 수정 (제목, 저자, 출판사 등)
- 책 삭제
- 해당 책의 기록 목록 표시
- 완독일 설정

**주요 컴포넌트:**
- `components/books/book-status-selector.tsx`
- `components/books/book-info-editor.tsx`
- `components/books/book-delete-button.tsx`
- `components/notes/notes-list.tsx`

**접근 권한:**
- 소유자만 접근 가능 (RLS)

#### 2.2.3 책 검색 (`/books/search`)

**경로:** `/books/search`  
**파일:** `app/(main)/books/search/page.tsx`  
**컴포넌트:** `components/books/book-search.tsx`

**기능:**
- 네이버 검색 API를 통한 책 검색
- 검색 결과에서 책 선택하여 서재에 추가
- ISBN 기반 중복 검사

**API:**
- `app/api/books/search/route.ts` (네이버 API 연동)
- `app/api/books/ensure/route.ts` (책 정보 저장)

**접근 권한:**
- 로그인 사용자만

---

### 2.3 기록 (`/notes`)

**경로:** `/notes`  
**파일:** `app/(main)/notes/page.tsx`  
**액션:** `app/actions/notes.ts`

#### 2.3.1 기록 목록

**기능:**
- 내가 작성한 모든 기록 조회
- 기록 타입별 필터링 (인상깊은 구절, 필사, 사진, 메모)
- 책별 필터링
- 카드 형태로 표시

**주요 컴포넌트:**
- `components/notes/note-list.tsx`

**쿼리 파라미터:**
- `type`: 기록 타입 필터
- `bookId`: 책별 필터

**접근 권한:**
- 로그인 사용자: 개인 기록
- 게스트: 샘플 데이터 조회 가능

#### 2.3.2 기록 상세 (`/notes/[id]`)

**경로:** `/notes/[id]`  
**파일:** `app/(main)/notes/[id]/page.tsx`

**기능:**
- 기록 상세 정보 조회
- 공개/비공개 상태 표시
- OCR 상태 확인 (필사/사진 타입)
- 공유 다이얼로그
- 기록 수정/삭제
- OCR 분석 결과 표시 (필사인 경우)

**주요 컴포넌트:**
- `components/share/share-note-card.tsx` (메인 카드)
- `components/share/simple-share-dialog.tsx` (공유 다이얼로그)
- `components/notes/ocr-status-checker.tsx` (OCR 상태)
- `components/notes/note-delete-button.tsx`

**접근 권한:**
- 소유자만 접근 가능 (RLS)

#### 2.3.3 기록 생성 (`/notes/new`)

**경로:** `/notes/new`  
**파일:** `app/(main)/notes/new/page.tsx`  
**컴포넌트:** `components/notes/note-form-new.tsx`

**기능:**
- 새 기록 작성
- 기록 타입 선택 (인상깊은 구절, 필사, 사진, 메모)
- 책 선택 (서재에서)
- 이미지 업로드 (필사/사진)
- OCR 자동 처리 (필사/사진)
- 페이지 번호 입력

**쿼리 파라미터:**
- `bookId`: 미리 선택된 책 ID

**API:**
- `app/api/upload/route.ts` (이미지 업로드)
- `app/api/ocr/process/route.ts` (OCR 처리)

**접근 권한:**
- 로그인 사용자만

#### 2.3.4 기록 수정 (`/notes/[id]/edit`)

**경로:** `/notes/[id]/edit`  
**파일:** `app/(main)/notes/[id]/edit/page.tsx`

**기능:**
- 기존 기록 수정
- 기록 타입 변경 불가
- 내용, 이미지, 페이지 번호 수정
- OCR 재실행 가능

**접근 권한:**
- 소유자만 접근 가능 (RLS)

---

### 2.4 검색 (`/search`)

**경로:** `/search`  
**파일:** `app/(main)/search/page.tsx`  
**액션:** `app/actions/search.ts`

**기능:**
- 통합 검색 (기록, 책, 문장)
- 실시간 검색 (디바운싱)
- 고급 필터:
  - 책별 필터
  - 날짜 범위 필터
  - 태그 필터
  - 기록 타입 필터
- 페이지네이션
- 검색 결과 하이라이트

**주요 컴포넌트:**
- `components/search/search-filters.tsx` (필터)
- `components/search/search-results.tsx` (결과)
- `components/search/pagination.tsx` (페이지네이션)

**쿼리 파라미터:**
- `q`: 검색어
- `bookId`: 책 필터
- `startDate`, `endDate`: 날짜 범위
- `tags`: 태그 필터
- `types`: 기록 타입 필터
- `page`: 페이지 번호

**접근 권한:**
- 로그인 사용자: 개인 기록 검색
- 게스트: 샘플 데이터 검색 가능

---

### 2.5 타임라인 (`/timeline`)

**경로:** `/timeline`  
**파일:** `app/(main)/timeline/page.tsx`  
**컴포넌트:** `components/timeline/timeline-content.tsx`

**기능:**
- 시간순으로 정리된 독서 기록 조회
- 날짜별 그룹핑
- 기록 타입별 아이콘 표시
- 무한 스크롤 (선택)

**접근 권한:**
- 로그인 사용자: 개인 타임라인
- 게스트: 샘플 타임라인 조회 가능

---

### 2.6 독서모임 (`/groups`)

**경로:** `/groups`  
**파일:** `app/(main)/groups/page.tsx`  
**액션:** `app/actions/groups.ts`

#### 2.6.1 모임 목록

**기능:**
- 참여 중인 독서모임 목록
- 공개 모임 목록
- 모임 생성 버튼

**주요 컴포넌트:**
- `components/groups/groups-content.tsx`

**접근 권한:**
- 로그인 사용자만

#### 2.6.2 모임 상세 (`/groups/[id]`)

**경로:** `/groups/[id]`  
**파일:** `app/(main)/groups/[id]/page.tsx`  
**컴포넌트:** `components/groups/group-dashboard.tsx`

**기능:**
- 모임 대시보드
- 모임 정보 (이름, 설명, 공개 여부)
- 모임 멤버 목록
- 모임 지정도서 목록
- 모임 공유 기록 목록
- 모임 활동 요약

**접근 권한:**
- 모임 리더: 전체 관리
- 모임 멤버: 조회 및 기록 공유
- 공개 모임: 비멤버도 조회 가능

#### 2.6.3 모임 생성 (`/groups/new`)

**경로:** `/groups/new`  
**파일:** `app/(main)/groups/new/page.tsx`

**기능:**
- 새 독서모임 생성
- 모임 이름, 설명 입력
- 공개/비공개 설정

**접근 권한:**
- 로그인 사용자만

---

### 2.7 프로필 (`/profile`)

**경로:** `/profile`  
**파일:** `app/(main)/profile/page.tsx`  
**컴포넌트:** `components/profile/profile-content.tsx`  
**액션:** `app/actions/profile.ts`

**기능:**
- 프로필 정보 조회
- 프로필 수정 (이름, 아바타, 소개)
- 통계 정보 (총 책 수, 기록 수 등)

**접근 권한:**
- 본인 프로필: 수정 가능
- 타인 프로필: 조회만 가능 (그룹 멤버인 경우)

---

### 2.8 관리자 (`/admin`)

**경로:** `/admin`  
**파일:** `app/(main)/admin/page.tsx`  
**컴포넌트:** `components/admin/admin-dashboard.tsx`  
**액션:** `app/actions/admin.ts`

**기능:**
- 전체 서비스 통계
- 사용자 성장 데이터
- 최근 시스템 활동
- 관리자 전용 기능

**접근 권한:**
- 관리자만 (이메일 기반 확인)

**관리자 확인:**
- `lib/constants.ts`의 `ADMIN_EMAIL`과 일치하는 이메일

---

## 3. 인증 관련 메뉴

### 3.1 로그인 (`/login`)

**경로:** `/login`  
**파일:** `app/(auth)/login/page.tsx`  
**컴포넌트:** `components/auth/login-form.tsx`

**기능:**
- 카카오 로그인
- 구글 로그인
- OAuth 콜백 처리

**액션:**
- `app/actions/auth.ts` (signInWithKakao, signInWithGoogle)

**접근 권한:**
- 공개 (로그인 불필요)

---

### 3.2 회원가입 (`/signup`)

**경로:** `/signup`  
**파일:** `app/(auth)/signup/page.tsx`

**기능:**
- 회원가입 (OAuth 기반, 별도 폼 없음)
- OAuth 로그인 시 자동 회원가입

**접근 권한:**
- 공개

---

### 3.3 온보딩 (`/onboarding`)

**경로:** `/onboarding`  
**파일:** `app/(auth)/onboarding/page.tsx`

**하위 페이지:**
- `/onboarding/consent` - 개인정보 동의
- `/onboarding/goal` - 목표 설정
- `/onboarding/tutorial` - 튜토리얼

**기능:**
- 신규 사용자 온보딩 플로우
- 개인정보 수집 동의
- 독서 목표 설정
- 서비스 사용법 안내

**접근 권한:**
- 로그인 사용자 (신규 사용자)

---

### 3.4 이메일 인증 (`/verify-email`)

**경로:** `/verify-email`  
**파일:** `app/(auth)/verify-email/page.tsx`

**기능:**
- 이메일 인증 확인
- 인증 링크 처리

**접근 권한:**
- 공개

---

### 3.5 OAuth 콜백 (`/callback`)

**경로:** `/callback`  
**파일:** `app/callback/route.ts`

**기능:**
- OAuth 인증 후 콜백 처리
- 세션 생성 및 쿠키 저장
- 리다이렉트

**접근 권한:**
- OAuth 제공자에서 리다이렉트

---

## 4. 공유 페이지

### 4.1 공유 기록 페이지 (`/share/notes/[id]`)

**경로:** `/share/notes/[id]`  
**파일:** `app/share/notes/[id]/page.tsx`  
**컴포넌트:** `components/share/share-note-card.tsx`

**기능:**
- 공개 기록 조회 (비로그인 사용자도 접근 가능)
- SNS 공유 최적화 (OG 태그)
- 공유 카드 디자인
- 하단 CTA (회원가입 유도)

**접근 권한:**
- 공개 (`is_public = true`인 기록만)
- 비로그인 사용자도 접근 가능

**차이점 (PC 기록 상세와 비교):**
- 레이아웃: 독립 레이아웃 (헤더/사이드바 없음)
- 액션 버튼: 없음 (조회만)
- 하단 CTA: "나도 기록 시작하기" 버튼
- 메타데이터: OG 태그 포함 (SNS 공유)

---

## 5. 파일 구조 매핑

### 5.1 페이지 파일 구조

```
app/
├── (main)/                    # 메인 레이아웃 그룹
│   ├── page.tsx              # 홈 (/)
│   ├── books/
│   │   ├── page.tsx          # 서재 목록 (/books)
│   │   ├── [id]/
│   │   │   └── page.tsx      # 책 상세 (/books/[id])
│   │   └── search/
│   │       └── page.tsx      # 책 검색 (/books/search)
│   ├── notes/
│   │   ├── page.tsx          # 기록 목록 (/notes)
│   │   ├── [id]/
│   │   │   ├── page.tsx      # 기록 상세 (/notes/[id])
│   │   │   └── edit/
│   │   │       └── page.tsx  # 기록 수정 (/notes/[id]/edit)
│   │   └── new/
│   │       └── page.tsx      # 기록 생성 (/notes/new)
│   ├── search/
│   │   └── page.tsx          # 검색 (/search)
│   ├── timeline/
│   │   └── page.tsx          # 타임라인 (/timeline)
│   ├── groups/
│   │   ├── page.tsx          # 모임 목록 (/groups)
│   │   ├── [id]/
│   │   │   └── page.tsx     # 모임 상세 (/groups/[id])
│   │   └── new/
│   │       └── page.tsx      # 모임 생성 (/groups/new)
│   ├── profile/
│   │   └── page.tsx          # 프로필 (/profile)
│   └── admin/
│       └── page.tsx          # 관리자 (/admin)
│
├── (auth)/                    # 인증 레이아웃 그룹
│   ├── login/
│   │   └── page.tsx          # 로그인 (/login)
│   ├── signup/
│   │   └── page.tsx          # 회원가입 (/signup)
│   ├── onboarding/
│   │   ├── page.tsx          # 온보딩 메인
│   │   ├── consent/
│   │   │   └── page.tsx     # 동의
│   │   ├── goal/
│   │   │   └── page.tsx     # 목표 설정
│   │   └── tutorial/
│   │       └── page.tsx     # 튜토리얼
│   └── verify-email/
│       └── page.tsx         # 이메일 인증
│
├── share/                     # 공유 페이지 (독립 레이아웃)
│   └── notes/
│       └── [id]/
│           └── page.tsx      # 공유 기록 (/share/notes/[id])
│
└── callback/
    └── route.ts              # OAuth 콜백 (/callback)
```

### 5.2 컴포넌트 구조

```
components/
├── books/                    # 서재 관련
│   ├── book-list.tsx
│   ├── book-table.tsx
│   ├── book-card.tsx
│   ├── book-search.tsx
│   └── ...
│
├── notes/                    # 기록 관련
│   ├── note-list.tsx
│   ├── note-form-new.tsx
│   ├── note-delete-button.tsx
│   └── ...
│
├── search/                   # 검색 관련
│   ├── search-filters.tsx
│   ├── search-results.tsx
│   └── ...
│
├── timeline/                 # 타임라인 관련
│   └── timeline-content.tsx
│
├── groups/                   # 독서모임 관련
│   ├── groups-content.tsx
│   ├── group-dashboard.tsx
│   └── ...
│
├── profile/                  # 프로필 관련
│   └── profile-content.tsx
│
├── admin/                    # 관리자 관련
│   └── admin-dashboard.tsx
│
├── share/                    # 공유 관련
│   ├── share-note-card.tsx
│   └── simple-share-dialog.tsx
│
└── auth/                     # 인증 관련
    └── login-form.tsx
```

### 5.3 Server Actions 구조

```
app/actions/
├── auth.ts                   # 인증 (로그인, 로그아웃, 사용자 조회)
├── books.ts                  # 서재 (책 조회, 추가, 수정, 삭제)
├── notes.ts                  # 기록 (조회, 생성, 수정, 삭제, OCR)
├── search.ts                 # 검색 (통합 검색)
├── groups.ts                 # 독서모임 (생성, 조회, 관리)
├── profile.ts                # 프로필 (조회, 수정)
├── admin.ts                  # 관리자 (통계, 활동)
└── share.ts                  # 공유 (공유 기록 조회)
```

### 5.4 API Routes 구조

```
app/api/
├── books/
│   ├── search/route.ts       # 네이버 책 검색 API
│   └── ensure/route.ts       # 책 정보 저장
│
├── notes/
│   └── route.ts              # 기록 API
│
├── ocr/
│   ├── route.ts              # OCR 상태 조회
│   └── process/route.ts      # OCR 처리
│
├── search/
│   └── route.ts              # 검색 API
│
├── upload/
│   └── route.ts              # 이미지 업로드
│
└── share/
    └── card/                  # 공유 카드 생성 (선택)
```

---

## 6. 접근 권한 요약

| 메뉴 | 로그인 필요 | 소유자 확인 | 공개 여부 |
|------|-----------|-----------|----------|
| 홈 | ❌ | - | ✅ |
| 서재 목록 | ⚠️ (게스트: 샘플) | ✅ | ❌ |
| 책 상세 | ✅ | ✅ | ❌ |
| 책 검색 | ✅ | - | ❌ |
| 기록 목록 | ⚠️ (게스트: 샘플) | ✅ | ❌ |
| 기록 상세 | ✅ | ✅ | ❌ |
| 기록 생성 | ✅ | - | ❌ |
| 기록 수정 | ✅ | ✅ | ❌ |
| 검색 | ⚠️ (게스트: 샘플) | ✅ | ❌ |
| 타임라인 | ⚠️ (게스트: 샘플) | ✅ | ❌ |
| 모임 목록 | ✅ | - | ❌ |
| 모임 상세 | ⚠️ (공개 모임: 조회 가능) | - | ⚠️ |
| 모임 생성 | ✅ | - | ❌ |
| 프로필 | ✅ | ⚠️ (본인: 수정) | ❌ |
| 관리자 | ✅ (관리자만) | - | ❌ |
| 공유 기록 | ❌ | - | ✅ (공개 기록만) |
| 로그인 | ❌ | - | ✅ |
| 회원가입 | ❌ | - | ✅ |

**범례:**
- ✅: 필요/가능
- ❌: 불필요/불가능
- ⚠️: 조건부

---

## 7. 주요 기능별 User Story 매핑

| User Story | 메뉴 | 경로 |
|-----------|------|------|
| US-005 | 프로필 관리 | `/profile` |
| US-006 | 책 검색 | `/books/search` |
| US-008 | 책 정보 조회 | `/books`, `/books/[id]` |
| US-009 | 독서 상태 관리 | `/books/[id]` |
| US-010~015 | 기록 작성 | `/notes/new` |
| US-016 | 기록 조회 | `/notes`, `/notes/[id]` |
| US-019~023 | 검색 기능 | `/search` |
| US-029, US-032 | 타임라인 | `/timeline` |
| US-033 | 모임 생성 | `/groups/new` |
| US-034 | 모임 참여 | `/groups` |
| US-036 | 모임 대시보드 | `/groups/[id]` |

---

**이 문서는 프로젝트의 메뉴 구조와 기능을 한눈에 파악할 수 있도록 정리한 가이드입니다.**

