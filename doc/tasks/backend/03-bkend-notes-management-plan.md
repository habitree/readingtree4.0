# TASK-03: 기록 관리 백엔드

**작업 ID:** TASK-03  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-00, TASK-02  
**다음 작업:** TASK-04, TASK-05, TASK-06, TASK-07

---

## 작업 개요

기록 관리 관련 Server Actions와 API Routes를 검증하고 개선합니다. 이미지 업로드, OCR 처리, 기록 CRUD를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/notes.ts` 검증 및 개선
- ✅ `app/api/upload/route.ts` 검증 및 개선
- ✅ `app/api/ocr/route.ts` 검증 및 개선
- ✅ `app/api/ocr/process/route.ts` 검증 및 개선
- ✅ `lib/api/gemini.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 검색 기능 (TASK-04)
- ❌ 공유 기능 (TASK-05)
- ❌ 타임라인 (TASK-06)

---

## 상세 작업 목록

### 1. 기록 관리 Server Actions 검증 및 개선

**파일:** `app/actions/notes.ts`

**기능:**
- `createNote()`: 기록 생성
- `updateNote()`: 기록 수정
- `deleteNote()`: 기록 삭제 (이미지 파일 삭제 포함)
- `getNotes()`: 기록 목록 조회
- `getNoteDetail()`: 기록 상세 조회

**확인 사항:**
- 책 소유 확인 로직 확인
- 이미지 삭제 시 Storage에서도 삭제 확인
- RLS 정책 준수 확인

### 2. 이미지 업로드 API Route 검증 및 개선

**파일:** `app/api/upload/route.ts`

**기능:**
- 이미지 업로드 (Supabase Storage)
- 파일 크기 제한 (5MB)
- 자동 압축 (5MB 초과 시)
- 파일 형식 검증

**확인 사항:**
- 파일 크기 제한 확인
- 자동 압축 로직 확인
- 파일 형식 검증 확인
- Storage 업로드 경로 확인

### 3. OCR 처리 API Routes 검증 및 개선

**파일:** 
- `app/api/ocr/route.ts`: OCR 처리 요청
- `app/api/ocr/process/route.ts`: OCR 실제 처리

**기능:**
- OCR 처리 요청 (즉시 응답, 비동기 Queue)
- OCR 실제 처리 (Gemini API)
- 결과 저장

**확인 사항:**
- 비동기 처리 로직 확인
- Gemini API 호출 확인
- 결과 저장 확인

### 4. Gemini API 클라이언트 검증 및 개선

**파일:** `lib/api/gemini.ts`

**기능:**
- Gemini API 클라이언트
- OCR 텍스트 추출

**확인 사항:**
- API 키 환경 변수 사용 확인
- 이미지 다운로드 및 변환 확인
- OCR 프롬프트 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/notes/page.tsx`
  - `getNotes()` 호출
- `app/(main)/notes/new/page.tsx`
  - `createNote()` 호출
  - `/api/upload` 호출
  - `/api/ocr` 호출
- `app/(main)/notes/[id]/page.tsx`
  - `getNoteDetail()` 호출
- `app/(main)/notes/[id]/edit/page.tsx`
  - `updateNote()` 호출
- `app/(main)/books/[id]/page.tsx`
  - `getNotes(bookId)` 호출

### 연동 컴포넌트
- `components/notes/note-form.tsx`
  - `createNote()` 호출
  - 이미지 업로드
- `components/notes/note-edit-form.tsx`
  - `updateNote()` 호출

---

## 개발 프롬프트

```
@doc/software_design.md (6.2.2, 6.3 섹션) @doc/tasks/front/05-task-notes-crud-plan.md 
@doc/review_issues.md (Issue 4) 참고하여 기록 관리 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/notes.ts 파일 검증 및 개선:
   - createNote() 함수의 책 소유 확인 로직 확인
   - updateNote() 함수의 권한 확인 확인
   - deleteNote() 함수의 이미지 파일 삭제 로직 확인 (Storage에서도 삭제)
   - getNotes() 함수의 JOIN 쿼리 확인
   - getNoteDetail() 함수의 권한 확인

