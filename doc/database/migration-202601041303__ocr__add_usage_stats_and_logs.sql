-- ============================================
-- 마이그레이션: OCR 사용 통계 및 로그 테이블 생성
-- 날짜: 2026-01-04 13:03
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. ocr_log_status ENUM 타입 생성
-- 2. ocr_usage_stats 테이블 생성 (사용자별 OCR 처리 통계)
-- 3. ocr_logs 테이블 생성 (OCR 처리 상세 로그)
-- 4. RLS 정책 설정 (관리자만 조회 가능)
--
-- 영향받는 테이블:
-- - ocr_usage_stats (신규)
-- - ocr_logs (신규)
--
-- 참고:
-- - 사용자는 자신의 통계/로그를 조회할 수 없음 (내부 로그용)
-- - 관리자만 전체 통계/로그 조회 가능
-- ============================================

-- 1. ocr_log_status ENUM 타입 생성
DO $$ BEGIN
    CREATE TYPE ocr_log_status AS ENUM ('success', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ocr_usage_stats 테이블 생성
CREATE TABLE IF NOT EXISTS ocr_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. ocr_logs 테이블 생성
CREATE TABLE IF NOT EXISTS ocr_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    status ocr_log_status NOT NULL,
    error_message TEXT,
    processing_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ocr_usage_stats_user_id ON ocr_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_id ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_note_id ON ocr_logs(note_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_status ON ocr_logs(status);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_created_at ON ocr_logs(created_at DESC);

-- 5. RLS 활성화
ALTER TABLE ocr_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

-- 6. ocr_usage_stats RLS 정책
-- SELECT: 관리자만 조회 가능
DROP POLICY IF EXISTS "Admins can view OCR usage stats" ON ocr_usage_stats;
CREATE POLICY "Admins can view OCR usage stats"
    ON ocr_usage_stats FOR SELECT
    USING (is_admin_user());

-- INSERT/UPDATE: RLS 정책 없음 (서버 액션에서 직접 처리)
-- 사용자는 자신의 통계를 조회할 수 없으므로 INSERT/UPDATE 정책도 불필요
-- 서버 액션에서 직접 처리하되, 관리자 권한 체크는 애플리케이션 레벨에서 수행

-- 7. ocr_logs RLS 정책
-- SELECT: 관리자만 조회 가능
DROP POLICY IF EXISTS "Admins can view OCR logs" ON ocr_logs;
CREATE POLICY "Admins can view OCR logs"
    ON ocr_logs FOR SELECT
    USING (is_admin_user());

-- INSERT: RLS 정책 없음 (서버 액션에서 직접 처리)
-- UPDATE: 없음 (로그는 수정 불가)
-- DELETE: 없음 (로그는 삭제 불가, 사용자 삭제 시 CASCADE로 자동 삭제)

-- 8. updated_at 자동 업데이트 트리거 함수 (ocr_usage_stats용)
CREATE OR REPLACE FUNCTION update_ocr_usage_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_ocr_usage_stats_updated_at ON ocr_usage_stats;
CREATE TRIGGER update_ocr_usage_stats_updated_at
    BEFORE UPDATE ON ocr_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_ocr_usage_stats_updated_at();

