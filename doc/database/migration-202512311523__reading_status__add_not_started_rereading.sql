-- ============================================
-- 마이그레이션: reading_status - 읽기전, 재독 상태 추가
-- 날짜: 2025-12-31 15:23
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. reading_status ENUM 타입에 새 값 추가
--    - not_started: 읽기전 (아직 읽기 시작하지 않은 책)
--    - rereading: 재독 (다시 읽는 책)
--
-- 영향받는 테이블:
-- - user_books (status 컬럼)
--
-- 참고:
-- - PostgreSQL ENUM에 값을 추가하는 방법 사용
-- - 기존 데이터는 영향받지 않음
-- ============================================

-- reading_status ENUM에 새 값 추가
-- PostgreSQL은 ALTER TYPE ADD VALUE에 IF NOT EXISTS를 지원하지 않으므로
-- 값이 이미 존재하는지 확인 후 추가
DO $$ 
BEGIN
    -- not_started 값 추가 (이미 존재하면 에러 무시)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'not_started' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reading_status')
    ) THEN
        ALTER TYPE reading_status ADD VALUE 'not_started';
    END IF;
    
    -- rereading 값 추가 (이미 존재하면 에러 무시)
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

