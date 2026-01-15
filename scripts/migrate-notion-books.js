#!/usr/bin/env node
/**
 * 노션 독서 리스트 마이그레이션 스크립트
 * 
 * 각 책 페이지의 이미지와 텍스트를 기록정보 형식으로 구조화하여 추가합니다.
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

// .env.local 파일 로드
loadEnvFile();

// 환경 변수에서 Notion API 토큰 가져오기
const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;

// 디버깅: 토큰이 로드되었는지 확인 (토큰의 일부만 표시)
if (NOTION_API_TOKEN) {
  const tokenPreview = NOTION_API_TOKEN.substring(0, 20) + '...';
  console.log(`🔑 토큰 로드됨: ${tokenPreview} (전체 길이: ${NOTION_API_TOKEN.length})`);
} else {
  console.log('⚠️  토큰이 로드되지 않았습니다.');
}

if (!NOTION_API_TOKEN) {
  console.error('❌ NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.error('\n설정 방법:');
  console.error('1. Notion에서 Integration 생성:');
  console.error('   https://www.notion.so/my-integrations');
  console.error('2. Integration에 "독서 리스트" 데이터베이스 접근 권한 부여');
  console.error('3. 환경 변수 설정:');
  console.error('   $env:NOTION_API_TOKEN="your_integration_token"');
  console.error('   또는 .env.local 파일에 추가:');
  console.error('   NOTION_API_TOKEN=your_integration_token');
  process.exit(1);
}

const NOTION_API_BASE = 'api.notion.com';
const NOTION_VERSION = '2022-06-28';

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
 * 페이지의 모든 블록 가져오기
 */
async function getPageBlocks(pageId) {
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
 * 블록에서 이미지 URL 추출
 */
function extractImageUrl(block) {
  if (block.type !== 'image') {
    return null;
  }

  const image = block.image;
  if (image.type === 'external') {
    return image.external.url;
  } else if (image.type === 'file') {
    return image.file.url;
  }
  return null;
}

/**
 * 블록에서 텍스트 추출
 */
function extractText(block) {
  if (block.type !== 'paragraph') {
    return '';
  }

  const richText = block.paragraph?.rich_text || [];
  return richText
    .filter(item => item.type === 'text')
    .map(item => item.plain_text)
    .join('\n')
    .trim();
}

/**
 * 블록들을 이미지-텍스트 쌍으로 파싱
 */
function parseBlocksToPairs(blocks) {
  const pairs = [];
  let currentImage = null;

  for (const block of blocks) {
    const blockType = block.type;

    // 이미지 블록 발견
    if (blockType === 'image') {
      const imageUrl = extractImageUrl(block);
      if (imageUrl) {
        // 이전 이미지가 있으면 텍스트 없이 추가
        if (currentImage) {
          pairs.push({ imageUrl: currentImage, text: '' });
        }
        currentImage = imageUrl;
      }
    }
    // 텍스트 블록 발견
    else if (blockType === 'paragraph') {
      const text = extractText(block);
      if (text) {
        if (currentImage) {
          // 이미지와 텍스트 쌍으로 추가
          pairs.push({ imageUrl: currentImage, text: text });
          currentImage = null;
        }
        // 이미지 없이 텍스트만 있는 경우는 무시 (기록정보에 포함하지 않음)
      }
    }
    // 기타 블록 타입은 무시
  }

  // 마지막 이미지가 남아있으면 추가
  if (currentImage) {
    pairs.push({ imageUrl: currentImage, text: '' });
  }

  return pairs;
}

/**
 * 기록정보 섹션 블록 생성
 */
function createRecordSectionBlocks(pairs) {
  const blocks = [];

  // 제목: 기록정보
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '기록정보' } }],
    },
  });

  // 각 이미지-텍스트 쌍 추가
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    // 필사정보 제목
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '필사정보' } }],
      },
    });

    // 이미지 블록
    blocks.push({
      object: 'block',
      type: 'image',
      image: {
        type: 'external',
        external: { url: pair.imageUrl },
      },
    });

    // 내생각정보 제목
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '내생각정보' } }],
      },
    });

    // 텍스트 블록 (텍스트가 있는 경우만)
    if (pair.text) {
      // 텍스트를 줄바꿈으로 분리
      const lines = pair.text.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: line.trim() } }],
            },
          });
        }
      }
    } else {
      // 텍스트가 없으면 빈 문단 추가
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [],
        },
      });
    }

    // 구분선 (마지막 쌍이 아닌 경우)
    if (i < pairs.length - 1) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });
    }
  }

  return blocks;
}

/**
 * 단일 책 페이지 마이그레이션
 */
async function migrateBook(pageId, bookTitle) {
  try {
    console.log(`\n📖 처리 중: ${bookTitle}`);

    // 페이지 블록 가져오기
    const blocks = await getPageBlocks(pageId);
    console.log(`   블록 ${blocks.length}개 발견`);

    // 이미지-텍스트 쌍 추출
    const pairs = parseBlocksToPairs(blocks);
    console.log(`   이미지-텍스트 쌍 ${pairs.length}개 추출`);

    if (pairs.length === 0) {
      console.log(`   ⚠️  이미지가 없어서 건너뜁니다.`);
      return false;
    }

    // 기록정보 섹션 블록 생성
    const recordBlocks = createRecordSectionBlocks(pairs);
    console.log(`   기록정보 섹션 블록 ${recordBlocks.length}개 생성`);

    // 페이지에 추가
    await notionRequest('PATCH', `/v1/blocks/${pageId}/children`, {
      children: recordBlocks,
    });
    console.log(`   ✅ 성공적으로 추가되었습니다!`);

    return true;
  } catch (error) {
    console.error(`   ❌ 오류 발생: ${error.message}`);
    return false;
  }
}

/**
 * 메인 함수
 */
async function main() {
  // 마이그레이션할 책 목록
  const books = [
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

  console.log('='.repeat(60));
  console.log('노션 독서 리스트 마이그레이션 시작');
  console.log('='.repeat(60));
  console.log(`총 ${books.length}개 책 처리 예정\n`);

  let successCount = 0;
  let failCount = 0;

  for (const book of books) {
    const success = await migrateBook(book.pageId, book.title);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // API Rate Limit 방지를 위한 짧은 대기
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('마이그레이션 완료');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총계: ${books.length}개`);
}

// 스크립트 실행
main().catch((error) => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});
