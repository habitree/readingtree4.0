#!/usr/bin/env node
/**
 * 노션 마이그레이션 롤백 스크립트
 * 
 * 방금 추가한 기록정보 섹션을 제거합니다.
 */

const https = require('https');
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
const NOTION_API_BASE = 'api.notion.com';
const NOTION_VERSION = '2022-06-28';

if (!NOTION_API_TOKEN) {
  console.error('❌ NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다.');
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
 * 블록 삭제
 */
async function deleteBlock(blockId) {
  return notionRequest('DELETE', `/v1/blocks/${blockId}`);
}

/**
 * 블록에서 텍스트 추출
 */
function getBlockText(block) {
  if (block.type === 'heading_2' && block.heading_2) {
    const richText = block.heading_2.rich_text || [];
    return richText.map(item => item.plain_text).join('');
  }
  return '';
}

/**
 * 단일 책 페이지 롤백
 */
async function rollbackBook(pageId, bookTitle) {
  try {
    console.log(`\n📖 롤백 중: ${bookTitle}`);

    // 페이지 블록 가져오기
    const blocks = await getPageBlocks(pageId);
    console.log(`   블록 ${blocks.length}개 발견`);

    // "기록정보" 제목 블록 찾기
    let recordInfoIndex = -1;
    for (let i = 0; i < blocks.length; i++) {
      const text = getBlockText(blocks[i]);
      if (text === '기록정보') {
        recordInfoIndex = i;
        break;
      }
    }

    if (recordInfoIndex === -1) {
      console.log(`   ⚠️  기록정보 섹션을 찾을 수 없습니다.`);
      return false;
    }

    console.log(`   기록정보 섹션 발견 (인덱스: ${recordInfoIndex})`);

    // 기록정보 섹션부터 끝까지의 모든 블록 삭제
    const blocksToDelete = blocks.slice(recordInfoIndex);
    console.log(`   삭제할 블록: ${blocksToDelete.length}개`);

    // 각 블록 삭제 (역순으로 삭제하여 인덱스 문제 방지)
    for (let i = blocksToDelete.length - 1; i >= 0; i--) {
      const block = blocksToDelete[i];
      await deleteBlock(block.id);
      // API Rate Limit 방지
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`   ✅ 성공적으로 롤백되었습니다!`);
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
  console.log('노션 마이그레이션 롤백 시작');
  console.log('='.repeat(60));
  console.log(`총 ${books.length}개 책 롤백 예정\n`);

  let successCount = 0;
  let failCount = 0;

  for (const book of books) {
    const success = await rollbackBook(book.pageId, book.title);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // API Rate Limit 방지를 위한 짧은 대기
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('롤백 완료');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총계: ${books.length}개`);
}

main().catch((error) => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});
