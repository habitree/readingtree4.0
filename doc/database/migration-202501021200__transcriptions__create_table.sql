-- ============================================
-- 마이그레이션: transcriptions 테이블 생성
-- 날짜: 2025-01-02 12:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. 필사 OCR 데이터를 별도 테이블로 관리
-- 2. OCR로 추출된 텍스트와 사용자가 편집한 구절/생각을 분리 관리
--
-- 영향받는 테이블:
-- - transcriptions (신규)
-- - notes (외래 키 참조)
--
-- 참고:
-- - 필사 등록 시 OCR 결과를 이 테이블에 저장
-- - 사용자가 구절과 생각을 추가/수정할 수 있음
-- ============================================

-- OCR 처리 상태 ENUM 타입 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ocr_status') THEN
        CREATE TYPE ocr_status AS ENUM ('processing', 'completed', 'failed');
    END IF;
END $$;

-- Transcriptions 테이블 생성
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL, -- OCR로 추출된 원본 텍스트
    quote_content TEXT, -- 책 구절 (사용자가 편집 가능)
    memo_content TEXT, -- 사용자의 생각 (사용자가 추가 가능)
    status ocr_status DEFAULT 'processing' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- note_id는 하나의 transcription만 가질 수 있음
    CONSTRAINT unique_note_transcription UNIQUE (note_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transcriptions_note_id ON transcriptions(note_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- RLS 활성화
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- SELECT: 자신의 기록에 대한 transcription만 조회 가능
DROP POLICY IF EXISTS "Users can view own transcriptions" ON transcriptions;
CREATE POLICY "Users can view own transcriptions"
    ON transcriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- INSERT: 자신의 기록에 대한 transcription만 생성 가능
DROP POLICY IF EXISTS "Users can insert own transcriptions" ON transcriptions;
CREATE POLICY "Users can insert own transcriptions"
    ON transcriptions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- UPDATE: 자신의 기록에 대한 transcription만 수정 가능
DROP POLICY IF EXISTS "Users can update own transcriptions" ON transcriptions;
CREATE POLICY "Users can update own transcriptions"
    ON transcriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- DELETE: 자신의 기록에 대한 transcription만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own transcriptions" ON transcriptions;
CREATE POLICY "Users can delete own transcriptions"
    ON transcriptions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_transcriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_transcriptions_updated_at_trigger ON transcriptions;
CREATE TRIGGER update_transcriptions_updated_at_trigger
    BEFORE UPDATE ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_transcriptions_updated_at();

