---
alwaysApply: true
---

## [Data Model Governance]

# 프로젝트 데이터 구조 규칙 - 2. 구현 및 코드 패턴 (Implementation & Code Patterns)

**작성일:** 2025년 1월
**프로젝트:** Habitree Reading Hub v4.0.0
**버전:** 2.1 (분리 개정판)
**적용 범위:** 프론트엔드/백엔드 코드 구현, 데이터 접근 패턴

**참고:**
- 거버넌스 및 스키마 규칙은 `datarule_1.md`를 참조하세요.

---

## 1. 레이어 분리 원칙

**핵심**: 컴포넌트(UI)는 절대 Supabase를 직접 호출하지 않습니다.

### 1.1 표준 데이터 흐름
`컴포넌트 (View) -> Hooks -> Server Actions (Data Access) -> Supabase`

### 1.2 컴포넌트 제한사항
- ❌ **금지**: `createClient()` 직접 호출, 테이블명 하드코딩
- ✅ **권장**: 오직 화면 렌더링 및 사용자 이벤트 처리

### 1.3 올바른 패턴

```typescript
// ❌ 나쁜 예
export function BookList() {
  const supabase = createClient();
  const { data } = await supabase.from("books").select("*");
}

// ✅ 좋은 예
export function BookList() {
  const { books } = useBooks(); // hooks 사용
}
```

### 1.4 예외 허용 경로
- `app/actions/**`
- `lib/supabase/**`
- `contexts/auth-context.tsx`
- `app/callback/route.ts`

---

## 2. Server Actions 규칙

**경로**: `app/actions/**`

1.  **"use server"** 지시어 필수
2.  **타입 명시**: 반환 값에 대한 타입 명시 필수
3.  **에러 핸들링**: `try-catch` 및 일관된 에러 반환

```typescript
"use server";
import type { Database } from "@/types/database";

export async function getBooks(): Promise<Book[]> {
  const supabase = await createServerSupabaseClient();
  // ...
}
```

---

## 3. 타입 안정성

모든 DB 쿼리는 제네릭을 사용하여 타입을 강제해야 합니다.

```typescript
const { data } = await supabase
  .from("books")
  .select("*")
  .returns<Database["public"]["Tables"]["books"]["Row"][]>();
```

---

## 4. 점진적 마이그레이션 전략

- **기존 코드**: 리팩토링 시 수정 (당장 수정 강제 아님)
- **새로운 코드**: **무조건** 규칙 준수

---

## 5. 위반 사례 및 조치

### 5.1 UI에서 테이블명 노출
**조치**: 해당 로직을 Server Action으로 이동, UI는 추상화된 함수 호출.

### 5.2 RLS 우회 시도
**조치**: 즉시 DB에 RLS 정책 추가. UI 체크는 보조 수단으로만 사용.

---

## 6. 개발 체크리스트

- [ ] 컴포넌트에 `import ... from "@/lib/supabase/client"` 없음
- [ ] Server Action 반환 타입 명시
- [ ] `types/database.ts` 최신화 확인
