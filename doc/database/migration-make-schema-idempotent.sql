-- ============================================
-- 스키마를 Idempotent하게 만들기
-- ============================================
-- 이 파일은 schema.sql의 모든 CREATE POLICY 문 앞에
-- DROP POLICY IF EXISTS를 추가하는 마이그레이션입니다.
-- ============================================

-- UserBooks 정책
DROP POLICY IF EXISTS "Users can view own books" ON user_books;
DROP POLICY IF EXISTS "Users can view own books or sample books" ON user_books;
DROP POLICY IF EXISTS "Users can insert own books" ON user_books;
DROP POLICY IF EXISTS "Users can update own books" ON user_books;
DROP POLICY IF EXISTS "Users can delete own books" ON user_books;

-- Notes 정책
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own notes or public/sample notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Groups 정책
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Leaders can update groups" ON groups;
DROP POLICY IF EXISTS "Leaders can delete groups" ON groups;

-- GroupMembers 정책
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can request to join" ON group_members;
DROP POLICY IF EXISTS "Leaders can manage members" ON group_members;

-- GroupBooks 정책
DROP POLICY IF EXISTS "Members can view group books" ON group_books;
DROP POLICY IF EXISTS "Leaders can add group books" ON group_books;

-- GroupNotes 정책
DROP POLICY IF EXISTS "Members can view shared notes" ON group_notes;
DROP POLICY IF EXISTS "Note owners can share to groups" ON group_notes;

-- 참고: 이 마이그레이션을 실행한 후 schema.sql을 다시 실행하면
-- 모든 정책이 올바르게 재생성됩니다.

