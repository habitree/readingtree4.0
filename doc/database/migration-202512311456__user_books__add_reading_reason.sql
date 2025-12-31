-- ============================================
-- 마이그레이션: user_books - 읽는 이유 필드 추가
-- 날짜: 2025-12-31 14:56
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. user_books 테이블에 reading_reason 필드 추가
--    - reading_reason: 사용자가 책을 읽는 이유 (TEXT, NULL 허용)
--
-- 영향받는 테이블:
-- - user_books
--
-- 참고:
-- - 책 정보 조회 시 읽는 이유가 표시되도록 함
-- - 기존 데이터는 NULL로 설정됨
-- ============================================

-- 읽는 이유 필드 추가
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS reading_reason TEXT;

-- 컬럼 주석 추가
COMMENT ON COLUMN user_books.reading_reason IS '사용자가 책을 읽는 이유';

