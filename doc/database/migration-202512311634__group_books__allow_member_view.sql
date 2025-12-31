-- ============================================
-- 마이그레이션: group_books RLS 정책 - 멤버 조회 허용
-- 날짜: 2025-12-31 16:34
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. group_books 테이블의 SELECT 정책에 멤버 조회 허용 추가
--    - 기존: 리더 또는 공개 그룹만 조회 가능
--    - 변경: 멤버도 조회 가능
--
-- 영향받는 테이블:
-- - group_books
--
-- 참고:
-- - 지정도서 기능을 위해 멤버도 조회할 수 있어야 함
-- ============================================

-- group_books 테이블 SELECT 정책 수정 (멤버 조회 허용)
DROP POLICY IF EXISTS "Members can view group books" ON group_books;

CREATE POLICY "Members can view group books"
    ON group_books FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 책을 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_books.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 책은 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_books.group_id 
            AND is_public = TRUE
        )
        OR
        -- 모임 멤버는 지정도서를 볼 수 있음
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

