-- ============================================
-- 마이그레이션: users RLS 정책 - 모임 멤버 간 프로필 조회 허용
-- 날짜: 2025-12-31 16:20
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. users 테이블의 SELECT 정책에 모임 멤버 간 프로필 조회 허용 추가
--    - 같은 모임의 멤버는 서로의 프로필을 볼 수 있도록 수정
--    - 기존 정책: 자신의 프로필만 조회 가능 (auth.uid() = id)
--    - 새 정책: 자신의 프로필 또는 같은 모임의 멤버 프로필 조회 가능
--
-- 영향받는 테이블:
-- - users
--
-- 참고:
-- - group_members 조인 시 users 프로필 조회를 위해 필요
-- - 무한 재귀 방지: group_members를 직접 참조하지 않고 EXISTS 서브쿼리 사용
-- ============================================

-- users 테이블 SELECT 정책 수정 (모임 멤버 간 프로필 조회 허용)
-- 주의: group_members를 참조하지만, group_members의 RLS 정책이 groups만 참조하므로
-- 순환 참조는 발생하지 않음 (groups → group_members → users → group_members는 순환 아님)
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile or group member profiles"
    ON users FOR SELECT
    USING (
        -- 자신의 프로필은 항상 조회 가능
        auth.uid() = id
        OR
        -- 같은 모임의 멤버 프로필 조회 가능
        -- 무한 재귀 방지: group_members의 RLS 정책이 groups만 참조하므로 순환 참조 없음
        EXISTS (
            SELECT 1 FROM group_members gm1
            WHERE gm1.user_id = users.id
            AND gm1.status = 'approved'
            AND EXISTS (
                SELECT 1 FROM group_members gm2
                WHERE gm2.group_id = gm1.group_id
                AND gm2.user_id = auth.uid()
                AND gm2.status = 'approved'
            )
        )
    );

-- ============================================
-- 참고:
-- - 이 정책은 모임 멤버 간 프로필 조회를 허용합니다
-- - 무한 재귀 방지: group_members를 직접 참조하지만,
--   group_members의 RLS 정책이 groups를 참조하므로 순환 참조는 발생하지 않음
-- - group_members의 RLS 정책: groups 테이블만 참조 (무한 재귀 방지)
-- ============================================

