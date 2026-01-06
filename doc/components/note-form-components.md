# 기록 작성 폼 컴포넌트 가이드

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 1월  
**버전:** 1.0

---

## 목차

1. [개요](#1-개요)
2. [주요 기능](#2-주요-기능)
3. [사용 가이드](#3-사용-가이드)
4. [기술 스택](#4-기술-스택)

---

## 1. 개요

**`NoteFormNew`** (`components/notes/note-form-new.tsx`)는 기록 작성에 사용되는 폼 컴포넌트입니다.

### 현재 사용 현황

- ✅ **NoteFormNew**: `/notes/new` 페이지에서 사용 중

---

## 2. 주요 기능

### 2.1 기본 정보

**파일:** `components/notes/note-form-new.tsx`  
**사용 위치:** `app/(main)/notes/new/page.tsx`  
**Props:**
```typescript
interface NoteFormNewProps {
  bookId: string; // 필수: 책 ID
}
```

### 2.2 기능 상세

#### ✅ 통합 입력 방식
- **인상깊은 구절**과 **내 생각**을 동시에 입력 가능
- 별도의 타입 선택 없이 하나의 폼에서 모든 내용 입력

#### ✅ 제목 기능
- 기록에 제목을 추가할 수 있음 (선택 사항)
- 최대 100자
- 책 멘션 기능 지원 (`@` 입력)

#### ✅ 이미지 업로드
- **필사등록**: 필사 이미지 업로드 (OCR 자동 처리)
- **이미지등록**: 일반 사진 업로드
- 다중 이미지 업로드 지원
- **Stamp 기능**: 이미지에 스탬프 자동 추가 옵션

#### ✅ 페이지 번호
- 여러 페이지 번호를 한 번에 입력 가능 (줄바꿈으로 구분)
- 예시:
  ```
  42
  100
  150
  ```
- 각 페이지별로 별도의 기록 자동 생성

#### ✅ 책 멘션 기능
- `@` 입력 시 책을 링크할 수 있는 기능
- 제목, 인상깊은 구절, 내 생각 필드에서 모두 지원
- `BookMentionInput`, `BookMentionTextarea` 컴포넌트 사용

#### ✅ 태그 입력
- `TagInput` 컴포넌트 사용
- 최대 10개 태그
- 쉼표로 구분

#### ✅ 텍스트 미리보기
- `TextPreviewDialog` 컴포넌트로 긴 텍스트 전체 보기
- 인상깊은 구절, 내 생각 필드에 적용

#### ✅ 공개 설정
- 기본값: **공개** (`isPublic: true`)
- Switch로 공개/비공개 전환

### 2.3 폼 스키마

```typescript
const noteFormSchema = z.object({
  title: z.string().max(100).optional(),
  quoteContent: z.string().max(5000).optional(),
  memoContent: z.string().max(10000).optional(),
  uploadType: z.enum(["photo", "transcription"]).optional(),
  pageNumbers: z.string().optional(), // 여러 줄 입력 가능
  tags: z.string().optional(), // 최대 10개
  isPublic: z.boolean(),
});
```

### 2.4 데이터 저장 로직

#### 다중 기록 생성
- **이미지 + 페이지 번호 조합**: 각 이미지와 각 페이지 번호의 조합으로 기록 생성
- **이미지 없이 페이지 번호만**: 각 페이지 번호별로 기록 생성
- **이미지만**: 각 이미지별로 기록 생성

#### OCR 처리
- `transcription` 타입인 경우 자동으로 OCR 처리 요청
- `/api/ocr` 엔드포인트 호출
- 비동기 처리 (백그라운드에서 실행)

#### 검증 로직
- 최소 하나의 값 필수: 인상깊은 구절, 내 생각, 이미지 중 하나는 반드시 입력
- 빈 폼 제출 방지

### 2.5 주요 컴포넌트 의존성

- `BookMentionInput`: 제목 입력 (책 멘션 지원)
- `BookMentionTextarea`: 인상깊은 구절, 내 생각 입력 (책 멘션 지원)
- `TagInput`: 태그 입력
- `TextPreviewDialog`: 텍스트 미리보기
- `addStampToImage`: 이미지 스탬프 추가 유틸리티

### 2.6 사용 예시

```typescript
// app/(main)/notes/new/page.tsx
<NoteFormNew bookId={bookId} />
```

---

## 3. 사용 가이드

### 3.1 기본 사용법

```typescript
import { NoteFormNew } from "@/components/notes/note-form-new";

<NoteFormNew bookId={bookId} />
```

**필수 Props:**
- `bookId`: UUID 형식의 책 ID (필수)

### 3.2 입력 예시

**1. 텍스트만 입력:**
- 인상깊은 구절 또는 내 생각 중 하나 이상 입력
- 이미지 없이 저장 가능

**2. 이미지 + 텍스트:**
- 필사등록 또는 이미지등록 버튼 클릭
- 이미지 업로드
- 인상깊은 구절, 내 생각 추가 입력 가능

**3. 여러 페이지 등록:**
```
페이지 번호 입력란:
42
100
150
```
- 각 페이지별로 별도 기록 생성

**4. 책 멘션:**
- `@` 입력 시 책 목록 표시
- 선택한 책이 텍스트에 링크로 삽입

### 3.3 데이터 흐름

```
사용자 입력
  ↓
폼 검증 (Zod 스키마)
  ↓
이미지 업로드 (있는 경우)
  ↓
createNote() 호출
  ↓
다중 기록 생성 (이미지×페이지 조합)
  ↓
OCR 처리 요청 (transcription 타입인 경우)
  ↓
책 상세 페이지로 리다이렉트
```

### 3.4 에러 처리

- **빈 폼 제출**: "인상깊은 구절, 내 생각, 또는 업로드 중 최소 하나는 입력해주세요."
- **이미지 업로드 실패**: 개별 파일별로 에러 메시지 표시
- **OCR 요청 실패**: 경고 메시지 표시 (기록은 저장됨)
- **bookId 유효하지 않음**: 책 목록 페이지로 리다이렉트

### 3.5 성능 최적화

- **이미지 업로드**: 진행률 표시 (`uploadProgress`)
- **OCR 처리**: 비동기 처리 (사용자 대기 불필요)
- **다중 기록 생성**: 순차 처리 (Promise.all 사용 가능하나 현재는 순차)

---

## 4. 기술 스택

### 4.1 사용 라이브러리

- **react-hook-form**: 폼 상태 관리
- **zod**: 폼 검증
- **sonner**: 토스트 알림
- **next/image**: 이미지 최적화

### 4.2 주요 유틸리티

- `validateImageSize`: 이미지 크기 검증
- `validateImageType`: 이미지 타입 검증
- `getImageUrl`: 이미지 URL 변환
- `addStampToImage`: 이미지 스탬프 추가

---

## 5. 참고 사항

### 5.1 제한 사항

- **이미지 크기**: 최대 5MB
- **이미지 타입**: JPEG, JPG, PNG, WebP, HEIC
- **태그 개수**: 최대 10개
- **인상깊은 구절**: 최대 5000자
- **내 생각**: 최대 10000자
- **제목**: 최대 100자

### 5.2 향후 개선 사항

- [ ] 다중 기록 생성 시 Promise.all로 병렬 처리
- [ ] 이미지 압축 기능 추가
- [ ] 드래그 앤 드롭 이미지 업로드
- [ ] 이미지 편집 기능 (크롭, 필터 등)
- [ ] 자동 저장 (Draft 기능)

---

**이 문서는 기록 작성 폼 컴포넌트의 기능과 사용법을 정리한 가이드입니다.**

