-- ============================================
-- 관리자용 RLS 정책 추가
-- 날짜: 2025-01-02 15:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. 관리자 이메일(cdhnaya@kakao.com)로 전체 데이터 조회 가능하도록 RLS 정책 추가
-- 2. users, user_books, notes, groups 테이블에 관리자 SELECT 정책 추가
--
-- 영향받는 테이블:
-- - users
-- - user_books
-- - notes
-- - groups
-- - group_members
-- - group_books
-- - group_notes
-- - group_shared_books
-- - transcriptions
--
-- 참고:
-- - 관리자는 cdhnaya@kakao.com 이메일 주소로만 지정
-- - 관리자는 전체 데이터를 조회할 수 있지만, 수정/삭제는 개인 데이터만 가능
-- ============================================

-- 관리자 이메일 상수 (PostgreSQL 함수로 정의)
-- auth.users 테이블에 직접 접근하는 대신, JWT 클레임에서 이메일을 확인
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- auth.jwt()에서 이메일 추출 시도
    user_email := (auth.jwt() ->> 'email');
    
    -- 이메일이 없으면 auth.users에서 조회 (SECURITY DEFINER로 권한 부여)
    IF user_email IS NULL THEN
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = auth.uid();
    END IF;
    
    RETURN COALESCE(user_email, '') = 'cdhnaya@kakao.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Users 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 사용자 프로필 조회 가능
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles"
    ON users FOR SELECT
    USING (is_admin_user());

-- ============================================
-- User_books 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 사용자의 독서 목록 조회 가능
DROP POLICY IF EXISTS "Admins can view all user books" ON user_books;
CREATE POLICY "Admins can view all user books"
    ON user_books FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Notes 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 기록 조회 가능
DROP POLICY IF EXISTS "Admins can view all notes" ON notes;
CREATE POLICY "Admins can view all notes"
    ON notes FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Groups 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 그룹 조회 가능
DROP POLICY IF EXISTS "Admins can view all groups" ON groups;
CREATE POLICY "Admins can view all groups"
    ON groups FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Group_members 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 그룹 멤버십 조회 가능
DROP POLICY IF EXISTS "Admins can view all group members" ON group_members;
CREATE POLICY "Admins can view all group members"
    ON group_members FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Group_books 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 그룹 책 조회 가능
DROP POLICY IF EXISTS "Admins can view all group books" ON group_books;
CREATE POLICY "Admins can view all group books"
    ON group_books FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Group_notes 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 그룹 공유 기록 조회 가능
DROP POLICY IF EXISTS "Admins can view all group notes" ON group_notes;
CREATE POLICY "Admins can view all group notes"
    ON group_notes FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Group_shared_books 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 그룹 공유 책 조회 가능
DROP POLICY IF EXISTS "Admins can view all group shared books" ON group_shared_books;
CREATE POLICY "Admins can view all group shared books"
    ON group_shared_books FOR SELECT
    USING (is_admin_user());

-- ============================================
-- Transcriptions 테이블 관리자 정책
-- ============================================

-- 관리자는 모든 전사 데이터 조회 가능
DROP POLICY IF EXISTS "Admins can view all transcriptions" ON transcriptions;
CREATE POLICY "Admins can view all transcriptions"
    ON transcriptions FOR SELECT
    USING (is_admin_user());

