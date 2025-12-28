-- ============================================
-- 마이그레이션: RLS - 누락된 정책 추가
-- 날짜: 2025-12-28 22:21
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. users 테이블에 DELETE 정책 추가
-- 2. group_members 테이블에 DELETE 정책 추가
-- 3. group_books 테이블에 UPDATE/DELETE 정책 추가
-- 4. group_notes 테이블에 DELETE 정책 추가
--
-- 영향받는 테이블:
-- - users
-- - group_members
-- - group_books
-- - group_notes
--
-- 참고:
-- - DB/RLS 규칙 완전 준수를 위한 누락된 정책 추가
-- - 모든 정책은 Idempotent하게 작성됨 (DROP IF EXISTS 사용)
-- ============================================

-- 1. users 테이블 DELETE 정책 추가
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
CREATE POLICY "Users can delete own profile"
    ON users FOR DELETE
    USING (auth.uid() = id);

-- 2. group_members 테이블 DELETE 정책 추가
DROP POLICY IF EXISTS "Leaders can remove members" ON group_members;
CREATE POLICY "Leaders can remove members"
    ON group_members FOR DELETE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_members.group_id
    ));

-- 3. group_books 테이블 UPDATE/DELETE 정책 추가
DROP POLICY IF EXISTS "Leaders can update group books" ON group_books;
CREATE POLICY "Leaders can update group books"
    ON group_books FOR UPDATE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

DROP POLICY IF EXISTS "Leaders can remove group books" ON group_books;
CREATE POLICY "Leaders can remove group books"
    ON group_books FOR DELETE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

-- 4. group_notes 테이블 DELETE 정책 추가
DROP POLICY IF EXISTS "Note owners can unshare from groups" ON group_notes;
CREATE POLICY "Note owners can unshare from groups"
    ON group_notes FOR DELETE
    USING (auth.uid() IN (
        SELECT user_id FROM notes WHERE id = group_notes.note_id
    ));

