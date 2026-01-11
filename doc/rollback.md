# 롤백 이력 (Rollback History)

## 2026.01.11 20:00 - 4c03f47 커밋으로 롤백

### 롤백 정보
- **롤백 날짜**: 2026년 1월 11일 20:00
- **롤백 대상 커밋**: `4c03f47f1f066d2345fe90adc8782de0fd94754d` (mobile)
- **롤백 방식**: `git reset --hard 4c03f47`

### 롤백된 커밋 목록
1. `271ba02` - share_rebuild
2. `b90f12f` - share_rebuild
3. `f1c0d02` - share_rebuild
4. `8f1c559` - mobile

### 롤백된 주요 작업 내용
1. **서버 사이드 카드 이미지 생성 기능**
   - `app/api/card-image/[id]/route.tsx` 파일 삭제
   - `@vercel/og` 패키지를 사용한 서버 사이드 이미지 생성
   - 1920×1120 고해상도 이미지 생성
   - Habitree 로고 및 아이콘 적용
   - 책 정보 파싱 (제목/부제 분리)

2. **링크 공유 기능 수정**
   - `components/share/simple-share-dialog.tsx` 수정 취소
   - Web Share API 제거
   - 링크만 클립보드에 복사하는 기능

3. **이미지 방향 수정**
   - 이미지 비율 유지 및 중앙 정렬 로직

### 삭제된 문서 파일
- `doc/question/mobile_card_copy_debugging.md`
- `doc/question/eruda_integration_guide.md`
- `doc/question/mobile_card_copy_solution.md`
- `doc/question/mobile_card_sharing_alternatives.md`
- `doc/question/mobile_share_implementation_complete.md`
- `doc/question/server_card_image_implementation.md`
- `doc/question/server_card_image_complete.md`

### 롤백 이유
- 사용자 요청에 따른 이전 시점으로의 복구

### 현재 상태
- **HEAD**: `4c03f47 mobile`
- **작업 디렉토리**: Clean (변경사항 없음)
- **브랜치**: `main` (원격보다 4커밋 뒤)

### 참고 사항
- 원격 저장소에 반영하려면: `git push origin main --force` 실행 필요
- 롤백된 작업이 필요한 경우 `271ba02` 커밋에서 복구 가능

---