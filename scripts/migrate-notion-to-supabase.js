#!/usr/bin/env node
/**
 * 노션 → Supabase 마이그레이션 스크립트
 * 
 * 노션의 "죽음의 수용소에서" 책 데이터를 Supabase로 마이그레이션합니다.
 * - 책 정보 → books 테이블
 * - 사용자-책 관계 → user_books 테이블
 * - 이미지-텍스트 쌍 → notes 테이블 (필사정보=transcription, 내생각정보=memo)
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
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화
let supabaseClient = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (error) {
  console.error('❌ @supabase/supabase-js 로드 실패:', error.message);
  console.error('   npm install @supabase/supabase-js');
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
    const path = startCursor
      ? `/v1/databases/${databaseId}/query`
      : `/v1/databases/${databaseId}/query`;

    const requestBody = startCursor
      ? { start_cursor: startCursor }
      : {};

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
 * 페이지의 모든 블록 가져오기
 */
async function getNotionPageBlocks(pageId) {
  const allBlocks = [];
  let startCursor = null;

  while (true) {
    const path = startCursor
      ? `/v1/blocks/${pageId}/children?start_cursor=${startCursor}`
      : `/v1/blocks/${pageId}/children`;

    const response = await notionRequest('GET', path);
    allBlocks.push(...response.results);

    if (!response.has_more) {
      break;
    }

    startCursor = response.next_cursor;
  }

  return allBlocks;
}

/**
 * Properties에서 텍스트 값 추출
 */
function getPropertyText(properties, key) {
  const prop = properties[key];
  if (!prop) return null;
  
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
 * 블록에서 이미지 URL 추출
 * 노션의 file.notion.so 형식 URL도 지원
 * 
 * 참고: 노션 API에서 반환하는 이미지 URL은 다음과 같은 형식일 수 있습니다:
 * - prod-files-secure.s3.us-west-2.amazonaws.com (인증 필요, 403 오류 가능)
 * - file.notion.so (공개 URL, 만료 타임스탬프 포함 가능)
 * 
 * 현재는 API에서 반환하는 URL을 그대로 사용합니다.
 * 이미지가 표시되지 않으면 노션에서 이미지를 공개 URL로 변환하거나
 * Supabase Storage에 업로드하는 방법을 고려해야 합니다.
 */
function extractImageUrl(block) {
  if (block.type !== 'image') {
    return null;
  }

  const image = block.image;
  let imageUrl = null;
  
  if (image.type === 'external') {
    // 외부 이미지 URL (예: imgur, cloudinary 등)
    imageUrl = image.external.url;
    console.log(`      └─ 외부 이미지 URL`);
  } else if (image.type === 'file') {
    // 노션에 업로드된 파일
    imageUrl = image.file.url;
    
    // 노션 파일의 경우 만료 시간이 있을 수 있으므로 확인
    if (image.file.expiry_time) {
      console.log(`      └─ ⚠️  파일 만료 시간: ${image.file.expiry_time}`);
    }
    
    // URL 형식 확인
    if (imageUrl.includes('file.notion.so')) {
      console.log(`      └─ 노션 파일 URL 형식 (file.notion.so)`);
    } else if (imageUrl.includes('prod-files-secure.s3')) {
      console.log(`      └─ 노션 S3 파일 URL 형식 (인증 필요, 403 오류 가능)`);
      console.log(`      └─ ⚠️  이 URL은 인증이 필요하여 직접 접근이 제한될 수 있습니다.`);
      console.log(`      └─ 💡 해결 방법: 노션에서 이미지를 공개 URL로 변환하거나 Supabase Storage에 업로드`);
    }
  }
  
  return imageUrl;
}

/**
 * 블록에서 텍스트 추출 (여러 블록 타입 지원)
 */
function extractText(block) {
  if (block.type === 'paragraph') {
    const richText = block.paragraph?.rich_text || [];
    return richText
      .filter(item => item.type === 'text')
      .map(item => item.plain_text)
      .join('')
      .trim();
  }
  if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
    const richText = block[block.type]?.rich_text || [];
    return richText
      .filter(item => item.type === 'text')
      .map(item => item.plain_text)
      .join('')
      .trim();
  }
  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    const richText = block[block.type]?.rich_text || [];
    return richText
      .filter(item => item.type === 'text')
      .map(item => item.plain_text)
      .join('')
      .trim();
  }
  return '';
}

