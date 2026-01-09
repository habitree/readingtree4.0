-- ============================================
-- 마이그레이션: bookshelves - 서재 테이블 생성
-- 날짜: 2026-01-09 12:24
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. bookshelves 테이블 생성 (서재 정보 관리)
-- 2. user_books 테이블에 bookshelf_id 컬럼 추가
-- 3. 기존 사용자별 메인 서재 자동 생성
-- 4. 기존 user_books 레코드를 메인 서재에 할당
-- 5. RLS 정책 설정
-- 6. 인덱스 생성
--
-- 영향받는 테이블:
-- - bookshelves (신규)
-- - user_books (수정)
--
-- 참고:
-- - 서재 상하구조 개편 작업
-- ============================================

-- 1. bookshelves 테이블 생성
CREATE TABLE IF NOT EXISTS bookshelves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_main BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- UNIQUE 제약: 사용자당 메인 서재는 1개만 (부분 인덱스로 구현)
    CONSTRAINT bookshelves_order_check CHECK ("order" >= 0)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookshelves_user_id ON bookshelves(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelves_is_main ON bookshelves(is_main) WHERE is_main = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookshelves_order ON bookshelves(user_id, "order");

-- 2.1 UNIQUE 제약: 사용자당 메인 서재는 1개만 (부분 인덱스로 구현)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookshelves_user_main_unique 
ON bookshelves(user_id) 
WHERE is_main = TRUE;

-- 3. user_books 테이블에 bookshelf_id 컬럼 추가
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS bookshelf_id UUID REFERENCES bookshelves(id) ON DELETE SET NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_books_bookshelf_id ON user_books(bookshelf_id);

-- 5. RLS 활성화
ALTER TABLE bookshelves ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
-- SELECT: 자신의 서재 또는 공개 서재 조회 가능
DROP POLICY IF EXISTS "Users can view own bookshelves or public bookshelves" ON bookshelves;
CREATE POLICY "Users can view own bookshelves or public bookshelves"
    ON bookshelves FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_public = TRUE
    );

-- INSERT: 자신의 서재만 생성 가능
DROP POLICY IF EXISTS "Users can insert own bookshelves" ON bookshelves;
CREATE POLICY "Users can insert own bookshelves"
    ON bookshelves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 서재만 수정 가능
DROP POLICY IF EXISTS "Users can update own bookshelves" ON bookshelves;
CREATE POLICY "Users can update own bookshelves"
    ON bookshelves FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 서재만 삭제 가능 (메인 서재는 삭제 불가)
DROP POLICY IF EXISTS "Users can delete own bookshelves" ON bookshelves;
CREATE POLICY "Users can delete own bookshelves"
    ON bookshelves FOR DELETE
    USING (
        auth.uid() = user_id 
        AND is_main = FALSE
    );

-- 7. 기존 사용자별 메인 서재 생성 및 user_books 할당
DO $$
DECLARE
    user_record RECORD;
    main_bookshelf_id UUID;
BEGIN
    -- 모든 사용자에 대해 메인 서재 생성
    FOR user_record IN 
        SELECT DISTINCT id FROM auth.users
    LOOP
        -- 메인 서재가 이미 있는지 확인
        SELECT id INTO main_bookshelf_id
        FROM bookshelves
        WHERE user_id = user_record.id AND is_main = TRUE
        LIMIT 1;
        
        -- 메인 서재가 없으면 생성
        IF main_bookshelf_id IS NULL THEN
            INSERT INTO bookshelves (user_id, name, is_main, "order", is_public)
            VALUES (user_record.id, '내 서재', TRUE, 0, FALSE)
            RETURNING id INTO main_bookshelf_id;
        END IF;
        
        -- 해당 사용자의 모든 user_books 레코드를 메인 서재에 할당
        UPDATE user_books
        SET bookshelf_id = main_bookshelf_id
        WHERE user_id = user_record.id 
        AND bookshelf_id IS NULL;
    END LOOP;
END $$;

-- 8. bookshelf_id를 NOT NULL로 변경 (기존 데이터 할당 후)
-- 먼저 모든 NULL 값을 처리했으므로 NOT NULL 제약 추가
ALTER TABLE user_books 
ALTER COLUMN bookshelf_id SET NOT NULL;

-- 9. updated_at 트리거 함수 (이미 있다면 무시)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. bookshelves 테이블의 updated_at 트리거
DROP TRIGGER IF EXISTS update_bookshelves_updated_at ON bookshelves;
CREATE TRIGGER update_bookshelves_updated_at
    BEFORE UPDATE ON bookshelves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
