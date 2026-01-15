-- ============================================
-- 마이그레이션: notes - related_user_book_ids 컬럼 추가
-- 날짜: 2025-01-15 12:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. notes 테이블에 related_user_book_ids (UUID[]) 컬럼 추가
-- 2. 기록과 관련된 다른 책들(user_books.id)을 배열로 저장
-- 3. 기록은 하나의 주 책(book_id)에 연결되고, 추가로 관련된 다른 책들을 related_user_book_ids에 저장
--
-- 영향받는 테이블:
-- - notes
--
-- 참고:
-- - 기록 내용(content)의 책 링크와는 별도로 기록 자체의 연결된 책을 관리
-- - user_books.id 배열로 저장하여 사용자가 소유한 책만 연결 가능
-- ============================================

-- related_user_book_ids 컬럼 추가
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS related_user_book_ids UUID[] DEFAULT NULL;

-- 인덱스 추가 (GIN 인덱스로 배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_notes_related_user_book_ids 
ON notes USING gin(related_user_book_ids);

-- 코멘트 추가
COMMENT ON COLUMN notes.related_user_book_ids IS '기록과 관련된 다른 책들의 user_books.id 배열. 기록 내용의 책 링크와는 별도로 기록 자체의 연결된 책을 관리합니다.';