/**
 * 블록들에서 이미지 정보 추출 (블록 ID, URL, 생성일자)
 * 텍스트는 제외하고 이미지만 필사(transcription)로 저장
 */
function extractImageBlocks(blocks) {
  const imageBlocks = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockType = block.type;

    // 이미지 블록만 추출
    if (blockType === 'image') {
      const imageUrl = extractImageUrl(block);
      if (imageUrl) {
        // 생성일자 추출 (created_time 사용)
        const createdAt = block.created_time || block.last_edited_time;
        
        imageBlocks.push({
          blockId: block.id,
          imageUrl: imageUrl,
          createdAt: createdAt, // 노션에서 가져온 생성일자
        });
        
        const dateStr = createdAt ? new Date(createdAt).toLocaleString('ko-KR') : '날짜 없음';
        console.log(`   📸 이미지 ${imageBlocks.length} 발견: ${imageUrl.substring(0, 60)}...`);
        console.log(`      └─ 생성일: ${dateStr}`);
      }
    }
  }

  return imageBlocks;
}

/**
 * 현재 사용자 ID 가져오기
 */
async function getCurrentUserId(userEmail, userIdFromEnv = null) {
  // 환경 변수에서 직접 user_id를 받은 경우
  if (userIdFromEnv) {
    console.log(`   👤 환경 변수에서 사용자 ID 사용: ${userIdFromEnv}`);
    return userIdFromEnv;
  }

  try {
    // users 테이블에서 이메일로 사용자 찾기
    const { data, error } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (error) {
      console.log(`   ⚠️  users 테이블 조회 실패: ${error.message}`);
      throw new Error(`사용자 조회 실패: ${error.message}. USER_ID 환경 변수를 직접 설정하거나 SUPABASE_SERVICE_ROLE_KEY를 사용하세요.`);
    }
    
    if (data && data.id) {
      return data.id;
    }
    
    throw new Error(`사용자를 찾을 수 없습니다: ${userEmail}`);
  } catch (error) {
    throw new Error(`사용자 조회 실패: ${error.message}`);
  }
}

/**
 * 책 정보를 Supabase에 저장
 */
async function createBookInSupabase(bookData) {
  // ISBN으로 기존 책 확인
  if (bookData.isbn) {
    const { data: existing } = await supabaseClient
      .from('books')
      .select('id')
      .eq('isbn', bookData.isbn)
      .limit(1)
      .maybeSingle();
    
    if (existing && existing.id) {
      console.log(`   📚 기존 책 발견 (ISBN: ${bookData.isbn})`);
      return existing.id;
    }
  }

  // 새 책 생성
  const { data: newBook, error } = await supabaseClient
    .from('books')
    .insert(bookData)
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`책 생성 실패: ${error.message}`);
  }
  
  console.log(`   📚 새 책 생성 완료`);
  return newBook.id;
}

/**
* 사용자의 메인 서재 ID 조회 (없으면 생성)
*/
async function getOrCreateMainBookshelfId(userId) {
  // 1) 기존 메인 서재 조회
  const { data: existing, error: existingError } = await supabaseClient
    .from('bookshelves')
    .select('id')
    .eq('user_id', userId)
    .eq('is_main', true)
    .maybeSingle();

  if (existingError) {
    throw new Error(`메인 서재 조회 실패: ${existingError.message}`);
  }

  if (existing && existing.id) {
    return existing.id;
  }

  // 2) 없으면 새 메인 서재 생성
  const { data: newShelf, error: createError } = await supabaseClient
    .from('bookshelves')
    .insert({
      user_id: userId,
      name: '메인 서재',
      description: '노션에서 마이그레이션된 책을 위한 기본 서재',
      is_main: true,
      is_public: false,
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`메인 서재 생성 실패: ${createError.message}`);
  }

  return newShelf.id;
}

/**
* 사용자-책 관계 생성
 */
