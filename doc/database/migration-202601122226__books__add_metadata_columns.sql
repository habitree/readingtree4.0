-- ============================================
-- 마이그레이션: books - 메타데이터 컬럼 추가
-- 날짜: 2026-01-12 22:26
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. books 테이블에 category 컬럼 추가 (VARCHAR(100)) - 도서 분류
-- 2. books 테이블에 total_pages 컬럼 추가 (INTEGER) - 전체 페이지 수
-- 3. books 테이블에 summary 컬럼 추가 (TEXT) - 책 소개
-- 4. books 테이블에 external_link 컬럼 추가 (TEXT) - 네이버 링크
-- 5. user_books 테이블에 book_format 컬럼 추가 (VARCHAR(50)) - 읽는 책 종류
--
-- 영향받는 테이블:
-- - books
-- - user_books
--
-- 참고:
-- - 기존 시스템에서 관리되던 메타데이터를 새로 추가
-- - 기능 적용은 이후에 진행 예정
-- ============================================

-- books 테이블에 메타데이터 컬럼 추가
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS total_pages INTEGER;

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- user_books 테이블에 book_format 컬럼 추가
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS book_format VARCHAR(50);

-- 인덱스 추가 (필요한 경우)
-- category는 검색/필터링에 사용될 가능성이 높으므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category) WHERE category IS NOT NULL;

-- total_pages는 범위 검색에 사용될 수 있으므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_books_total_pages ON books(total_pages) WHERE total_pages IS NOT NULL;

-- book_format은 필터링에 사용될 가능성이 높으므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_books_book_format ON user_books(book_format) WHERE book_format IS NOT NULL;
