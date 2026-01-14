#!/usr/bin/env node
/**
 * 노션 마이그레이션 데이터 정리 및 업데이트 스크립트
 * 
 * 1. 중복 이미지 제거 (같은 image_url 또는 같은 created_at)
 * 2. 노션 등록일자를 시작일자로 업데이트
 * 3. 노션 독서상태 업데이트 (탐독과 재독 모두 rereading)
 * 4. 완료인 책의 마지막 이미지 일자를 완독일자로 설정
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경 변수 로드
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    }
  }
}

loadEnvFile();

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const NOTION_API_BASE = 'api.notion.com';
const NOTION_VERSION = '2022-06-28';

if (!NOTION_API_TOKEN) {
  console.error('❌ NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화
let supabaseClient = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (error) {
  console.error('❌ @supabase/supabase-js 로드 실패:', error.message);
  process.exit(1);
}

/**
 * Notion API 요청 헬퍼 함수
 */
function notionRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: NOTION_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message} - ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 페이지 정보 가져오기
 */
async function getNotionPage(pageId) {
  return notionRequest('GET', `/v1/pages/${pageId}`);
}

/**
 * 노션 데이터베이스에서 모든 페이지(책) 가져오기
 */
async function getAllNotionBooks(databaseId) {
  const allPages = [];
  let startCursor = null;

  while (true) {
    const path = `/v1/databases/${databaseId}/query`;
    const requestBody = startCursor ? { start_cursor: startCursor } : {};

    const response = await notionRequest('POST', path, requestBody);
    allPages.push(...response.results);

    if (!response.has_more) {
      break;
    }

    startCursor = response.next_cursor;
  }

  return allPages;
}

/**
 * Properties에서 텍스트 값 추출
 */
function getPropertyText(properties, key) {
  const prop = properties[key];
  if (!prop) {
    return null;
  }
  
  // status 타입 처리 (독서상태 등)
  if (prop.type === 'status' && prop.status) {
    return prop.status.name;
  }
  
  // select 타입 처리
  if (prop.type === 'select' && prop.select) {
    return prop.select.name;
  }
  
  // title 타입 처리
  if (prop.type === 'title' && prop.title) {
    return prop.title.map(item => item.plain_text).join('');
  }
  
  // rich_text 타입 처리
  if (prop.type === 'rich_text' && prop.rich_text) {
    return prop.rich_text.map(item => item.plain_text).join('');
  }
  
  // url 타입 처리
  if (prop.type === 'url' && prop.url) {
    return prop.url;
  }
  
  // number 타입 처리
  if (prop.type === 'number' && prop.number !== null) {
    return prop.number;
  }
  
  return null;
}

/**
 * 노션 독서상태를 시스템 독서상태로 변환
 * 
 * 매핑 규칙:
 * - 완독 → completed
 * - 읽는중 → reading
 * - 읽기전 → not_started
 * - 멈춤 → paused
 * - 필사중 → reading
 * - 탐독 → rereading (재독과 동일)
 * - 재독 → rereading
 */
function mapReadingStatus(notionStatus) {
  if (!notionStatus) {
    return 'reading'; // 기본값
  }
  
  const statusMap = {
    '읽기전': 'not_started',
    '읽는중': 'reading',
    '완독': 'completed',
    '재독': 'rereading',
    '멈춤': 'paused',
    '탐독': 'rereading', // 탐독도 재독으로 처리
    '필사중': 'reading',
  };
  
  const mappedStatus = statusMap[notionStatus.trim()];
  
  if (!mappedStatus) {
    console.log(`   ⚠️  알 수 없는 독서상태: "${notionStatus}" → 기본값(reading) 사용`);
    return 'reading';
  }
  
  return mappedStatus;
}

/**
 * 중복 이미지 제거 (같은 image_url 또는 같은 created_at)
 */
