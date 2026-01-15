-- ============================================
-- 마이그레이션: books 테이블에 description_summary 컬럼 추가
-- 날짜: 2026-01-15 13:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. books 테이블에 description_summary 컬럼 추가
--    - Naver API에서 가져온 책소개를 Gemini API로 요약한 20자 내외 텍스트
--    - VARCHAR(50): 20자 내외 요약 + 여유 공간
--
-- 영향받는 테이블:
-- - books
--
-- 참고:
-- - summary 컬럼과는 별개 (summary는 출판사 제공 또는 사용자 기록)
-- - description_summary는 Naver API + Gemini API로 자동 생성
-- ============================================

-- books 테이블에 description_summary 컬럼 추가
ALTER TABLE books
ADD COLUMN IF NOT EXISTS description_summary VARCHAR(50);

-- 인덱스는 불필요 (짧은 텍스트이고 검색 대상이 아님)

-- ============================================
-- 참고:
-- - description_summary는 Naver API에서 가져온 책소개를
--   Gemini API로 요약한 20자 내외 텍스트입니다.
-- - NULL 허용 (책소개가 없거나 요약 실패 시)
-- ============================================
