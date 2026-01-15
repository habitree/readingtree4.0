# 노션 → Supabase 마이그레이션 가이드

## 개요

노션의 독서 리스트 데이터를 Supabase 데이터베이스로 마이그레이션하는 스크립트입니다.

## 사전 준비

### 1. 환경 변수 설정

`.env.local` 파일에 다음 변수들이 설정되어 있어야 합니다:

```env
# Notion API
NOTION_API_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 권장

# 사용자 정보 (선택사항)
USER_EMAIL=cdhnaya@kakao.com
USER_ID=your_user_uuid  # 직접 설정 시 이메일 조회 생략
```

### 2. 사용자 ID 확인 방법

**방법 1: USER_ID 환경 변수 직접 설정 (권장)**

Supabase 대시보드에서 사용자 ID를 확인:
1. Supabase 대시보드 → Authentication → Users
2. 해당 이메일 사용자 찾기
3. User UID 복사
4. `.env.local`에 추가: `USER_ID=복사한_uuid`

**방법 2: SUPABASE_SERVICE_ROLE_KEY 사용**

Service Role Key를 사용하면 RLS를 우회하여 사용자를 조회할 수 있습니다:
1. Supabase 대시보드 → Settings → API
2. `service_role` key 복사
3. `.env.local`에 추가: `SUPABASE_SERVICE_ROLE_KEY=복사한_key`

## 실행 방법

```bash
node scripts/migrate-notion-to-supabase.js
```

## 마이그레이션 내용

### 1. 책 정보 (books 테이블)

노션 Properties에서 추출:
- `제목` → `title`
- `저자` → `author`
- `출판사` → `publisher`
- `ISBN` → `isbn`
- `책소개` → `summary`
- `네이버 링크` → `external_link`
- `img` → `cover_image_url`
- `유형` → `category`
- `페이지 수` → `total_pages`

### 2. 사용자-책 관계 (user_books 테이블)

- `독서상태` → `status` (매핑: 읽기전→not_started, 읽는중→reading, 완독→completed, 재독→rereading, 멈춤→paused)
- `책읽는 이유` → `reading_reason`
- `읽는 책종류` → `book_format`

### 3. 기록 (notes 테이블)

노션 페이지 본문의 이미지-텍스트 쌍:
- **필사정보 (이미지)**: `type='transcription'`, `image_url`에 이미지 URL 저장
- **내생각정보 (텍스트)**: `type='memo'`, `content`에 텍스트 저장

## 테스트 실행

현재 "죽음의 수용소에서" 책 1개만 테스트로 마이그레이션합니다.

## 문제 해결

### 오류: "Invalid API key"
- `SUPABASE_SERVICE_ROLE_KEY`를 설정하거나
- `USER_ID`를 직접 설정하세요

### 오류: "사용자를 찾을 수 없습니다"
- `USER_ID` 환경 변수를 직접 설정하거나
- Supabase 대시보드에서 사용자 이메일이 올바른지 확인하세요
