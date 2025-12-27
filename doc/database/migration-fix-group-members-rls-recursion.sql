-- ============================================
-- group_members RLS 정책 무한 재귀 수정
-- ============================================
-- 문제: group_members 테이블의 RLS 정책이 자기 자신을 참조하여 무한 재귀 발생
-- 해결: group_members 테이블을 참조하지 않고 groups 테이블만 사용하도록 수정
-- ============================================

-- group_members 정책 수정
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 멤버를 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_members.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 멤버는 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_members.group_id 
            AND is_public = TRUE
        )
        OR
        -- 사용자 자신의 멤버십 정보는 볼 수 있음
        user_id = auth.uid()
    );

-- group_books 정책 수정 (무한 재귀 방지)
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
    );

-- group_notes 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Members can view shared notes" ON group_notes;
CREATE POLICY "Members can view shared notes"
    ON group_notes FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 공유 기록을 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_notes.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 공유 기록은 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_notes.group_id 
            AND is_public = TRUE
        )
    );

-- groups 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (
        -- 공개 그룹은 누구나 볼 수 있음
        is_public = TRUE 
        OR 
        -- 사용자가 리더인 그룹을 볼 수 있음
        leader_id = auth.uid()
    );

