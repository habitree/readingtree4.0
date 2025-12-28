-- ============================================
-- 마이그레이션: users - 약관 동의 필드 추가
-- 날짜: 2025-12-28 22:33
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. users 테이블에 약관 동의 관련 필드 추가
--    - terms_agreed: 이용약관 동의 여부
--    - privacy_agreed: 개인정보처리방침 동의 여부
--    - consent_date: 동의 일시
--
-- 영향받는 테이블:
-- - users
--
-- 참고:
-- - 약관 동의 페이지 구현을 위한 필수 필드
-- - 기존 사용자는 모두 FALSE로 설정됨 (다음 로그인 시 동의 페이지로 리다이렉트)
-- ============================================

-- 약관 동의 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE;

-- 기존 사용자에 대한 주석 (기본값 FALSE로 설정됨)
COMMENT ON COLUMN users.terms_agreed IS '이용약관 동의 여부';
COMMENT ON COLUMN users.privacy_agreed IS '개인정보처리방침 동의 여부';
COMMENT ON COLUMN users.consent_date IS '약관 동의 일시';

