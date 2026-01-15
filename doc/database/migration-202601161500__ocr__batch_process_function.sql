-- ============================================
-- 마이그레이션: OCR 배치 처리 함수 생성
-- 날짜: 2026-01-16 15:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. OCR 처리가 필요한 기록을 조회하는 함수 생성
-- 2. OCR 배치 처리 상태를 확인하는 함수 생성
--
-- 영향받는 테이블:
-- - notes
-- - transcriptions
--
-- 참고:
-- - 이 함수는 관리자용으로, OCR 배치 처리 시 사용됩니다
-- - 실제 OCR 처리는 애플리케이션 레벨에서 수행됩니다
-- ============================================

-- ============================================
-- OCR 처리가 필요한 기록 수 조회 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_ocr_count()
RETURNS TABLE(
    total_with_images BIGINT,
    needing_ocr BIGINT,
    processing_count BIGINT,
    completed_count BIGINT,
    failed_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH notes_with_images AS (
        SELECT id
        FROM notes
        WHERE image_url IS NOT NULL
          AND type IN ('photo', 'transcription')
    ),
    transcription_status AS (
        SELECT 
            t.note_id,
            t.status,
            CASE 
                WHEN t.status = 'processing' THEN 1
                ELSE 0
            END as is_processing,
            CASE 
                WHEN t.status = 'completed' THEN 1
                ELSE 0
            END as is_completed,
            CASE 
                WHEN t.status = 'failed' THEN 1
                ELSE 0
            END as is_failed
        FROM transcriptions t
        WHERE t.note_id IN (SELECT id FROM notes_with_images)
    ),
    notes_needing_ocr AS (
        SELECT n.id
        FROM notes_with_images n
        LEFT JOIN transcription_status t ON n.id = t.note_id
        WHERE t.note_id IS NULL OR t.status = 'failed'
    )
    SELECT 
        (SELECT COUNT(*) FROM notes_with_images)::BIGINT as total_with_images,
        (SELECT COUNT(*) FROM notes_needing_ocr)::BIGINT as needing_ocr,
        (SELECT COUNT(*) FROM transcription_status WHERE status = 'processing')::BIGINT as processing_count,
        (SELECT COUNT(*) FROM transcription_status WHERE status = 'completed')::BIGINT as completed_count,
        (SELECT COUNT(*) FROM transcription_status WHERE status = 'failed')::BIGINT as failed_count;
END;
$$;

-- ============================================
-- OCR 처리가 필요한 기록 목록 조회 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_ocr_notes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    note_id UUID,
    image_url TEXT,
    note_type TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as note_id,
        n.image_url,
        n.type::TEXT as note_type,
        n.user_id,
        n.created_at
    FROM notes n
    LEFT JOIN transcriptions t ON n.id = t.note_id
    WHERE n.image_url IS NOT NULL
      AND n.type IN ('photo', 'transcription')
      AND (t.note_id IS NULL OR t.status = 'failed')
    ORDER BY n.created_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================
-- 사용 예시:
-- ============================================

-- OCR 대기 기록 수 확인
-- SELECT * FROM get_pending_ocr_count();

-- OCR 처리가 필요한 기록 목록 조회 (최대 10개)
-- SELECT * FROM get_pending_ocr_notes(10);

-- ============================================
-- 참고:
-- - 이 함수들은 SECURITY DEFINER로 생성되어 RLS 정책을 우회합니다
-- - 관리자 권한이 필요합니다
-- - 실제 OCR 처리는 애플리케이션 레벨에서 /api/ocr 엔드포인트를 호출하여 수행됩니다
-- ============================================
