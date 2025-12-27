# TASK-07: 독서모임 백엔드

**작업 ID:** TASK-07  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

독서모임 관련 Server Actions를 검증하고 개선합니다. 모임 생성, 참여, 멤버 관리, 기록 공유를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/groups.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 모임 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 모임 관리 Server Actions 검증 및 개선

**파일:** `app/actions/groups.ts`

**기능:**
- `createGroup()`: 모임 생성
- `joinGroup()`: 모임 참여 신청 (공개/비공개 모임 처리)
- `approveMember()`: 모임 참여 승인 (리더 권한)
- `rejectMember()`: 모임 참여 거부 (리더 권한)
- `getGroups()`: 모임 목록 조회
- `getPublicGroups()`: 공개 모임 목록 조회
- `getGroupDetail()`: 모임 상세 조회
- `getMemberProgress()`: 구성원 진행 상황 조회
- `shareNoteToGroup()`: 모임 내 기록 공유

**확인 사항:**
- 리더 권한 확인 로직 확인
- 공개/비공개 모임 처리 확인
- RLS 정책 준수 확인
- JOIN 쿼리 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/groups/page.tsx`
  - `getGroups()`, `getPublicGroups()` 호출
- `app/(main)/groups/new/page.tsx`
  - `createGroup()` 호출
- `app/(main)/groups/[id]/page.tsx`
  - `getGroupDetail()` 호출
  - `joinGroup()` 호출
  - `approveMember()`, `rejectMember()` 호출
  - `shareNoteToGroup()` 호출

### 연동 컴포넌트
- `components/groups/group-dashboard.tsx`
  - 모임 대시보드
- `components/groups/member-list.tsx`
  - 멤버 관리
- `components/groups/shared-notes-list.tsx`
  - 공유 기록 목록

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.5-4.2.8 섹션) @doc/tasks/front/09-task-groups-plan.md 참고하여 
독서모임 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/groups.ts 파일 검증 및 개선:
   - createGroup() 함수의 리더 자동 추가 확인
   - joinGroup() 함수의 공개/비공개 모임 처리 확인
   - approveMember(), rejectMember() 함수의 리더 권한 확인
   - getGroups() 함수의 JOIN 쿼리 확인
   - getPublicGroups() 함수의 공개 모임 필터 확인
   - getGroupDetail() 함수의 멤버십 확인 확인
   - getMemberProgress() 함수의 리더 권한 확인
   - shareNoteToGroup() 함수의 기록 소유 및 멤버십 확인 확인
   - RLS 정책 준수 확인

2. 프론트엔드 연동 확인:
   - 모임 목록 페이지에서 Server Actions 호출 확인
   - 모임 생성 페이지에서 createGroup() 호출 확인
   - 모임 상세 페이지에서 Server Actions 호출 확인
   - 멤버 관리 기능 확인
   - 기록 공유 기능 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.5-4.2.8 섹션)
  - Groups, GroupMembers, GroupBooks, GroupNotes 테이블 스키마
- `doc/tasks/front/09-task-groups-plan.md`
  - 프론트엔드 독서모임 구현 상세

### 관련 프론트엔드 파일
- `app/(main)/groups/page.tsx`
- `app/(main)/groups/new/page.tsx`
- `app/(main)/groups/[id]/page.tsx`
- `components/groups/group-dashboard.tsx`
- `components/groups/member-list.tsx`

---

## 검증 체크리스트

### 모임 관리 기능
- [ ] 모임 생성이 정상 작동하는지 확인
- [ ] 모임 참여 신청이 정상 작동하는지 확인
- [ ] 공개 모임 자동 승인 확인
- [ ] 비공개 모임 대기 확인
- [ ] 모임 참여 승인/거부가 정상 작동하는지 확인
- [ ] 리더 권한 확인 확인

### 모임 조회 기능
- [ ] 모임 목록 조회가 정상 작동하는지 확인
- [ ] 공개 모임 목록 조회가 정상 작동하는지 확인
- [ ] 모임 상세 조회가 정상 작동하는지 확인
- [ ] 구성원 진행 상황 조회가 정상 작동하는지 확인

### 기록 공유 기능
- [ ] 모임 내 기록 공유가 정상 작동하는지 확인
- [ ] 기록 소유 확인 확인
- [ ] 멤버십 확인 확인

### 에러 처리
- [ ] 모임 관리 에러 시 적절한 에러 메시지 표시
- [ ] 예외 상황 처리 확인

### 프론트엔드 연동
- [ ] 모임 목록 페이지에서 Server Actions 호출 확인
- [ ] 모임 생성 페이지에서 Server Actions 호출 확인
- [ ] 모임 상세 페이지에서 Server Actions 호출 확인
- [ ] 에러 처리 및 로딩 상태 확인

---

**문서 끝**

