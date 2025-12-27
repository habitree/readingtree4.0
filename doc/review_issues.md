# Habitree Reading Hub - 문서 검토 결과 및 이슈 리포트

**버전:** 1.0  
**작성일:** 2025년 12월  
**검토자:** AI 개발자  
**관련 문서:**
- [Habitree-Reading-Hub-PRD.md](./Habitree-Reading-Hub-PRD.md)
- [software_design.md](./software_design.md)
- [user_stories.md](./user_stories.md)

---

## 목차
1. [치명적 이슈 (Critical Issues)](#치명적-이슈-critical-issues)
2. [중요 이슈 (Major Issues)](#중요-이슈-major-issues)
3. [경고 사항 (Warnings)](#경고-사항-warnings)
4. [개선 제안 (Improvements)](#개선-제안-improvements)
5. [일관성 문제 (Consistency Issues)](#일관성-문제-consistency-issues)

---

## 치명적 이슈 (Critical Issues)

### 1. API 명칭 오타 및 불일치

**문제:**
- PRD 96행: "gogle vision API" → **오타** (Google로 수정 필요)
- PRD 106행: "gogle API" → **오타** (Google로 수정 필요)
- 실제로는 Gemini API를 사용하는 것으로 보임

**영향:** 개발 시 혼란 및 잘못된 API 선택 가능

**해결 방안:**
- PRD에서 "Google Vision API" 또는 "Gemini API"로 통일
- software_design.md에서는 Gemini API로 명시되어 있으므로 PRD와 일치시켜야 함

---

### 2. Users 테이블과 Supabase Auth 불일치

**문제:**
- `software_design.md`의 Users 테이블 스키마에 `email`이 UNIQUE NOT NULL로 정의되어 있음
- 하지만 Supabase Auth는 별도의 `auth.users` 테이블을 사용
- 일반적으로 `public.users` 테이블은 `auth.users`와 1:1 관계를 가져야 함

**영향:**
- 인증 후 사용자 프로필 생성 시 중복 또는 동기화 문제 발생 가능
- RLS 정책이 제대로 작동하지 않을 수 있음

**해결 방안:**
```sql
-- Users 테이블에 auth.users와 연결하는 컬럼 추가
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255), -- auth.users에서 가져옴
    name VARCHAR(100) NOT NULL,
    -- ...
);

-- 또는 Supabase의 자동 프로필 생성 함수 사용
```

---

### 3. 데이터 암호화 구현의 모순

**문제:**
- PRD 180행: "모든 데이터는 암호화되어 저장"
- `software_design.md` 1368-1403행: 암호화 함수 제공
- 하지만 실제로는 Supabase가 이미 전송 중 암호화(TLS)와 저장 시 암호화를 제공
- 애플리케이션 레벨 암호화는 성능 저하와 복잡성만 증가

**영향:**
- 불필요한 복잡성 추가
- 성능 저하 (암호화/복호화 오버헤드)
- 키 관리 복잡성 증가

**해결 방안:**
- Supabase의 기본 암호화에 의존
- 민감한 데이터(예: 개인정보)만 선택적 암호화 고려
- PRD에서 "데이터 암호화" 문구를 "Supabase의 기본 보안 기능 활용"으로 수정

---

### 4. OCR 처리 방식의 비효율성

**문제:**
- `user_stories.md` US-012: OCR이 이미지 업로드 후 자동으로 시작
- 하지만 Gemini API는 동기 호출이므로 사용자가 3-5초 대기해야 함
- 대용량 이미지나 여러 이미지 처리 시 타임아웃 가능

**영향:**
- 사용자 경험 저하 (긴 대기 시간)
- API 타임아웃 가능성
- 비용 증가 (실패 시 재시도)

**해결 방안:**
- 비동기 처리로 변경 (Queue 시스템 도입)
- 즉시 응답 후 백그라운드에서 OCR 처리
- 처리 완료 시 알림 또는 실시간 업데이트

---

## 중요 이슈 (Major Issues)

### 5. Books 테이블의 ISBN UNIQUE 제약조건 문제

**문제:**
- `software_design.md` 397행: `isbn VARCHAR(20) UNIQUE NOT NULL`
- 같은 책을 여러 사용자가 추가할 수 없음
- 실제로는 Books 테이블은 공유되어야 하고, UserBooks가 사용자별 관계를 관리해야 함

**영향:**
- 첫 번째 사용자가 책을 추가하면 다른 사용자는 추가 불가
- 데이터 중복 및 일관성 문제

**해결 방안:**
```sql
-- Books 테이블에서 UNIQUE 제약조건 제거 또는 유지하되
-- 책 추가 시 기존 책이 있으면 재사용하는 로직 구현
-- 또는 ISBN을 NULL 허용하고 중복 체크 로직을 애플리케이션 레벨에서 처리
```

---

### 6. Full-text Search의 한글 지원 문제

**문제:**
- `software_design.md` 486행: `to_tsvector('simple', content)`
- PostgreSQL의 'simple' 텍스트 검색은 한글 형태소 분석을 지원하지 않음
- 한글 검색 정확도가 매우 낮을 수 있음

**영향:**
- 한글 검색 결과가 부정확함
- 사용자 경험 저하

**해결 방안:**
- PostgreSQL의 `pg_trgm` 확장 사용 (삼각형 유사도 검색)
- 또는 외부 검색 엔진 도입 (Elasticsearch, Meilisearch 등)
- 또는 Supabase의 Full-text Search 대신 `ILIKE` 또는 `LIKE` 패턴 매칭 사용

---

### 7. 이미지 업로드 경로 불일치

**문제:**
- `user_stories.md` US-011: `/transcriptions/{user_id}/{note_id}`
- `user_stories.md` US-013: `/photos/{user_id}/{note_id}`
- 하지만 `software_design.md` 1260행: `${type}s/${userId}/${fileName}`
- `note_id`를 경로에 포함하려면 업로드 시점에 note가 먼저 생성되어야 함

**영향:**
- 업로드 순서 문제 (note 생성 전 이미지 업로드 불가)
- 파일 경로 불일치로 인한 혼란

**해결 방안:**
- 경로를 `${type}s/${userId}/${timestamp}-${random}.${ext}` 형식으로 통일
- 또는 note 생성 후 이미지 업로드하도록 플로우 변경

---

### 8. Rate Limiting 구현의 한계

**문제:**
- `software_design.md` 1434-1484행: LRU Cache 기반 Rate Limiting
- 이 방식은 서버 재시작 시 카운터가 초기화됨
- 여러 서버 인스턴스 간 공유 불가 (Vercel의 서버리스 환경)

**영향:**
- Rate Limiting이 제대로 작동하지 않을 수 있음
- 서버리스 환경에서 효과적이지 않음

**해결 방안:**
- Redis 또는 Upstash Redis 같은 외부 저장소 사용
- 또는 Vercel의 Edge Middleware에서 Rate Limiting 구현
- 또는 Supabase의 Rate Limiting 기능 활용

---

### 9. 미들웨어 인증 방식의 구식 패턴

**문제:**
- `software_design.md` 1284-1326행: `@supabase/auth-helpers-nextjs` 사용
- 이 패키지는 구식이며 Next.js 14 App Router와 호환성 문제가 있을 수 있음

**영향:**
- 최신 Next.js 기능과 호환되지 않을 수 있음
- 보안 취약점 가능성

**해결 방안:**
- `@supabase/ssr` 패키지 사용 (Supabase 공식 권장)
- 또는 Next.js 14의 서버 컴포넌트에서 직접 인증 확인

---

### 10. 공개 기록 조회 시 RLS 정책 누락

**문제:**
- `software_design.md` 494-496행: Notes RLS 정책에서 `is_public = TRUE`인 경우 조회 가능
- 하지만 공개 기록을 조회하는 페이지(`/share/notes/[id]`)에 대한 별도 정책이 없음

**영향:**
- 공개 기록이 제대로 조회되지 않을 수 있음
- 인증되지 않은 사용자가 공개 기록을 볼 수 없을 수 있음

**해결 방안:**
- 공개 기록 조회를 위한 별도 RLS 정책 추가
- 또는 공개 페이지는 RLS를 우회하는 서비스 역할 키 사용

---

## 경고 사항 (Warnings)

### 11. 타임라인 통계의 성능 문제

**문제:**
- `user_stories.md` US-030: "이번 주 읽은 시간/페이지" 통계
- 하지만 데이터 모델에 "읽은 시간"이나 "페이지 수" 필드가 없음
- 매번 집계 쿼리를 실행하면 성능 저하

**해결 방안:**
- 통계를 캐싱하거나 별도 통계 테이블 생성
- 또는 실시간 계산 대신 주기적으로 업데이트되는 통계 저장

---

### 12. 카드뉴스 생성의 서버 부하

**문제:**
- `user_stories.md` US-024: 서버 사이드에서 이미지 생성
- `@vercel/og`는 Edge Runtime에서만 작동
- 복잡한 템플릿은 서버 부하 증가

**해결 방안:**
- 클라이언트 사이드에서 Canvas API로 생성 고려
- 또는 이미지 생성 작업을 Queue로 처리

---

### 13. 모임 공개 범위의 모호함

**문제:**
- `user_stories.md` US-033: 모임 생성 시 공개/비공개 선택
- 하지만 공개 모임의 검색 및 발견 기능이 명시되지 않음

**해결 방안:**
- 공개 모임 목록 페이지 추가
- 모임 검색 기능 명시

---

### 14. 태그 기능의 구현 누락

**문제:**
- `user_stories.md` US-022: 태그로 검색 기능
- 하지만 태그 추가 UI/UX가 명시되지 않음
- 태그 자동완성 기능의 구현 방법 불명확

**해결 방안:**
- 태그 추가 UI 명시
- 태그 자동완성을 위한 별도 API 엔드포인트 설계

---

## 개선 제안 (Improvements)

### 15. 에러 처리 전략 부재

**문제:**
- 문서 전반에 에러 처리 전략이 명시되지 않음
- API 실패, 네트워크 오류, 데이터베이스 오류 등에 대한 대응 방안 없음

**제안:**
- 통일된 에러 응답 형식 정의 (이미 부록 B에 있으나 실제 사용 가이드 필요)
- 재시도 로직 명시
- 사용자 친화적 에러 메시지 가이드라인

---

### 16. 테스트 전략 부재

**문제:**
- 단위 테스트, 통합 테스트, E2E 테스트 전략이 전혀 언급되지 않음

**제안:**
- 테스트 전략 문서 추가
- 주요 기능별 테스트 케이스 정의
- CI/CD 파이프라인에 테스트 단계 포함

---

### 17. 모니터링 및 알림 전략 부족

**문제:**
- `software_design.md`에 Sentry 설정은 있으나
- 실제 모니터링 지표, 알림 임계값, 대시보드 구성이 없음

**제안:**
- 모니터링 지표 정의 (응답 시간, 에러율, API 호출 수 등)
- 알림 규칙 설정
- 대시보드 구성 계획

---

### 18. 데이터 백업 및 복구 전략 부재

**문제:**
- 데이터 백업 주기, 복구 절차가 명시되지 않음

**제안:**
- Supabase의 자동 백업 활용
- 수동 백업 절차 문서화
- 재해 복구 계획 수립

---

## 일관성 문제 (Consistency Issues)

### 19. 기록 타입 명칭 불일치

**문제:**
- PRD: `quote, memo, photo, transcription`
- `software_design.md`: `quote, photo, memo, transcription`
- `user_stories.md`: 필사는 `quote` 또는 `transcription`으로 혼용

**해결 방안:**
- 타입 명칭 통일: `quote` (텍스트 필사), `transcription` (이미지 필사), `photo`, `memo`
- 또는 `quote`와 `transcription`을 하나로 통합

---

### 20. 폴더 구조 불일치

**문제:**
- `software_design.md` 738행: `front/` 폴더
- 하지만 Next.js 프로젝트는 보통 루트에 `app/`, `components/` 등을 둠

**해결 방안:**
- 폴더 구조를 실제 Next.js 프로젝트 구조에 맞게 수정
- 또는 모노레포 구조인지 명시

---

### 21. API 엔드포인트 명명 불일치

**문제:**
- `software_design.md` 1056행: `/api/notes/` (복수형)
- `software_design.md` 1057행: `/api/notes/[id]` (동적 라우트)
- 하지만 Next.js App Router에서는 `/api/notes/route.ts`와 `/api/notes/[id]/route.ts` 형식

**해결 방안:**
- Next.js App Router 형식에 맞게 수정
- 또는 Pages Router 사용 시 명시

---

## 우선순위별 수정 권장사항

### 즉시 수정 필요 (치명적)
1. ✅ API 명칭 오타 수정 (Google/Gemini)
2. ✅ Users 테이블과 Auth 연동 방식 수정
3. ✅ Books 테이블 ISBN UNIQUE 제약조건 재검토
4. ✅ OCR 비동기 처리 방식으로 변경

### 단기 수정 권장 (중요)
5. ✅ Full-text Search 한글 지원 개선
6. ✅ 이미지 업로드 경로 통일
7. ✅ Rate Limiting 구현 방식 개선
8. ✅ 미들웨어 인증 패키지 업데이트

### 중기 개선 권장
9. ✅ 에러 처리 전략 수립
10. ✅ 테스트 전략 추가
11. ✅ 모니터링 전략 보완

---

## 결론

전반적으로 문서는 잘 작성되어 있으나, 몇 가지 **치명적 이슈**와 **중요 이슈**가 발견되었습니다. 특히:

1. **기술적 일관성**: API 명칭, 데이터 모델, 폴더 구조 등에서 불일치 발견
2. **구현 가능성**: 일부 기능의 구현 방식이 현실적이지 않거나 개선이 필요
3. **보안 및 성능**: 일부 보안 정책과 성능 최적화 방안이 부족

**권장 조치:**
1. 치명적 이슈부터 우선 수정
2. 데이터 모델 재검토 및 프로토타입 테스트
3. 실제 개발 전 기술 검증 (PoC) 수행

---

**문서 끝**

