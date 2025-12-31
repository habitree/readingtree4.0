# 데이터 모델 (Data Model)

**프로젝트:** Habitree Reading Hub v4.0.0  
**최종 업데이트:** 2025년 1월  
**버전:** 1.0

---

## 목차

1. [개요(Overview)](#1-개요overview)
2. [네이밍 규칙](#2-네이밍-규칙)
3. [ENUM 타입 정의](#3-enum-타입-정의)
4. [테이블 정의](#4-테이블-정의)
5. [관계 요약](#5-관계-요약)
6. [접근 제어 원칙](#6-접근-제어-원칙)
7. [변경 로그(Change Log)](#7-변경-로그change-log)

---

## 1. 개요(Overview)

### 1.1 프로젝트 데이터 모델의 전체 목적

Habitree Reading Hub는 사용자의 독서 활동을 관리하고 공유하는 플랫폼입니다.  
데이터 모델은 다음 주요 도메인 개념을 다룹니다:

- **사용자 관리**: 사용자 프로필 및 인증 정보
- **책 관리**: 책 정보 및 사용자별 독서 상태
- **기록 관리**: 사용자가 책에 남긴 다양한 형태의 기록
- **독서모임**: 그룹 기반 독서 활동 및 기록 공유

### 1.2 주요 도메인 개념

1. **Users (사용자)**: 인증된 사용자의 프로필 정보
2. **Books (책)**: 공개 책 정보 (ISBN, 제목, 저자 등)
3. **UserBooks (사용자-책 관계)**: 사용자가 읽는 책과 독서 상태
4. **Notes (기록)**: 사용자가 책에 남긴 인용구, 메모, 사진, 전사 등
5. **Groups (독서모임)**: 독서 그룹 정보
6. **GroupMembers (모임 멤버)**: 그룹 멤버십 및 역할
7. **GroupBooks (모임 책)**: 그룹에서 함께 읽는 책
8. **GroupNotes (모임 공유 기록)**: 그룹에 공유된 기록

---

## 2. 네이밍 규칙

### 2.1 테이블 네이밍 컨벤션

- **단수형 사용**: `users`, `books`, `notes` (복수형)
- **소문자 + 언더스코어**: `user_books`, `group_members`
- **관계 테이블**: `{주체}_{대상}` 형식 (예: `user_books`, `group_notes`)

### 2.2 컬럼 네이밍 컨벤션

- **소문자 + 언더스코어**: `user_id`, `created_at`
- **외래 키**: `{참조테이블명}_id` (예: `user_id`, `book_id`)
- **불리언**: `is_` 접두사 (예: `is_public`, `is_sample`)
- **타임스탬프**: `_at` 접미사 (예: `created_at`, `updated_at`)

### 2.3 인덱스 네이밍 컨벤션

- **형식**: `idx_{테이블명}_{컬럼명}` (예: `idx_users_email`)
- **복합 인덱스**: `idx_{테이블명}_{컬럼1}_{컬럼2}` (예: `idx_user_books_user_id_book_id`)
- **전문 검색 인덱스**: `idx_{테이블명}_{컬럼명}_fts` (예: `idx_books_title_fts`)

---

## 3. ENUM 타입 정의

### 3.1 reading_status (독서 상태)

```sql
CREATE TYPE reading_status AS ENUM ('reading', 'completed', 'paused', 'not_started', 'rereading');
```

- **reading**: 읽는 중
- **completed**: 완독
- **paused**: 일시 정지
- **not_started**: 읽기전 (아직 읽기 시작하지 않은 책)
- **rereading**: 재독 (다시 읽는 책)

**사용 테이블**: `user_books`

### 3.2 note_type (기록 유형)

```sql
CREATE TYPE note_type AS ENUM ('quote', 'photo', 'memo', 'transcription');
```

- **quote**: 인용구
- **photo**: 사진
- **memo**: 메모
- **transcription**: 전사 (OCR)

**사용 테이블**: `notes`

### 3.3 member_role (모임 멤버 역할)

```sql
CREATE TYPE member_role AS ENUM ('leader', 'member');
```

- **leader**: 리더
- **member**: 일반 멤버

**사용 테이블**: `group_members`

### 3.4 member_status (모임 멤버 상태)

```sql
CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');
```

- **pending**: 대기 중
- **approved**: 승인됨
- **rejected**: 거부됨

**사용 테이블**: `group_members`

---

## 4. 테이블 정의

### 4.1 users (사용자 프로필)

**목적**: 인증된 사용자의 프로필 정보를 저장합니다. `auth.users` 테이블과 1:1 관계입니다.

**소유 구조**: 개인 (각 사용자는 자신의 프로필만 소유)

**주요 컬럼**:
- `id` (UUID, PK): `auth.users(id)` 참조, CASCADE 삭제
- `email` (VARCHAR(255)): 이메일 주소
- `name` (VARCHAR(100), NOT NULL): 사용자 이름
- `avatar_url` (TEXT): 프로필 이미지 URL
- `reading_goal` (INTEGER, DEFAULT 12): 올해 읽을 책 목표 수
- `terms_agreed` (BOOLEAN, DEFAULT FALSE): 이용약관 동의 여부
- `privacy_agreed` (BOOLEAN, DEFAULT FALSE): 개인정보처리방침 동의 여부
- `consent_date` (TIMESTAMP WITH TIME ZONE): 약관 동의 일시
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `id` → `auth.users(id)` (ON DELETE CASCADE)
- `id` ← `user_books(user_id)`
- `id` ← `notes(user_id)`
- `id` ← `groups(leader_id)`
- `id` ← `group_members(user_id)`

**인덱스**:
- `idx_users_email`: 이메일 조회용

**RLS 정책 요약**:
- **SELECT**: 자신의 프로필만 조회 가능 (`auth.uid() = id`)
- **INSERT**: 자신의 프로필만 생성 가능 (`auth.uid() = id`)
- **UPDATE**: 자신의 프로필만 수정 가능 (`auth.uid() = id`)
- **DELETE**: 자신의 프로필만 삭제 가능 (`auth.uid() = id`)

**특수 기능**:
- `handle_new_user()` 트리거: `auth.users`에 새 사용자 생성 시 자동으로 프로필 생성

---

### 4.2 books (책)

**목적**: 공개 책 정보를 저장합니다. 여러 사용자가 같은 책을 추가할 수 있습니다.

**소유 구조**: 공개 (모든 사용자가 조회 가능, 소유 개념 없음)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `isbn` (VARCHAR(20)): ISBN 번호 (NULL 허용, UNIQUE 아님)
- `title` (VARCHAR(500), NOT NULL): 책 제목
- `author` (VARCHAR(200)): 저자
- `publisher` (VARCHAR(200)): 출판사
- `published_date` (DATE): 출판일
- `cover_image_url` (TEXT): 표지 이미지 URL
- `is_sample` (BOOLEAN, DEFAULT FALSE): 샘플 데이터 플래그 (게스트 사용자용)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `id` ← `user_books(book_id)` (ON DELETE CASCADE)
- `id` ← `notes(book_id)` (ON DELETE CASCADE)
- `id` ← `group_books(book_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_books_isbn`: ISBN 조회용 (NULL 제외)
- `idx_books_title`: 제목 조회용
- `idx_books_author`: 저자 조회용
- `idx_books_is_sample`: 샘플 데이터 조회용
- `idx_books_title_fts`: 제목 전문 검색용 (GIN)
- `idx_books_author_fts`: 저자 전문 검색용 (GIN)

**RLS 정책 요약**:
- **RLS 없음**: 모든 사용자가 조회 가능 (공개 데이터)

---

### 4.3 user_books (사용자-책 관계)

**목적**: 사용자가 읽는 책과 독서 상태를 관리합니다. 사용자와 책의 다대다 관계를 표현합니다.

**소유 구조**: 개인 (각 사용자는 자신의 독서 목록만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조)
- `status` (reading_status, DEFAULT 'reading'): 독서 상태
- `started_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 시작일
- `completed_at` (TIMESTAMP WITH TIME ZONE): 완독일
- `reading_reason` (TEXT): 사용자가 책을 읽는 이유 (선택 사항)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(user_id, book_id)` - 한 사용자는 같은 책을 한 번만 추가 가능

**관계 정의**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_user_books_user_id`: 사용자별 책 목록 조회용
- `idx_user_books_book_id`: 책별 사용자 목록 조회용
- `idx_user_books_status`: 상태별 필터링용

**RLS 정책 요약**:
- **SELECT**: 자신의 책 또는 샘플 책 조회 가능 (`auth.uid() = user_id OR book.is_sample = TRUE`)
- **INSERT**: 자신의 책만 추가 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 책만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 책만 삭제 가능 (`auth.uid() = user_id`)

---

### 4.4 notes (기록)

**목적**: 사용자가 책에 남긴 다양한 형태의 기록(인용구, 메모, 사진, 전사)을 저장합니다.

**소유 구조**: 개인/공개 (기본적으로 개인, `is_public = TRUE` 시 공개)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조)
- `type` (note_type, NOT NULL): 기록 유형
- `content` (TEXT): 기록 내용
- `image_url` (TEXT): 이미지 URL (사진/전사 타입용)
- `page_number` (INTEGER): 페이지 번호
- `is_public` (BOOLEAN, DEFAULT FALSE): 공개 여부
- `is_sample` (BOOLEAN, DEFAULT FALSE): 샘플 데이터 플래그 (게스트 사용자용)
- `tags` (TEXT[]): 태그 배열
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)
- `id` ← `group_notes(note_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_notes_user_id`: 사용자별 기록 조회용
- `idx_notes_book_id`: 책별 기록 조회용
- `idx_notes_type`: 타입별 필터링용
- `idx_notes_created_at`: 최신순 정렬용 (DESC)
- `idx_notes_page_number`: 페이지별 조회용
- `idx_notes_is_sample`: 샘플 데이터 조회용
- `idx_notes_content_fts`: 내용 전문 검색용 (GIN)
- `idx_notes_tags`: 태그 검색용 (GIN)

**RLS 정책 요약**:
- **SELECT**: 자신의 기록, 공개 기록, 샘플 기록 조회 가능 (`auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE`)
- **INSERT**: 자신의 기록만 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 기록만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 기록만 삭제 가능 (`auth.uid() = user_id`)

---

### 4.5 transcriptions (필사 OCR 데이터)

**목적**: 필사 등록 시 OCR로 변환된 텍스트 데이터를 별도로 관리합니다. 책 구절과 사용자의 생각을 체계적으로 저장하고 관리합니다.

**소유 구조**: 개인 (각 사용자는 자신의 필사 데이터만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `note_id` (UUID, NOT NULL): 기록 ID (`notes(id)` 참조, UNIQUE)
- `extracted_text` (TEXT, NOT NULL): OCR로 추출된 원본 텍스트
- `quote_content` (TEXT): 책 구절 (사용자가 편집 가능)
- `memo_content` (TEXT): 사용자의 생각 (사용자가 추가 가능)
- `status` (ocr_status, DEFAULT 'processing'): OCR 처리 상태
  - `processing`: 처리 중
  - `completed`: 완료
  - `failed`: 실패
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(note_id)` - 하나의 기록은 하나의 transcription만 가질 수 있음

**관계 정의**:
- `note_id` → `notes(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_transcriptions_note_id`: 기록별 transcription 조회용
- `idx_transcriptions_status`: 상태별 필터링용
- `idx_transcriptions_created_at`: 최신순 정렬용 (DESC)

**RLS 정책 요약**:
- **SELECT**: 자신의 기록에 대한 transcription만 조회 가능 (`notes.user_id = auth.uid()`)
- **INSERT**: 자신의 기록에 대한 transcription만 생성 가능 (`notes.user_id = auth.uid()`)
- **UPDATE**: 자신의 기록에 대한 transcription만 수정 가능 (`notes.user_id = auth.uid()`)
- **DELETE**: 자신의 기록에 대한 transcription만 삭제 가능 (`notes.user_id = auth.uid()`)

---

### 4.6 groups (독서모임)

**목적**: 독서 그룹 정보를 저장합니다. 리더가 그룹을 생성하고 관리합니다.

**소유 구조**: 그룹 (리더가 소유, 멤버는 참여)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `name` (VARCHAR(200), NOT NULL): 그룹 이름
- `description` (TEXT): 그룹 설명
- `leader_id` (UUID, NOT NULL): 리더 ID (`users(id)` 참조)
- `is_public` (BOOLEAN, DEFAULT FALSE): 공개 여부
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `leader_id` → `users(id)` (ON DELETE CASCADE)
- `id` ← `group_members(group_id)` (ON DELETE CASCADE)
- `id` ← `group_books(group_id)` (ON DELETE CASCADE)
- `id` ← `group_notes(group_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_groups_leader_id`: 리더별 그룹 조회용
- `idx_groups_is_public`: 공개 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 공개 그룹, 자신이 리더인 그룹, 자신이 멤버인 그룹 조회 가능
- **INSERT**: 인증된 사용자가 리더로 그룹 생성 가능 (`auth.uid() = leader_id`)
- **UPDATE**: 리더만 수정 가능 (`auth.uid() = leader_id`)
- **DELETE**: 리더만 삭제 가능 (`auth.uid() = leader_id`)

---

### 4.7 group_members (모임 멤버)

**목적**: 그룹 멤버십 정보를 저장합니다. 사용자의 그룹 가입 요청 및 승인 상태를 관리합니다.

**소유 구조**: 그룹 (그룹 리더가 멤버십 관리)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `role` (member_role, DEFAULT 'member'): 멤버 역할
- `status` (member_status, DEFAULT 'pending'): 멤버십 상태
- `joined_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 가입일
- **UNIQUE 제약**: `(group_id, user_id)` - 한 사용자는 같은 그룹에 한 번만 가입 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `user_id` → `users(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_members_group_id`: 그룹별 멤버 조회용
- `idx_group_members_user_id`: 사용자별 그룹 조회용
- `idx_group_members_status`: 상태별 필터링용

**RLS 정책 요약**:
- **SELECT**: 리더가 볼 수 있는 그룹의 멤버, 공개 그룹의 멤버, 자신의 멤버십 정보 조회 가능
- **INSERT**: 사용자가 자신의 가입 요청 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 리더만 멤버십 상태 변경 가능
- **DELETE**: 리더만 멤버 제거 가능

---

### 4.8 group_books (모임 책)

**목적**: 그룹에서 함께 읽는 책을 관리합니다.

**소유 구조**: 그룹 (그룹 리더가 책 추가)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조)
- `started_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 시작일
- `target_completed_at` (TIMESTAMP WITH TIME ZONE): 목표 완독일
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 생성일
- **UNIQUE 제약**: `(group_id, book_id)` - 한 그룹은 같은 책을 한 번만 추가 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_books_group_id`: 그룹별 책 조회용
- `idx_group_books_book_id`: 책별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더, 멤버, 또는 공개 그룹의 책 조회 가능
- **INSERT**: 리더만 책 추가 가능
- **UPDATE**: 리더만 책 정보 수정 가능
- **DELETE**: 리더만 책 제거 가능

---

### 4.8 group_shared_books (모임에 공유된 개인 서재)

**목적**: 모임 멤버들이 자신의 개인 서재를 모임에 공유합니다.

**소유 구조**: 개인 (사용자가 자신의 서재를 공유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `user_book_id` (UUID, NOT NULL): 사용자 서재 ID (`user_books(id)` 참조)
- `shared_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 공유일
- **UNIQUE 제약**: `(group_id, user_book_id)` - 한 모임에 같은 서재를 한 번만 공유 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `user_book_id` → `user_books(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_shared_books_group_id`: 그룹별 공유 서재 조회용
- `idx_group_shared_books_user_book_id`: 서재별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더, 멤버, 또는 공개 그룹의 공유 서재 조회 가능
- **INSERT**: 자신의 서재만 공유 가능, 모임 멤버만 공유 가능
- **DELETE**: 자신이 공유한 서재만 공유 해제 가능

---

### 4.8 group_notes (모임 내 공유 기록)

**목적**: 그룹에 공유된 기록을 관리합니다. 사용자가 자신의 기록을 그룹에 공유할 수 있습니다.

**소유 구조**: 그룹 (기록 소유자가 그룹에 공유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `note_id` (UUID, NOT NULL): 기록 ID (`notes(id)` 참조)
- `shared_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 공유일
- **UNIQUE 제약**: `(group_id, note_id)` - 한 기록은 같은 그룹에 한 번만 공유 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `note_id` → `notes(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_notes_group_id`: 그룹별 공유 기록 조회용
- `idx_group_notes_note_id`: 기록별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더가 볼 수 있는 그룹의 공유 기록, 공개 그룹의 공유 기록, 멤버가 볼 수 있는 그룹의 공유 기록 조회 가능
- **INSERT**: 기록 소유자만 그룹에 공유 가능 (`auth.uid() = note.user_id`)
- **DELETE**: 기록 소유자만 그룹에서 공유 해제 가능 (`auth.uid() = note.user_id`)

---

## 5. 관계 요약

### 5.1 주요 관계 다이어그램

```
auth.users (Supabase Auth)
    ↓ (1:1)
users (프로필)
    ↓ (1:N)
user_books ←→ books (N:M)
    ↓ (1:N)
notes ←→ books (N:M)
    ↓ (1:N)
group_notes ←→ groups (N:M)

groups (독서모임)
    ↓ (1:N)
group_members ←→ users (N:M)
    ↓ (1:N)
group_books ←→ books (N:M)
    ↓ (1:N)
group_shared_books ←→ user_books (N:M)
```

### 5.2 관계 설명

1. **users ↔ auth.users**: 1:1 관계, `users.id`가 `auth.users.id`를 참조
2. **users ↔ user_books**: 1:N 관계, 한 사용자는 여러 책을 읽을 수 있음
3. **books ↔ user_books**: 1:N 관계, 한 책은 여러 사용자가 읽을 수 있음
4. **users ↔ notes**: 1:N 관계, 한 사용자는 여러 기록을 작성할 수 있음
5. **books ↔ notes**: 1:N 관계, 한 책에는 여러 기록이 있을 수 있음
6. **users ↔ groups**: N:M 관계 (group_members를 통해), 한 사용자는 여러 그룹에 가입 가능
7. **groups ↔ books**: N:M 관계 (group_books를 통해), 한 그룹은 여러 책을 읽을 수 있음
8. **user_books ↔ groups**: N:M 관계 (group_shared_books를 통해), 한 사용자 서재는 여러 그룹에 공유 가능
9. **notes ↔ groups**: N:M 관계 (group_notes를 통해), 한 기록은 여러 그룹에 공유 가능

### 5.3 CASCADE 규칙

- **users 삭제 시**: `user_books`, `notes`, `groups` (리더인 경우), `group_members` CASCADE 삭제
- **books 삭제 시**: `user_books`, `notes`, `group_books` CASCADE 삭제
- **groups 삭제 시**: `group_members`, `group_books`, `group_notes`, `group_shared_books` CASCADE 삭제
- **user_books 삭제 시**: `group_shared_books` CASCADE 삭제
- **notes 삭제 시**: `group_notes` CASCADE 삭제

---

## 6. 접근 제어 원칙

### 6.1 RLS 정책의 의도

모든 사용자 데이터는 **Row Level Security (RLS)**로 보호됩니다.  
RLS 정책은 데이터베이스 레벨에서 접근 제어를 강제하므로, 애플리케이션 레벨에서의 추가 검증은 선택 사항입니다.

### 6.2 소유자 판단 기준

모든 소유자 판단은 **`auth.uid()`** 기준으로 합니다:

- `auth.uid()`: 현재 인증된 사용자의 ID (Supabase Auth에서 제공)
- `users.id`: `auth.users(id)`를 참조하므로 `auth.uid()`와 동일

**중요**: 모든 사용자 관련 외래 키는 `auth.users(id)`를 참조합니다.

### 6.3 개인 데이터 접근 규칙

**개인 소유 데이터** (`users`, `user_books`, `notes`):
- 자신의 데이터만 조회/수정/삭제 가능
- 예외: `notes`는 `is_public = TRUE` 시 모든 사용자가 조회 가능
- 예외: 샘플 데이터(`is_sample = TRUE`)는 게스트 사용자용으로 모든 사용자가 조회 가능

### 6.4 그룹 접근 규칙

**그룹 데이터** (`groups`, `group_members`, `group_books`, `group_notes`, `group_shared_books`):
- **공개 그룹** (`is_public = TRUE`): 모든 사용자가 조회 가능
- **비공개 그룹**: 리더 및 승인된 멤버만 조회 가능
- **리더 권한**: 그룹 생성, 수정, 삭제, 멤버 관리, 책 추가

### 6.5 공개 데이터 접근 규칙

**공개 데이터** (`books`):
- RLS 없음, 모든 사용자가 조회 가능
- 수정/삭제는 애플리케이션 레벨에서 관리 (일반적으로 불가)

### 6.6 샘플 데이터 접근 규칙

**샘플 데이터** (`books.is_sample`, `notes.is_sample`):
- 게스트 사용자(비인증 사용자)를 위한 샘플 데이터
- 모든 사용자가 조회 가능
- 수정/삭제 불가 (애플리케이션 레벨에서 차단)

---

## 7. 변경 로그(Change Log)

### 2025-01 (초기 스키마)

- **초기 스키마 생성**: 모든 테이블, ENUM 타입, 인덱스, RLS 정책 생성
- **주요 기능**:
  - 사용자 프로필 관리
  - 책 정보 관리
  - 독서 상태 관리
  - 기록 관리 (인용구, 메모, 사진, 전사)
  - 독서모임 기능
  - 샘플 데이터 지원 (게스트 사용자용)

### 2025-12-28 (RLS 정책 보완)

- **변경 내용**: 누락된 RLS 정책 추가
  - `users` 테이블에 DELETE 정책 추가
  - `group_members` 테이블에 DELETE 정책 추가
  - `group_books` 테이블에 UPDATE/DELETE 정책 추가
  - `group_notes` 테이블에 DELETE 정책 추가
- **영향받는 테이블**:
  - `users`
  - `group_members`
  - `group_books`
  - `group_notes`
- **마이그레이션 파일**: `migration-202512282221__rls__add_missing_policies.sql`
- **목적**: DB/RLS 규칙 완전 준수 (모든 테이블에 SELECT/INSERT/UPDATE/DELETE 정책 완비)

### 2025-12-31 (지정도서 및 공유 서재 기능 추가)

- **변경 내용**: 독서모임의 지정도서 및 공유 서재 기능 추가
  - `group_books` 테이블 SELECT 정책 수정: 멤버도 지정도서 조회 가능
  - `group_shared_books` 테이블 생성: 개인 서재를 모임에 공유하는 기능
    - `id`, `group_id`, `user_book_id`, `shared_at` 컬럼
    - UNIQUE 제약: `(group_id, user_book_id)`
  - RLS 정책 설정:
    - SELECT: 리더, 멤버, 또는 공개 그룹의 공유 서재 조회 가능
    - INSERT: 자신의 서재만 공유 가능, 모임 멤버만 공유 가능
    - DELETE: 자신이 공유한 서재만 공유 해제 가능
- **영향받는 테이블**:
  - `group_books` (RLS 정책 수정)
  - `group_shared_books` (신규)
- **마이그레이션 파일**:
  - `migration-202512311633__group_shared_books__create_table.sql`
  - `migration-202512311634__group_books__allow_member_view.sql`
- **목적**: 독서모임에서 지정도서와 개인 서재 공유 기능 통합 제공

### 2025-12-28 (약관 동의 기능 추가)

- **변경 내용**: 약관 동의 기능 추가
  - `users` 테이블에 약관 동의 관련 필드 추가
    - `terms_agreed`: 이용약관 동의 여부
    - `privacy_agreed`: 개인정보처리방침 동의 여부
    - `consent_date`: 약관 동의 일시
  - 약관 동의 페이지 생성 (`/onboarding/consent`)
  - 콜백 로직에 약관 동의 체크 추가
- **영향받는 테이블**:
  - `users`
- **마이그레이션 파일**: `migration-202512282233__users__add_consent_fields.sql`
- **목적**: 로그인 후 약관 동의 페이지를 통한 명시적 동의 수집

### 향후 변경 사항

변경 사항은 이 섹션에 기록됩니다:
- 날짜
- 변경 내용
- 영향받는 테이블
- 마이그레이션 파일명

---

**이 문서는 프로젝트의 데이터 모델 단일 기준 문서입니다. 모든 스키마 변경은 이 문서에 반영되어야 합니다.**