async function removeDuplicateNotes(userId) {
  console.log('\n1️⃣ 중복 이미지 제거 중...');
  
  // 모든 transcription 타입 notes 가져오기
  const { data: allNotes, error: fetchError } = await supabaseClient
    .from('notes')
    .select('id, book_id, image_url, created_at, user_id')
    .eq('user_id', userId)
    .eq('type', 'transcription')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    throw new Error(`기록 조회 실패: ${fetchError.message}`);
  }
  
  if (!allNotes || allNotes.length === 0) {
    console.log('   📝 기록이 없습니다.');
    return;
  }
  
  console.log(`   📝 총 ${allNotes.length}개 기록 발견`);
  
  // 중복 찾기: 같은 book_id 내에서
  // 1) 같은 image_url
  // 2) 같은 created_at (같은 날짜 같은 시간)
  
  const duplicatesToDelete = new Set();
  const seenImageUrls = new Map(); // book_id -> image_url -> note_id
  const seenCreatedAts = new Map(); // book_id -> created_at -> note_id
  
  for (const note of allNotes) {
    const bookId = note.book_id;
    const imageUrl = note.image_url;
    const createdAt = note.created_at;
    
    // 같은 image_url 체크
    if (imageUrl) {
      const key = `${bookId}:${imageUrl}`;
      if (seenImageUrls.has(key)) {
        // 중복 발견: 나중에 생성된 것 삭제
        duplicatesToDelete.add(note.id);
        console.log(`   🔍 중복 이미지 URL 발견: ${imageUrl.substring(0, 60)}... (삭제: ${note.id})`);
        continue;
      }
      seenImageUrls.set(key, note.id);
    }
    
    // 같은 created_at 체크 (같은 날짜 같은 시간)
    if (createdAt) {
      const key = `${bookId}:${createdAt}`;
      if (seenCreatedAts.has(key)) {
        // 중복 발견: 나중에 생성된 것 삭제
        duplicatesToDelete.add(note.id);
        console.log(`   🔍 중복 생성일자 발견: ${createdAt} (삭제: ${note.id})`);
        continue;
      }
      seenCreatedAts.set(key, note.id);
    }
  }
  
  if (duplicatesToDelete.size === 0) {
    console.log('   ✅ 중복 기록이 없습니다.');
    return;
  }
  
  console.log(`   🗑️  ${duplicatesToDelete.size}개 중복 기록 삭제 중...`);
  
  // 중복 기록 삭제
  const duplicateIds = Array.from(duplicatesToDelete);
  const { error: deleteError } = await supabaseClient
    .from('notes')
    .delete()
    .in('id', duplicateIds);
  
  if (deleteError) {
    throw new Error(`중복 기록 삭제 실패: ${deleteError.message}`);
  }
  
  console.log(`   ✅ ${duplicateIds.length}개 중복 기록 삭제 완료`);
}

/**
 * 노션 등록일자와 독서상태로 user_books 업데이트
 */
