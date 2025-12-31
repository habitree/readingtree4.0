-- ============================================
-- 마이그레이션: groups RLS 정책 무한 재귀 수정
-- 날짜: 2025-12-31 16:08
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. groups 테이블의 SELECT 정책에서 group_members 참조 제거
--    - 무한 재귀 방지: group_members 정책이 groups를 참조하므로
--      groups 정책에서 group_members를 참조하면 순환 참조 발생
-- 2. 대신 leader_id와 is_public만 사용하여 정책 구성
--
-- 영향받는 테이블:
-- - groups
--
-- 참고:
-- - group_members 조회는 별도로 처리 (groups 정책과 분리)
-- - 리더는 leader_id로 직접 확인 가능
-- - 멤버 확인은 group_members 조회 시 별도 처리
-- ============================================

-- groups 테이블 SELECT 정책 수정 (무한 재귀 방지)
-- 주의: group_members를 직접 참조하면 무한 재귀 발생
-- 대신 서버 액션에서 멤버십을 먼저 확인한 후 그룹 조회
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (
        -- 공개 그룹은 누구나 볼 수 있음
        is_public = TRUE 
        OR 
        -- 사용자가 리더인 그룹을 볼 수 있음
        leader_id = auth.uid()
        -- 주의: group_members 참조 제거 (무한 재귀 방지)
        -- 멤버 확인은 getGroupDetail/getGroups 함수에서 별도로 처리
        -- 멤버인 경우: group_members를 먼저 조회한 후 group_id로 groups 조회
    );

-- ============================================
-- 참고:
-- - 그룹 생성 시 리더는 자동으로 추가되므로 leader_id로 확인 가능
-- - 멤버인 그룹 조회는 getGroups 함수에서 별도로 처리
--   (group_members를 먼저 조회한 후 group_id로 groups 조회)
-- ============================================

