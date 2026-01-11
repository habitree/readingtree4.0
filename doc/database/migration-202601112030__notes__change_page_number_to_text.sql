-- ============================================
-- 마이그레이션: notes - page_number 타입 변경
-- 날짜: 2026-01-11 20:30
-- 작성자: System
-- ============================================
-- 
-- 변경 사항:
-- 1. notes 테이블의 page_number 컬럼을 INTEGER에서 TEXT로 변경
-- 2. 기존 INTEGER 값들을 TEXT로 변환하여 유지
--
-- 이유:
-- - 페이지 범위 입력 지원 (예: "10-20")
-- - 여러 페이지 입력 지원 (예: "10, 15, 20")
-- - 줄바꿈을 통한 추가 설명 지원
--
-- 영향받는 테이블:
-- - notes
--
-- ============================================

-- 1. notes 테이블의 page_number 컬럼 타입 변경
-- INTEGER → TEXT로 변경 (기존 데이터 자동 변환)
ALTER TABLE notes 
ALTER COLUMN page_number TYPE TEXT 
USING page_number::TEXT;

-- 2. 인덱스는 그대로 유지 (TEXT 타입에서도 인덱스 사용 가능)
-- idx_notes_page_number는 이미 존재하므로 재생성 불필요
