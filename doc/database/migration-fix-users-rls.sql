-- ============================================
-- Users 테이블 INSERT RLS 정책 추가
-- ============================================
-- 문제: users 테이블에 INSERT 정책이 없어서 프로필 생성 시 RLS 오류 발생
-- 해결: 사용자가 자신의 프로필만 생성할 수 있도록 INSERT 정책 추가
-- ============================================

-- Users 테이블에 INSERT 정책 추가
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 기존 정책 확인 (참고용)
-- SELECT 정책: "Users can view own profile" (이미 존재)
-- UPDATE 정책: "Users can update own profile" (이미 존재)
-- INSERT 정책: "Users can insert own profile" (새로 추가)

