-- ============================================
-- Habitree Reading Hub - 데이터베이스 스키마
-- ============================================
-- 
-- 적용 순서:
-- 1. 이 파일 전체를 Supabase SQL Editor에서 실행 (권장)
-- 2. 또는 섹션별로 순차 실행
--
-- 중요 사항:
-- - 테이블 생성 순서가 중요합니다 (외래 키 의존성)
-- - groups 테이블의 RLS 정책은 group_members 테이블 생성 후 업데이트됩니다
-- - 오류 발생 시 전체 파일을 다시 실행하세요
--
-- 참고: software_design.md의 4.2, 4.3 섹션 참고
-- ============================================

-- ============================================
-- 1. 확장 활성화
-- ============================================

-- UUID 생성 함수를 위한 확장 (Supabase에서 기본 제공되지만 명시적으로 활성화)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. ENUM 타입 정의
-- ============================================

-- 독서 상태
CREATE TYPE reading_status AS ENUM ('reading', 'completed', 'paused');

-- 기록 유형
CREATE TYPE note_type AS ENUM ('quote', 'photo', 'memo', 'transcription');

-- 모임 멤버 역할
CREATE TYPE member_role AS ENUM ('leader', 'member');

-- 모임 멤버 상태
CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- 3. 테이블 생성
-- ============================================

-- 3.1 Users (사용자 프로필)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255), -- auth.users에서 자동 동기화
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    reading_goal INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- 3.2 Books (책)
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(20), -- UNIQUE 제약조건 제거: 여러 사용자가 같은 책을 추가할 수 있도록 함
    title VARCHAR(500) NOT NULL,
    author VARCHAR(200),
    publisher VARCHAR(200),
    published_date DATE,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL; -- NULL이 아닌 ISBN만 인덱싱
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);

-- 전체 텍스트 검색 인덱스
CREATE INDEX idx_books_title_fts ON books USING gin(to_tsvector('simple', title));
CREATE INDEX idx_books_author_fts ON books USING gin(to_tsvector('simple', author));

-- 3.3 UserBooks (사용자-책 관계)
CREATE TABLE user_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status reading_status DEFAULT 'reading',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- 인덱스
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_book_id ON user_books(book_id);
CREATE INDEX idx_user_books_status ON user_books(status);

-- RLS
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
    ON user_books FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
    ON user_books FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
    ON user_books FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
    ON user_books FOR DELETE
    USING (auth.uid() = user_id);

-- 3.4 Notes (기록)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    type note_type NOT NULL,
    content TEXT,
    image_url TEXT,
    page_number INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_book_id ON notes(book_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_page_number ON notes(page_number);

-- 전체 텍스트 검색 인덱스
CREATE INDEX idx_notes_content_fts ON notes USING gin(to_tsvector('simple', content));

-- 태그 인덱스
CREATE INDEX idx_notes_tags ON notes USING gin(tags);

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- 3.5 Groups (독서모임)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_groups_leader_id ON groups(leader_id);
CREATE INDEX idx_groups_is_public ON groups(is_public);

-- RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 주의: group_members 테이블이 아직 생성되지 않았으므로, 
-- SELECT 정책은 group_members 테이블 생성 후에 업데이트됩니다.
-- 먼저 공개 그룹만 볼 수 있도록 기본 정책 생성
CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update groups"
    ON groups FOR UPDATE
    USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete groups"
    ON groups FOR DELETE
    USING (auth.uid() = leader_id);

-- 3.6 GroupMembers (모임 멤버)
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    status member_status DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 인덱스
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);

-- RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM group_members WHERE group_id = group_members.group_id
    ));

CREATE POLICY "Users can request to join"
    ON group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can manage members"
    ON group_members FOR UPDATE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_members.group_id
    ));

-- ============================================
-- 3.6.1 Groups 테이블 RLS 정책 업데이트
-- ============================================
-- group_members 테이블이 생성되었으므로, groups 테이블의 SELECT 정책을 업데이트
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (is_public = TRUE OR auth.uid() IN (
        SELECT user_id FROM group_members WHERE group_id = groups.id
    ));

-- 3.7 GroupBooks (모임 책)
CREATE TABLE group_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, book_id)
);

-- 인덱스
CREATE INDEX idx_group_books_group_id ON group_books(group_id);
CREATE INDEX idx_group_books_book_id ON group_books(book_id);

-- RLS
ALTER TABLE group_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group books"
    ON group_books FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM group_members WHERE group_id = group_books.group_id
    ));

CREATE POLICY "Leaders can add group books"
    ON group_books FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

-- 3.8 GroupNotes (모임 내 공유 기록)
CREATE TABLE group_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, note_id)
);

-- 인덱스
CREATE INDEX idx_group_notes_group_id ON group_notes(group_id);
CREATE INDEX idx_group_notes_note_id ON group_notes(note_id);

-- RLS
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view shared notes"
    ON group_notes FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM group_members WHERE group_id = group_notes.group_id
    ));

CREATE POLICY "Note owners can share to groups"
    ON group_notes FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM notes WHERE id = group_notes.note_id
    ));

-- ============================================
-- 4. 데이터베이스 함수 생성
-- ============================================

-- 4.1 Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 독서 통계 함수
-- 사용자의 올해 완독 책 수 조회
CREATE OR REPLACE FUNCTION get_user_completed_books_count(
    p_user_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM user_books
        WHERE user_id = p_user_id
            AND status = 'completed'
            AND EXTRACT(YEAR FROM completed_at) = p_year
    );
END;
$$ LANGUAGE plpgsql;

-- 사용자의 이번 주 작성한 기록 수
CREATE OR REPLACE FUNCTION get_user_notes_count_this_week(
    p_user_id UUID
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notes
        WHERE user_id = p_user_id
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 트리거 생성
-- ============================================

-- 5.1 Updated_at 자동 업데이트 트리거
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
    BEFORE UPDATE ON user_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5.2 사용자 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 스키마 적용 완료
-- ============================================
-- 
-- 다음 단계:
-- 1. Storage 버킷 생성 (doc/database/README.md 참고)
-- 2. Storage RLS 정책 설정 (doc/database/README.md 참고)
-- 3. 검증 체크리스트 확인 (00-bkend-database-schema-plan.md 참고)
-- ============================================

