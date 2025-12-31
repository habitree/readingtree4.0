# OCR 상태 확인 SQL 쿼리

## 특정 Note ID의 Transcription 상태 확인

다음 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요:

```sql
-- Note ID: 5bc6d5c8-1f7a-4a31-a934-b810e7a1c230
SELECT 
  t.id,
  t.note_id,
  t.status,           -- 'processing' | 'completed' | 'failed'
  LENGTH(t.extracted_text) as extracted_text_length,
  LEFT(t.extracted_text, 100) as extracted_text_preview,
  LENGTH(t.quote_content) as quote_content_length,
  LENGTH(t.memo_content) as memo_content_length,
  t.created_at,
  t.updated_at,
  EXTRACT(EPOCH FROM (NOW() - t.created_at)) as seconds_since_created
FROM transcriptions t
WHERE t.note_id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230';
```

## 최근 Transcription 상태 확인

```sql
-- 최근 생성된 transcription 중 processing 상태인 것들
SELECT 
  t.id,
  t.note_id,
  t.status,
  LENGTH(t.extracted_text) as extracted_text_length,
  n.type as note_type,
  n.image_url,
  t.created_at,
  t.updated_at,
  EXTRACT(EPOCH FROM (NOW() - t.created_at)) as seconds_since_created
FROM transcriptions t
JOIN notes n ON n.id = t.note_id
WHERE t.note_id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230'
ORDER BY t.created_at DESC;
```

## 상태별 확인

### Processing 상태 (처리 중)
```sql
SELECT 
  t.note_id,
  t.status,
  t.created_at,
  EXTRACT(EPOCH FROM (NOW() - t.created_at)) as seconds_since_created
FROM transcriptions t
WHERE t.note_id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230'
  AND t.status = 'processing';
```

### Completed 상태 (완료)
```sql
SELECT 
  t.note_id,
  t.status,
  LENGTH(t.extracted_text) as extracted_text_length,
  LEFT(t.extracted_text, 200) as extracted_text_preview,
  t.created_at,
  t.updated_at
FROM transcriptions t
WHERE t.note_id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230'
  AND t.status = 'completed';
```

### Failed 상태 (실패)
```sql
SELECT 
  t.note_id,
  t.status,
  t.created_at,
  t.updated_at
FROM transcriptions t
WHERE t.note_id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230'
  AND t.status = 'failed';
```

## Transcription이 없는 경우

```sql
-- Note는 있지만 transcription이 없는 경우
SELECT 
  n.id as note_id,
  n.type,
  n.image_url,
  n.created_at
FROM notes n
WHERE n.id = '5bc6d5c8-1f7a-4a31-a934-b810e7a1c230'
  AND n.type = 'transcription'
  AND n.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transcriptions t WHERE t.note_id = n.id
  );
```

