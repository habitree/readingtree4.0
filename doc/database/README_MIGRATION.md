# 데이터베이스 마이그레이션 가이드

## 읽기전/재독 상태 추가 마이그레이션

### 문제 상황
- `invalid input value for enum reading_status: "rereading"` 오류 발생
- `reading_status` ENUM에 `not_started`와 `rereading` 값이 없음

### 해결 방법

#### 1단계: 현재 상태 확인

Supabase SQL Editor에서 다음 쿼리를 실행하여 현재 ENUM 값을 확인하세요:

```sql
SELECT 
    enumlabel AS status_value,
    enumsortorder AS sort_order
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reading_status'
ORDER BY enumsortorder;
```

**예상 결과 (마이그레이션 전):**
```
status_value | sort_order
-------------|-----------
reading      | 1
completed    | 2
paused       | 3
```

**예상 결과 (마이그레이션 후):**
```
status_value | sort_order
-------------|-----------
reading      | 1
completed    | 2
paused       | 3
not_started  | 4
rereading    | 5
```

#### 2단계: 마이그레이션 실행

`doc/database/migration-202512311523__reading_status__add_not_started_rereading.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

**파일 위치:** `doc/database/migration-202512311523__reading_status__add_not_started_rereading.sql`

#### 3단계: 마이그레이션 확인

마이그레이션 실행 후, 1단계의 확인 쿼리를 다시 실행하여 `not_started`와 `rereading`이 추가되었는지 확인하세요.

#### 4단계: 애플리케이션 재시작

마이그레이션 실행 후 개발 서버를 재시작하세요:

```bash
# 개발 서버 재시작
npm run dev
```

### 마이그레이션 파일 내용

```sql
-- reading_status ENUM에 새 값 추가
DO $$ 
BEGIN
    -- not_started 값 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'not_started' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reading_status')
    ) THEN
        ALTER TYPE reading_status ADD VALUE 'not_started';
    END IF;
    
    -- rereading 값 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'rereading' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reading_status')
    ) THEN
        ALTER TYPE reading_status ADD VALUE 'rereading';
    END IF;
END $$;

-- 컬럼 주석 업데이트
COMMENT ON COLUMN user_books.status IS '독서 상태: reading(읽는중), completed(완독), paused(멈춤), not_started(읽기전), rereading(재독)';
```

### 주의사항

1. **마이그레이션은 한 번만 실행**: 이미 값이 존재하면 자동으로 건너뜁니다.
2. **기존 데이터 영향 없음**: 기존 책 데이터는 영향받지 않습니다.
3. **애플리케이션 재시작 권장**: 마이그레이션 후 개발 서버를 재시작하는 것이 좋습니다.

### 문제 해결

마이그레이션 실행 후에도 오류가 발생하면:

1. Supabase 대시보드에서 연결을 새로고침
2. 개발 서버 재시작
3. 브라우저 캐시 삭제 후 다시 시도