async function createUserBook(userId, bookId, status, readingReason, bookFormat) {
  // NOT NULL 제약 조건을 만족하기 위해 메인 서재 ID 사용
  const bookshelfId = await getOrCreateMainBookshelfId(userId);

  const userBookData = {
    user_id: userId,
    book_id: bookId,
    bookshelf_id: bookshelfId,
    status: status,
    reading_reason: readingReason || null,
    book_format: bookFormat || null,
  };

  // 기존 관계 확인
  const { data: existing } = await supabaseClient
    .from('user_books')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .limit(1)
    .maybeSingle();
  
  if (existing && existing.id) {
    console.log(`   📖 기존 사용자-책 관계 발견`);
    // 업데이트
    const { error } = await supabaseClient
      .from('user_books')
      .update(userBookData)
      .eq('id', existing.id);
    
    if (error) {
      throw new Error(`사용자-책 관계 업데이트 실패: ${error.message}`);
    }
    return existing.id;
  }

  // 새 관계 생성
  const { data: newUserBook, error } = await supabaseClient
    .from('user_books')
    .insert(userBookData)
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`사용자-책 관계 생성 실패: ${error.message}`);
  }
  
  console.log(`   📖 사용자-책 관계 생성 완료`);
  return newUserBook.id;
}

/**
 * 노션 이미지를 다운로드
 * 노션 API를 통해 이미지 블록 정보를 가져와서 다운로드
 */
async function downloadNotionImage(blockId, imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      // 노션 API를 통해 이미지 블록 정보 가져오기 (signed URL 포함)
      notionRequest('GET', `/v1/blocks/${blockId}`)
        .then((blockData) => {
          // 블록에서 최신 이미지 URL 가져오기
          let downloadUrl = imageUrl;
          
          if (blockData.type === 'image' && blockData.image) {
            if (blockData.image.type === 'file' && blockData.image.file) {
              downloadUrl = blockData.image.file.url;
            } else if (blockData.image.type === 'external' && blockData.image.external) {
              downloadUrl = blockData.image.external.url;
            }
          }
          
          // 이미지 다운로드
          const url = new URL(downloadUrl);
          const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'image/*',
            },
          };

          const protocol = url.protocol === 'https:' ? https : http;
          const req = protocol.request(options, (res) => {
            if (res.statusCode !== 200) {
              // 403 오류인 경우 원본 URL을 그대로 사용하도록 함
              if (res.statusCode === 403 || res.statusCode === 401) {
                console.log(`      ⚠️  이미지 접근 제한 (${res.statusCode}), 원본 URL 사용`);
                resolve(null); // null 반환하여 원본 URL 사용
                return;
              }
              reject(new Error(`이미지 다운로드 실패: ${res.statusCode}`));
              return;
            }

            const chunks = [];
            res.on('data', (chunk) => {
              chunks.push(chunk);
            });

            res.on('end', () => {
              const buffer = Buffer.concat(chunks);
              resolve(buffer);
            });
          });

          req.on('error', (e) => {
            console.log(`      ⚠️  이미지 다운로드 오류: ${e.message}, 원본 URL 사용`);
            resolve(null); // 오류 시 null 반환하여 원본 URL 사용
          });

          req.setTimeout(10000, () => {
            req.destroy();
            console.log(`      ⚠️  이미지 다운로드 타임아웃, 원본 URL 사용`);
            resolve(null); // 타임아웃 시 null 반환
          });

          req.end();
        })
        .catch((error) => {
          console.log(`      ⚠️  블록 정보 가져오기 실패: ${error.message}, 원본 URL 사용`);
          resolve(null); // 오류 시 null 반환하여 원본 URL 사용
        });
    } catch (error) {
      console.log(`      ⚠️  이미지 URL 파싱 오류: ${error.message}, 원본 URL 사용`);
      resolve(null); // 오류 시 null 반환
    }
  });
}

/**
 * 이미지를 Supabase Storage에 업로드
 */
