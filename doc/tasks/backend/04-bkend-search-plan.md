# TASK-04: 검색 백엔드

**작업 ID:** TASK-04  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

검색 API Route를 검증하고 개선합니다. 한글 검색 지원을 위한 ILIKE 패턴 매칭을 사용합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/api/search/route.ts` 검증 및 개선
- ✅ `lib/utils/search.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 검색 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 검색 API Route 검증 및 개선

**파일:** `app/api/search/route.ts`

**기능:**
- 전체 텍스트 검색 (ILIKE 패턴 매칭, 한글 지원)
- 책 제목 필터
- 날짜 필터
- 태그 필터
- 기록 유형 필터
- 페이지네이션

**확인 사항:**
- ILIKE 패턴 매칭이 올바른지 확인 (한글 지원)
- 필터 조합이 올바른지 확인
- 페이지네이션 로직 확인
- RLS 정책 준수 확인

### 2. 검색 유틸리티 검증 및 개선

**파일:** `lib/utils/search.ts`

**기능:**
- 검색어 하이라이트 유틸리티

**확인 사항:**
- 하이라이트 로직이 올바른지 확인
- XSS 방지 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/search/page.tsx`
  - `/api/search` 호출
  - 필터 적용

### 연동 컴포넌트
- `components/search/search-filters.tsx`
  - 필터 UI
- `components/search/search-results.tsx`
  - 검색 결과 표시

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.4 섹션) @doc/tasks/front/06-task-search-plan.md 
@doc/review_issues.md (Issue 6) 참고하여 검색 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/api/search/route.ts 파일 검증 및 개선:
   - ILIKE 패턴 매칭 확인 (한글 지원, review_issues.md Issue 6 참고)
   - 검색어 필터 확인
   - 책 제목 필터 확인
   - 날짜 필터 확인
   - 태그 필터 확인 (TEXT[] 배열 검색)
   - 기록 유형 필터 확인
   - 페이지네이션 확인
   - RLS 정책 준수 확인

2. lib/utils/search.ts 파일 검증 및 개선:
   - 검색어 하이라이트 로직 확인
   - XSS 방지 확인 (HTML 이스케이프)

3. 프론트엔드 연동 확인:
   - app/(main)/search/page.tsx에서 검색 API 호출 확인
   - 필터 적용 확인
   - 검색 결과 표시 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.4 섹션)
  - Notes 테이블 스키마
- `doc/tasks/front/06-task-search-plan.md`
  - 프론트엔드 검색 구현 상세
- `doc/review_issues.md` (Issue 6)
  - Full-text Search 한글 지원

### 관련 프론트엔드 파일
- `app/(main)/search/page.tsx`
- `components/search/search-filters.tsx`
- `components/search/search-results.tsx`

---

## 검증 체크리스트

### 검색 기능
- [ ] 전체 텍스트 검색이 정상 작동하는지 확인
- [ ] 한글 검색이 정상 작동하는지 확인
- [ ] 책 제목 필터가 정상 작동하는지 확인
- [ ] 날짜 필터가 정상 작동하는지 확인
- [ ] 태그 필터가 정상 작동하는지 확인
- [ ] 기록 유형 필터가 정상 작동하는지 확인
- [ ] 페이지네이션이 정상 작동하는지 확인
- [ ] 필터 조합이 정상 작동하는지 확인

### 에러 처리
- [ ] 검색 에러 시 적절한 에러 메시지 표시
- [ ] 예외 상황 처리 확인

### 프론트엔드 연동
- [ ] 검색 페이지에서 API 호출 확인
- [ ] 필터 적용 확인
- [ ] 검색 결과 표시 확인
- [ ] 에러 처리 및 로딩 상태 확인

---

**문서 끝**

