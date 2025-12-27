# TASK-08: 프로필 관리 백엔드

**작업 ID:** TASK-08  
**우선순위:** P1 (Should Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00  
**다음 작업:** 없음

---

## 작업 개요

프로필 관리 관련 Server Actions를 검증하고 개선합니다. 프로필 조회, 수정, 이미지 업로드를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/profile.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 프로필 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 프로필 관리 Server Actions 검증 및 개선

**파일:** `app/actions/profile.ts`

**기능:**
- `getProfile()`: 프로필 조회
- `updateProfile()`: 프로필 수정
- `updateProfileImage()`: 프로필 이미지 업로드

**확인 사항:**
- 프로필 조회 권한 확인
- 프로필 수정 권한 확인
- 이미지 업로드 및 압축 확인
- 기존 이미지 삭제 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/profile/page.tsx`
  - `getProfile()` 호출
  - `updateProfile()` 호출
  - `updateProfileImage()` 호출

### 연동 컴포넌트
- `components/profile/profile-form.tsx`
  - 프로필 수정 폼
- `components/profile/profile-content.tsx`
  - 프로필 표시

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.1 섹션) @doc/tasks/front/10-task-profile-plan.md 참고하여 
프로필 관리 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/profile.ts 파일 검증 및 개선:
   - getProfile() 함수의 권한 확인 확인
   - updateProfile() 함수의 유효성 검사 확인 (이름 1-100자, 목표 1-100)
   - updateProfileImage() 함수의 파일 형식 검증 확인
   - 이미지 압축 로직 확인 (sharp 사용)
   - 기존 이미지 삭제 확인 (Storage에서도 삭제)
   - Storage 업로드 경로 확인 (avatars/${userId}/${fileName})

2. 프론트엔드 연동 확인:
   - 프로필 페이지에서 Server Actions 호출 확인
   - 프로필 수정 폼 확인
   - 프로필 이미지 업로드 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.1 섹션)
  - Users 테이블 스키마
- `doc/tasks/front/10-task-profile-plan.md`
  - 프론트엔드 프로필 관리 구현 상세

### 관련 프론트엔드 파일
- `app/(main)/profile/page.tsx`
- `components/profile/profile-form.tsx`
- `components/profile/profile-content.tsx`

---

## 검증 체크리스트

### 프로필 관리 기능
- [ ] 프로필 조회가 정상 작동하는지 확인
- [ ] 프로필 수정이 정상 작동하는지 확인
- [ ] 프로필 이미지 업로드가 정상 작동하는지 확인
- [ ] 이미지 압축 확인
- [ ] 기존 이미지 삭제 확인
- [ ] 유효성 검사 확인

### 에러 처리
- [ ] 프로필 관리 에러 시 적절한 에러 메시지 표시
- [ ] 예외 상황 처리 확인

### 프론트엔드 연동
- [ ] 프로필 페이지에서 Server Actions 호출 확인
- [ ] 프로필 수정 폼 확인
- [ ] 프로필 이미지 업로드 확인
- [ ] 에러 처리 및 로딩 상태 확인

---

**문서 끝**