2. app/api/upload/route.ts 파일 검증 및 개선:
   - 파일 크기 제한 (5MB) 확인
   - 자동 압축 로직 확인 (sharp 사용)
   - 파일 형식 검증 확인
   - Storage 업로드 경로 확인 (${type}s/${userId}/${fileName})
   - 에러 처리 확인

3. app/api/ocr/route.ts 파일 검증 및 개선:
   - 비동기 처리 로직 확인 (즉시 응답, 백그라운드 처리)
   - 기록 소유 확인 확인
   - Queue 시스템 연동 확인 (현재는 fetch로 처리, 향후 Queue 시스템으로 변경 가능)

4. app/api/ocr/process/route.ts 파일 검증 및 개선:
   - Gemini API 호출 확인
   - OCR 결과 저장 확인
   - 에러 처리 및 재시도 로직 확인

5. lib/api/gemini.ts 파일 검증 및 개선:
   - 환경 변수 사용 확인 (GEMINI_API_KEY)
   - 이미지 다운로드 및 변환 확인
   - OCR 프롬프트 확인 (한글 지원)
   - 에러 처리 확인

6. 프론트엔드 연동 확인:
   - 기록 작성 페이지에서 createNote(), 이미지 업로드, OCR 호출 확인
   - 기록 목록 페이지에서 getNotes() 호출 확인
   - 기록 상세 페이지에서 getNoteDetail() 호출 확인
   - 기록 수정 페이지에서 updateNote() 호출 확인
   - 각 페이지에서 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (6.2.2, 6.3 섹션)
  - Gemini API 연동
  - 파일 업로드 처리
- `doc/tasks/front/05-task-notes-crud-plan.md`
  - 프론트엔드 기록 기능 구현 상세
- `doc/review_issues.md` (Issue 4)
  - OCR 처리 방법

### 관련 프론트엔드 파일
- `app/(main)/notes/page.tsx`
- `app/(main)/notes/new/page.tsx`
- `app/(main)/notes/[id]/page.tsx`
- `app/(main)/notes/[id]/edit/page.tsx`
- `components/notes/note-form.tsx`
- `components/notes/note-edit-form.tsx`

---

## 검증 체크리스트

### 기록 관리 기능
- [ ] 기록 생성이 정상 작동하는지 확인
- [ ] 기록 수정이 정상 작동하는지 확인
- [ ] 기록 삭제가 정상 작동하는지 확인 (이미지 파일도 삭제)
- [ ] 기록 목록 조회가 정상 작동하는지 확인
- [ ] 기록 상세 조회가 정상 작동하는지 확인
- [ ] 책 소유 확인 로직 확인

### 이미지 업로드
- [ ] 이미지 업로드가 정상 작동하는지 확인
- [ ] 파일 크기 제한 확인
- [ ] 자동 압축 확인
- [ ] 파일 형식 검증 확인

### OCR 처리
- [ ] OCR 요청이 정상 작동하는지 확인
- [ ] OCR 처리가 정상 작동하는지 확인
- [ ] OCR 결과 저장 확인
- [ ] 비동기 처리 확인

### 에러 처리
- [ ] 기록 생성/수정/삭제 에러 시 적절한 에러 메시지 표시
- [ ] 이미지 업로드 에러 시 적절한 에러 메시지 표시
- [ ] OCR 에러 시 적절한 에러 메시지 표시
- [ ] 예외 상황 처리 확인

### 프론트엔드 연동
- [ ] 기록 작성 페이지에서 Server Actions 및 API 호출 확인
- [ ] 기록 목록 페이지에서 Server Actions 호출 확인
- [ ] 기록 상세 페이지에서 Server Actions 호출 확인
- [ ] 에러 처리 및 로딩 상태 확인

---

## 다음 단계

기록 관리 백엔드 완료 후:
1. TASK-04 (검색 백엔드) 시작 가능
2. TASK-05 (공유 백엔드) 시작 가능
3. TASK-06 (타임라인 및 통계 백엔드) 시작 가능
4. TASK-07 (독서모임 백엔드) 시작 가능

---

**문서 끝**

