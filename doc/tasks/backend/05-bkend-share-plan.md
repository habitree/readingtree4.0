# TASK-05: 공유 백엔드

**작업 ID:** TASK-05  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

공유 관련 API Routes를 검증하고 개선합니다. 카드뉴스 이미지 생성 및 공유 페이지를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/api/share/card/route.tsx` 검증 및 개선
- ✅ `app/share/notes/[id]/page.tsx` 검증 및 개선
- ✅ `lib/templates/card-news-templates.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 공유 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 카드뉴스 생성 API Route 검증 및 개선

**파일:** `app/api/share/card/route.tsx`

**기능:**
- 카드뉴스 이미지 생성 (@vercel/og)
- 템플릿 선택
- Edge Runtime 최적화

**확인 사항:**
- @vercel/og 사용 확인
- Edge Runtime 설정 확인
- 템플릿 적용 확인
- 기록 조회 권한 확인

### 2. 공유 페이지 검증 및 개선

**파일:** `app/share/notes/[id]/page.tsx`

**기능:**
- 공유된 기록 조회
- Open Graph 메타 태그
- Twitter Card 메타 태그

**확인 사항:**
- 공개 기록만 조회 가능 확인
- 메타 태그 설정 확인
- `getAppUrl()` 사용 확인

### 3. 카드뉴스 템플릿 검증 및 개선

**파일:** `lib/templates/card-news-templates.ts`

**기능:**
- 카드뉴스 템플릿 정의

**확인 사항:**
- 템플릿 구조 확인
- 템플릿 ID 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/share/notes/[id]/page.tsx`
  - 공유된 기록 조회

### 연동 컴포넌트
- `components/share/card-news-generator.tsx`
  - 카드뉴스 생성
- `components/share/share-buttons.tsx`
  - 공유 버튼

---

## 개발 프롬프트

```
@doc/software_design.md (6.1.1 섹션) @doc/tasks/front/07-task-share-plan.md 참고하여 
공유 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/api/share/card/route.tsx 파일 검증 및 개선:
   - @vercel/og 사용 확인
   - Edge Runtime 설정 확인 (export const runtime = "edge")
   - 기록 조회 권한 확인 (공개 기록만)
   - 템플릿 적용 확인
   - React.createElement 사용 확인 (JSX 호환성)

2. app/share/notes/[id]/page.tsx 파일 검증 및 개선:
   - 공개 기록만 조회 가능 확인 (is_public = TRUE)
   - Open Graph 메타 태그 설정 확인
   - Twitter Card 메타 태그 설정 확인
   - getAppUrl() 사용 확인 (Vercel 호환성)

3. lib/templates/card-news-templates.ts 파일 검증 및 개선:
   - 템플릿 구조 확인
   - 템플릿 ID 확인

4. 프론트엔드 연동 확인:
   - 공유 페이지에서 기록 조회 확인
   - 카드뉴스 생성 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (6.1.1 섹션)
  - API 엔드포인트 설계
- `doc/tasks/front/07-task-share-plan.md`
  - 프론트엔드 공유 구현 상세

### 관련 프론트엔드 파일
- `app/share/notes/[id]/page.tsx`
- `components/share/card-news-generator.tsx`
- `components/share/share-buttons.tsx`

---

## 검증 체크리스트

### 공유 기능
- [ ] 카드뉴스 이미지 생성이 정상 작동하는지 확인
- [ ] 템플릿 선택이 정상 작동하는지 확인
- [ ] 공유 페이지에서 기록 조회가 정상 작동하는지 확인
- [ ] 공개 기록만 조회 가능 확인
- [ ] Open Graph 메타 태그 확인
- [ ] Twitter Card 메타 태그 확인

### 에러 처리
- [ ] 공유 에러 시 적절한 에러 메시지 표시
- [ ] 예외 상황 처리 확인

### 프론트엔드 연동
- [ ] 공유 페이지에서 기록 조회 확인
- [ ] 카드뉴스 생성 확인
- [ ] 에러 처리 및 로딩 상태 확인

---

**문서 끝**

