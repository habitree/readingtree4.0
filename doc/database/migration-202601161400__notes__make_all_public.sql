-- ============================================
-- 마이그레이션: notes - 모든 기록을 공개로 일괄 변경
-- 날짜: 2026-01-16 14:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. notes 테이블의 모든 기록(is_public = FALSE)을 공개(is_public = TRUE)로 변경
-- 2. 샘플 데이터는 제외 (is_sample = TRUE인 경우는 변경하지 않음)
--
-- 영향받는 테이블:
-- - notes
--
-- 주의사항:
-- - 이 마이그레이션은 모든 사용자의 기록을 공개로 변경합니다.
-- - 실행 전에 백업을 권장합니다.
-- - SECURITY DEFINER 함수를 사용하여 RLS 정책을 우회합니다.
-- ============================================

-- ============================================
-- 1단계: 함수 생성 (SECURITY DEFINER로 RLS 우회)
-- ============================================

-- 관리자가 모든 기록을 공개로 변경하는 함수 생성
CREATE OR REPLACE FUNCTION admin_update_all_notes_public()
RETURNS TABLE(updated_count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count BIGINT;
BEGIN
    -- 모든 기록을 공개로 변경 (샘플 데이터 제외)
    WITH updated AS (
        UPDATE notes
        SET 
            is_public = TRUE,   
            updated_at = NOW()
        WHERE 
            is_public = FALSE 
            AND (is_sample IS NULL OR is_sample = FALSE)
        RETURNING id
    )
    SELECT COUNT(*) INTO result_count FROM updated;
    
    RETURN QUERY SELECT result_count;
END;
$$;

-- ============================================
-- 2단계: 함수 실행하여 모든 기록을 공개로 변경
-- ============================================

-- 함수 실행
SELECT * FROM admin_update_all_notes_public();

-- ============================================
-- 3단계: 결과 확인 (선택사항)
-- ============================================

-- 변경된 기록 수 확인
SELECT 
    COUNT(*) as total_public_notes,
    COUNT(*) FILTER (WHERE is_sample = FALSE OR is_sample IS NULL) as user_public_notes,
    COUNT(*) FILTER (WHERE is_sample = TRUE) as sample_notes
FROM notes
WHERE is_public = TRUE;

-- ============================================
-- 참고:
-- - 이 마이그레이션은 idempotent합니다 (여러 번 실행해도 안전)
-- - 함수는 한 번 생성하면 재사용 가능합니다
-- - 실행 후에는 모든 기록이 공개 상태가 됩니다
-- - 개별 기록의 공개 설정을 변경하려면 사용자가 직접 변경해야 합니다
-- ============================================
