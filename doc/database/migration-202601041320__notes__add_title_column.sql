-- ============================================
-- 마이그레이션: notes - title 컬럼 추가
-- 날짜: 2026-01-04 13:20
-- 작성자: Antigravity
-- ============================================
-- 
-- 변경 사항:
-- 1. notes 테이블에 title 컬럼 추가
-- 2. title 컬럼에 대한 인덱스 생성
--
-- 영향받는 테이블:
-- - notes
--
-- ============================================

-- 1. notes 테이블에 title 컬럼 추가
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. title 컬럼에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
