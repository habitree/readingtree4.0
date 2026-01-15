-- ============================================
-- 마이그레이션: OCR 통계/로그 테이블 INSERT/UPDATE RLS 정책 추가
-- 날짜: 2026-01-15 12:27
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. ocr_usage_stats 테이블에 INSERT/UPDATE RLS 정책 추가
-- 2. ocr_logs 테이블에 INSERT RLS 정책 추가
--
-- 영향받는 테이블:
-- - ocr_usage_stats
-- - ocr_logs
--
-- 문제:
-- - RLS가 활성화되어 있지만 INSERT/UPDATE 정책이 없어서
--   서버 액션에서 통계/로그 기록 시 RLS 정책 위반 오류 발생
--   (42501: new row violates row-level security policy)
--
-- 해결:
-- - 사용자가 자신의 통계/로그를 INSERT/UPDATE할 수 있도록 정책 추가
-- - user_id = auth.uid() 패턴 사용
-- ============================================

-- ============================================
-- ocr_usage_stats 테이블 INSERT/UPDATE 정책
-- ============================================

-- INSERT: 사용자가 자신의 통계를 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert own OCR usage stats" ON ocr_usage_stats;
CREATE POLICY "Users can insert own OCR usage stats"
    ON ocr_usage_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 사용자가 자신의 통계를 수정할 수 있음
DROP POLICY IF EXISTS "Users can update own OCR usage stats" ON ocr_usage_stats;
CREATE POLICY "Users can update own OCR usage stats"
    ON ocr_usage_stats FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ocr_logs 테이블 INSERT 정책
-- ============================================

-- INSERT: 사용자가 자신의 로그를 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert own OCR logs" ON ocr_logs;
CREATE POLICY "Users can insert own OCR logs"
    ON ocr_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 참고:
-- - SELECT 정책은 기존 정책 유지 (관리자만 조회 가능)
-- - DELETE 정책은 불필요 (CASCADE로 자동 삭제)
-- ============================================