async function updateUserBooksFromNotion(userId, notionDatabaseId) {
  console.log('\n2️⃣ 노션 데이터로 user_books 업데이트 중...');
  
  // 노션에서 모든 책 가져오기
  const notionPages = await getAllNotionBooks(notionDatabaseId);
  console.log(`   📚 노션에서 ${notionPages.length}개 책 발견`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  // 테스트 모드: 5개 책만 처리 (false로 변경하면 전체 처리)
  const TEST_MODE = false;
  const TEST_LIMIT = 5;
  const testPages = TEST_MODE ? notionPages.slice(0, TEST_LIMIT) : notionPages;
  
  if (TEST_MODE) {
    console.log(`\n   🔍 테스트 모드: ${TEST_LIMIT}개 책만 처리`);
  } else {
    console.log(`\n   🔄 전체 업데이트 모드: ${notionPages.length}개 책 처리`);
  }
  
  for (let i = 0; i < testPages.length; i++) {
    const page = testPages[i];
    try {
      const properties = page.properties;
      const bookTitle = getPropertyText(properties, '제목') || '제목 없음';
      const isbn = getPropertyText(properties, 'ISBN');
      
      const notionStatus = getPropertyText(properties, '독서상태');
      console.log(`\n   📋 [${i + 1}/${testPages.length}] "${bookTitle}"`);
      console.log(`   📖 노션 독서상태: "${notionStatus || '(없음)'}"`);
      
      const pageCreatedAt = page.created_time || page.last_edited_time;
      
      // ISBN으로 책 찾기
      if (!isbn) {
        console.log(`   ⚠️  "${bookTitle}": ISBN 없음, 건너뜀`);
        continue;
      }
      
      const { data: book } = await supabaseClient
        .from('books')
        .select('id')
        .eq('isbn', isbn)
        .maybeSingle();
      
      if (!book) {
        console.log(`   ⚠️  "${bookTitle}": Supabase에 책 없음, 건너뜀`);
        continue;
      }
      
      // user_books 찾기
      const { data: userBook } = await supabaseClient
        .from('user_books')
        .select('id, status')
        .eq('user_id', userId)
        .eq('book_id', book.id)
        .maybeSingle();
      
      if (!userBook) {
        console.log(`   ⚠️  "${bookTitle}": user_books 관계 없음, 건너뜀`);
        continue;
      }
      
      // 상태 매핑 (노션 상태 → 시스템 상태)
      const newStatus = mapReadingStatus(notionStatus || '읽는중');
      
      // 로깅: 노션 상태와 매핑된 상태 표시
      console.log(`   📊 상태 매핑:`);
      console.log(`      - 노션: "${notionStatus || '(없음)'}"`);
      console.log(`      - 현재 시스템: ${userBook.status}`);
      console.log(`      - 매핑된 시스템: ${newStatus}`);
      console.log(`      - 변경 필요: ${userBook.status !== newStatus ? '예' : '아니오'}`);
      
      // 업데이트 데이터 준비
      const updateData = {
        status: newStatus,
      };
      
      // 시작일자 업데이트 (노션 등록일자)
      if (pageCreatedAt) {
        updateData.started_at = pageCreatedAt;
      }
      
      // 완독일자 설정: 완독 또는 재독인 경우
      if (newStatus === 'completed' || newStatus === 'rereading') {
        // transcription 타입의 필사 이미지들 가져오기 (날짜순 정렬)
        const { data: transcriptionNotes } = await supabaseClient
          .from('notes')
          .select('created_at')
          .eq('user_id', userId)
          .eq('book_id', book.id)
          .eq('type', 'transcription')
          .order('created_at', { ascending: true });
        
        if (transcriptionNotes && transcriptionNotes.length > 0) {
          // 마지막 필사이미지 등록일자
          const lastTranscriptionDate = transcriptionNotes[transcriptionNotes.length - 1].created_at;
          updateData.completed_at = lastTranscriptionDate;
          
          const completedDates = [lastTranscriptionDate];
          
          // 재독인 경우: 마지막 필사이미지 날짜 기준 1개월 이상 지난 이미지일자의 마지막일자 추가
          if (newStatus === 'rereading' && transcriptionNotes.length > 1) {
            const lastDate = new Date(lastTranscriptionDate);
            const oneMonthAgo = new Date(lastDate);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            // 1개월 이상 지난 이미지들 중 가장 마지막 날짜 찾기
            let previousCompletionDate = null;
            for (let i = transcriptionNotes.length - 2; i >= 0; i--) {
              const noteDate = new Date(transcriptionNotes[i].created_at);
              if (noteDate < oneMonthAgo) {
                previousCompletionDate = transcriptionNotes[i].created_at;
                break;
              }
            }
            
            if (previousCompletionDate) {
              completedDates.unshift(previousCompletionDate); // 앞에 추가 (오래된 날짜가 먼저)
              console.log(`      - 이전 완독일자 (1개월 이상 지난): ${new Date(previousCompletionDate).toLocaleString('ko-KR')}`);
            }
          }
          
          // completed_dates 배열로 저장
          updateData.completed_dates = completedDates;
        }
      }
      
      // 날짜 정보 로깅
      console.log(`   📅 날짜 정보:`);
      if (pageCreatedAt) {
        console.log(`      - 시작일자: ${new Date(pageCreatedAt).toLocaleString('ko-KR')}`);
      }
      if (updateData.completed_at) {
        console.log(`      - 완독일자: ${new Date(updateData.completed_at).toLocaleString('ko-KR')}`);
      }
      if (updateData.completed_dates && updateData.completed_dates.length > 0) {
        console.log(`      - 완독일자 목록: ${updateData.completed_dates.map(d => new Date(d).toLocaleString('ko-KR')).join(', ')}`);
      }
      
      // 실제 업데이트 실행
      const { error } = await supabaseClient
        .from('user_books')
        .update(updateData)
        .eq('id', userBook.id);
      
      if (error) {
        console.error(`   ❌ "${bookTitle}" 업데이트 실패: ${error.message}`);
        errorCount++;
      } else {
        const statusInfo = userBook.status !== newStatus ? ` (${userBook.status} → ${newStatus})` : '';
        const dateInfo = pageCreatedAt ? ` 시작일: ${new Date(pageCreatedAt).toLocaleString('ko-KR')}` : '';
        const completedInfo = updateData.completed_at ? ` 완독일: ${new Date(updateData.completed_at).toLocaleString('ko-KR')}` : '';
        const completedDatesInfo = updateData.completed_dates && updateData.completed_dates.length > 1 
          ? ` 완독일자 목록: ${updateData.completed_dates.map(d => new Date(d).toLocaleDateString('ko-KR')).join(', ')}` 
          : '';
        console.log(`   ✅ "${bookTitle}"${statusInfo}${dateInfo}${completedInfo}${completedDatesInfo ? '\n      ' + completedDatesInfo : ''}`);
        updatedCount++;
      }
      
      // API Rate Limit 방지
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n   📊 업데이트 결과: 성공 ${updatedCount}권, 실패 ${errorCount}권`);
}

/**
 * 메인 함수
 */
async function main() {
  const userEmail = process.env.USER_EMAIL || 'cdhnaya@kakao.com';
  const userIdFromEnv = process.env.USER_ID;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID || 'ddda41d6-e7fe-450b-9475-daffa45e0d5c';
  
  console.log('='.repeat(60));
  console.log('노션 마이그레이션 데이터 정리 및 업데이트');
  console.log('='.repeat(60));
  console.log(`- 사용자 이메일: ${userEmail}`);
  console.log(`- 노션 데이터베이스 ID: ${notionDatabaseId}`);
  console.log(`- Supabase URL: ${SUPABASE_URL}`);
  
  // 사용자 ID 가져오기
  let userId = userIdFromEnv;
  if (!userId) {
    const { data: user } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (!user) {
      throw new Error(`사용자를 찾을 수 없습니다: ${userEmail}`);
    }
    userId = user.id;
  }
  
  console.log(`- 사용자 ID: ${userId}\n`);
  
  try {
    // 1. 중복 이미지 제거
    await removeDuplicateNotes(userId);
    
    // 2. 노션 데이터로 user_books 업데이트
    await updateUserBooksFromNotion(userId, notionDatabaseId);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 정리 및 업데이트 완료!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});
