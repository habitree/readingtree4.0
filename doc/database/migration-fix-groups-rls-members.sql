-- ============================================
-- groups RLS 정책 수정: 멤버 접근 허용
-- ============================================
-- 문제: groups 테이블의 RLS 정책이 멤버인 경우를 허용하지 않음
-- 해결: 멤버인 경우도 그룹을 볼 수 있도록 정책 수정
-- ============================================

DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (
        -- 공개 그룹은 누구나 볼 수 있음
        is_public = TRUE 
        OR 
        -- 사용자가 리더인 그룹을 볼 수 있음
        leader_id = auth.uid()
        OR
        -- 사용자가 멤버인 그룹을 볼 수 있음
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = groups.id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