async function uploadImageToSupabase(userId, imageBuffer, imageUrl) {
  try {
    // 파일 확장자 추출 (URL에서)
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1] || 'image.jpg';
    const fileExt = fileName.split('.').pop() || 'jpg';
    
    // 파일명 생성: timestamp-random.ext
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const newFileName = `${timestamp}-${random}.${fileExt}`;
    
    // 업로드 경로: transcriptions/${userId}/${fileName}
    const filePath = `transcriptions/${userId}/${newFileName}`;
    
    // Supabase Storage에 업로드
    const { data, error: uploadError } = await supabaseClient.storage
      .from('images')
      .upload(filePath, imageBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabaseClient.storage
      .from('images')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }
}

/**
 * 기록 생성 (필사정보 또는 내생각정보)
 * @param {string} userId - 사용자 ID
 * @param {string} bookId - 책 ID
 * @param {string} type - 기록 타입 (transcription, memo, photo, quote)
 * @param {string} imageUrl - 이미지 URL
 * @param {string} content - 텍스트 내용
 * @param {string} createdAt - 생성일자 (ISO 8601 형식, 선택사항)
 */
async function createNote(userId, bookId, type, imageUrl, content, createdAt = null) {
  const noteData = {
    user_id: userId,
    book_id: bookId,
    type: type,
    image_url: imageUrl || null,
    content: content || null,
    is_public: false,
  };
  
  // 이미 동일한 이미지/타입의 기록이 있으면 중복 생성 방지 (idempotent)
  if (noteData.image_url) {
    const { data: existing, error: existsError } = await supabaseClient
      .from('notes')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('type', type)
      .eq('image_url', noteData.image_url)
      .maybeSingle();

    if (!existsError && existing && existing.id) {
      const existingDate = existing.created_at
        ? new Date(existing.created_at).toLocaleString('ko-KR')
        : '알 수 없음';
      console.log(
        `   🔁 기존 기록 재사용 (${type}) (기존 생성일: ${existingDate})`
      );
      return existing.id;
    }
  }

  // 노션에서 가져온 생성일자가 있으면 사용
  if (createdAt) {
    // ISO 8601 형식을 PostgreSQL TIMESTAMP 형식으로 그대로 사용
    noteData.created_at = createdAt;
    noteData.updated_at = createdAt; // 초기에는 생성일과 동일
  }

  const { data: newNote, error } = await supabaseClient
    .from('notes')
    .insert(noteData)
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`기록 생성 실패: ${error.message}`);
  }
  
  const dateInfo = createdAt ? ` (생성일: ${new Date(createdAt).toLocaleString('ko-KR')})` : '';
  console.log(`   📝 기록 생성 완료 (${type})${dateInfo}`);
  return newNote.id;
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateBookFromNotion(pageId, userEmail, userIdFromEnv = null) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('노션 → Supabase 마이그레이션 시작');
    console.log('='.repeat(60));

    // 1. 노션에서 페이지 정보 가져오기
    console.log('\n1️⃣ 노션 페이지 정보 가져오기...');
    const page = await getNotionPage(pageId);
    const properties = page.properties;
    
    const bookTitle = getPropertyText(properties, '제목') || '제목 없음';
    console.log(`   📖 책 제목: ${bookTitle}`);

    // 2. Properties에서 책 정보 추출
    // img_2는 표지이므로 제외하고, img만 사용
    const bookData = {
      isbn: getPropertyText(properties, 'ISBN'),
      title: bookTitle,
      author: getPropertyText(properties, '저자'),
      publisher: getPropertyText(properties, '출판사'),
      cover_image_url: getPropertyText(properties, 'img'), // img_2는 표지이므로 제외
      category: getPropertyText(properties, '유형'),
      total_pages: getPropertyText(properties, '페이지 수'),
      summary: getPropertyText(properties, '책소개'),
      external_link: getPropertyText(properties, '네이버 링크'),
    };

    const readingStatus = mapReadingStatus(getPropertyText(properties, '독서상태') || '읽는중');
    const readingReason = getPropertyText(properties, '책읽는 이유');
    const bookFormat = getPropertyText(properties, '읽는 책종류');

    console.log('\n2️⃣ 책 정보 추출 완료');
    console.log(`   - 저자: ${bookData.author || 'N/A'}`);
    console.log(`   - 출판사: ${bookData.publisher || 'N/A'}`);
    console.log(`   - ISBN: ${bookData.isbn || 'N/A'}`);
    console.log(`   - 독서상태: ${readingStatus}`);
    console.log(`   - 읽는 이유: ${readingReason || 'N/A'}`);

    // 3. 사용자 ID 가져오기
    console.log('\n3️⃣ 사용자 확인...');
    const userId = await getCurrentUserId(userEmail, userIdFromEnv);
    console.log(`   👤 사용자 ID: ${userId}`);

    // 4. Supabase에 책 저장
    console.log('\n4️⃣ Supabase에 책 저장...');
    const bookId = await createBookInSupabase(bookData);

    // 5. 사용자-책 관계 생성
    console.log('\n5️⃣ 사용자-책 관계 생성...');
    await createUserBook(userId, bookId, readingStatus, readingReason, bookFormat);

    // 6. 노션에서 블록 가져오기 (이미지만 추출)
    console.log('\n6️⃣ 노션 페이지 블록 가져오기...');
    const blocks = await getNotionPageBlocks(pageId);
    console.log(`   블록 ${blocks.length}개 발견`);

    // 7. 이미지 블록 정보 추출 (텍스트 제외)
    const imageBlocks = extractImageBlocks(blocks);
    console.log(`   이미지 ${imageBlocks.length}개 추출`);

    // 8. 이미지를 Supabase Storage에 업로드하고 기록 생성
    if (imageBlocks.length > 0) {
      console.log('\n7️⃣ 이미지 다운로드 및 Supabase Storage 업로드...');
      console.log(`   총 ${imageBlocks.length}개 이미지 처리`);
      
      for (let i = 0; i < imageBlocks.length; i++) {
        const { blockId, imageUrl: notionImageUrl, createdAt } = imageBlocks[i];
        let finalImageUrl = notionImageUrl; // 기본값: 원본 URL
        
        try {
          const dateStr = createdAt ? new Date(createdAt).toLocaleString('ko-KR') : '날짜 없음';
          console.log(`   [${i + 1}/${imageBlocks.length}] 이미지 처리 중... (생성일: ${dateStr})`);
          
          // 1. 노션 이미지 다운로드 시도
          console.log(`      📥 노션에서 이미지 다운로드 시도...`);
          const imageBuffer = await downloadNotionImage(blockId, notionImageUrl);
          
          if (imageBuffer) {
            // 다운로드 성공 → Supabase Storage에 업로드
            console.log(`      ✅ 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
            console.log(`      📤 Supabase Storage에 업로드 중...`);
            finalImageUrl = await uploadImageToSupabase(userId, imageBuffer, notionImageUrl);
            console.log(`      ✅ 업로드 완료: ${finalImageUrl.substring(0, 80)}...`);
          } else {
            // 다운로드 실패 → 원본 URL 사용
            console.log(`      ⚠️  다운로드 실패, 원본 노션 URL 사용`);
            finalImageUrl = notionImageUrl;
          }
          
          // 2. 기록 생성 (필사정보 - transcription 타입)
          // 노션에서 가져온 생성일자를 함께 전달
          await createNote(
            userId, 
            bookId, 
            'transcription', 
            finalImageUrl,  // Supabase Storage URL 또는 원본 노션 URL
            null,  // 텍스트 제외
            createdAt  // 노션에서 가져온 생성일자
          );
          
          console.log(`   ✅ 기록 ${i + 1}/${imageBlocks.length}: 완료`);
          
          // API Rate Limit 방지
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`   ❌ 이미지 ${i + 1} 처리 실패: ${error.message}`);
          // 실패해도 원본 URL로 기록 생성 시도 (생성일자 포함)
          try {
            await createNote(userId, bookId, 'transcription', notionImageUrl, null, createdAt);
            console.log(`   ⚠️  원본 URL로 기록 생성 완료`);
          } catch (createError) {
            console.error(`   ❌ 기록 생성도 실패: ${createError.message}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 마이그레이션 완료!');
    console.log('='.repeat(60));
    console.log(`📖 책: ${bookTitle}`);
    console.log(`📝 기록: ${imageBlocks.length}개 생성 (모두 필사정보 - 이미지만)`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    throw error;
  }
}

/**
 * 메인 함수
 */
async function main() {
  // 사용자 이메일 (환경 변수에서 가져오거나 하드코딩)
  const userEmail = process.env.USER_EMAIL || 'cdhnaya@kakao.com';
  
  // 노션 데이터베이스 ID (환경 변수에서 가져오기, 없으면 기본값 사용)
  // 기본값: "독서 리스트" 데이터베이스 ID
  const notionDatabaseId = process.env.NOTION_DATABASE_ID || 'ddda41d6-e7fe-450b-9475-daffa45e0d5c';

  console.log('마이그레이션 설정:');
  console.log(`- 사용자 이메일: ${userEmail}`);
  if (userIdFromEnv) {
    console.log(`- 사용자 ID: ${userIdFromEnv} (환경 변수에서)`);
  } else {
    console.log(`- 사용자 ID: 이메일로 조회 시도`);
  }
  console.log(`- Supabase URL: ${SUPABASE_URL}`);
  console.log(
    `- Supabase Key: ${
      SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key 사용' : 'Anon Key 사용'
    }`
  );

  let books = [];

  // 노션 데이터베이스 ID가 있으면 자동으로 모든 책 가져오기
  if (notionDatabaseId) {
    console.log(`- 노션 데이터베이스 ID: ${notionDatabaseId}`);
    console.log('\n📚 노션 데이터베이스에서 모든 책 가져오기...');
    
    try {
      const pages = await getAllNotionBooks(notionDatabaseId);
      console.log(`   총 ${pages.length}개 책 발견`);
      
      // 각 페이지에서 제목 추출
      books = pages.map((page) => {
        const title = getPropertyText(page.properties, '제목') || '제목 없음';
        return {
          pageId: page.id,
          title: title,
        };
      });
      
      console.log(`   📖 책 목록:`);
      books.forEach((book, index) => {
        console.log(`      ${index + 1}. ${book.title}`);
      });
    } catch (error) {
      console.error(`❌ 노션 데이터베이스 조회 실패: ${error.message}`);
      console.error(`   환경 변수 NOTION_DATABASE_ID를 확인하거나 수동으로 책 목록을 설정하세요.`);
      process.exit(1);
    }
  } else {
    // 데이터베이스 ID가 없으면 하드코딩된 목록 사용 (기존 방식)
    console.log(`- 노션 데이터베이스 ID: 없음 (하드코딩된 목록 사용)`);
    books = [
      {
        pageId: '18cfcf15-b6ad-8167-a571-f768b898058d',
        title: '죽음의 수용소에서',
      },
      {
        pageId: '28cfcf15-b6ad-8080-b1d0-d6cd428b4271',
        title: '어린왕자',
      },
      {
        pageId: '195fcf15-b6ad-8091-9c4e-dd7962ad33ed',
        title: '넥서스',
      },
      {
        pageId: '1b8fcf15-b6ad-8020-89f3-f72e8a3491b0',
        title: '사랑의기술',
      },
      {
        pageId: '18cfcf15-b6ad-81f3-8caa-f4921d88683b',
        title: '기회의 심리학',
      },
      {
        pageId: '18cfcf15-b6ad-8066-84af-ecbf1ab8cedc',
        title: '지적대화를 위한 넓고 얕은 지식 1',
      },
    ];
  }

  console.log(`\n- 마이그레이션 대상 책 수: ${books.length}권`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log('\n' + '-'.repeat(60));
    console.log(`📖 책 마이그레이션 [${i + 1}/${books.length}]: ${book.title}`);
    console.log('-'.repeat(60));

    try {
      await migrateBookFromNotion(book.pageId, userEmail, userIdFromEnv);
      successCount++;
    } catch (error) {
      failCount++;
      console.error(`❌ "${book.title}" 마이그레이션 실패: ${error.message}`);
    }

    // API Rate Limit 방지를 위한 짧은 대기
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 전체 마이그레이션 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}권`);
  console.log(`❌ 실패: ${failCount}권`);
  console.log(`📚 총 처리 대상: ${books.length}권`);
}

main().catch((error) => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});
