-- ============================================
-- 마이그레이션: group_shared_books 테이블 생성
-- 날짜: 2025-12-31 16:33
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. group_shared_books 테이블 생성
--    - 개인 서재를 모임에 공유하는 기능을 위한 테이블
-- 2. RLS 정책 설정
--    - 멤버만 조회 가능
--    - 자신의 서재만 공유 가능
--    - 자신이 공유한 서재만 공유 해제 가능
--
-- 영향받는 테이블:
-- - group_shared_books (신규)
--
-- 참고:
-- - user_books와 groups의 다대다 관계
-- - 한 사용자는 같은 모임에 같은 서재를 한 번만 공유 가능
-- ============================================

-- group_shared_books 테이블 생성
CREATE TABLE IF NOT EXISTS group_shared_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_book_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_shared_books_group_id ON group_shared_books(group_id);
CREATE INDEX IF NOT EXISTS idx_group_shared_books_user_book_id ON group_shared_books(user_book_id);

-- RLS
ALTER TABLE group_shared_books ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Members can view shared books" ON group_shared_books;
CREATE POLICY "Members can view shared books"
    ON group_shared_books FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 공유 서재를 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_shared_books.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 공유 서재는 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_shared_books.group_id 
            AND is_public = TRUE
        )
        OR
        -- 모임 멤버는 공유 서재를 볼 수 있음
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_shared_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Users can share own books" ON group_shared_books;
CREATE POLICY "Users can share own books"
    ON group_shared_books FOR INSERT
    WITH CHECK (
        -- 자신의 서재만 공유 가능
        EXISTS (
            SELECT 1 FROM user_books
            WHERE id = group_shared_books.user_book_id
            AND user_id = auth.uid()
        )
        AND
        -- 모임 멤버만 공유 가능
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_shared_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Users can unshare own books" ON group_shared_books;
CREATE POLICY "Users can unshare own books"
    ON group_shared_books FOR DELETE
    USING (
        -- 자신이 공유한 서재만 해제 가능
        EXISTS (
            SELECT 1 FROM user_books
            WHERE id = group_shared_books.user_book_id
            AND user_id = auth.uid()
        )
    );

