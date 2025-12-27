-- ============================================
-- 샘플 데이터 지원 마이그레이션
-- ============================================
-- 기존 데이터베이스에 샘플 데이터 컬럼 추가
-- 이 파일은 기존 스키마가 이미 적용된 경우에만 실행하세요
-- ============================================

-- Books 테이블에 is_sample 컬럼 추가
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- Notes 테이블에 is_sample 컬럼 추가
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- 샘플 데이터 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_books_is_sample ON books(is_sample) WHERE is_sample = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_is_sample ON notes(is_sample) WHERE is_sample = TRUE;

-- Notes 테이블의 RLS 정책 업데이트 (샘플 데이터 조회 허용)
DROP POLICY IF EXISTS "Users can view own notes" ON notes;

CREATE POLICY "Users can view own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE);

-- ============================================
-- 마이그레이션 완료
-- ============================================

