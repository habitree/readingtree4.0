#!/usr/bin/env node
/**
 * 노션 이미지 URL 테스트 스크립트
 * 실제 이미지 URL이 접근 가능한지 확인
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

function extractImageUrl(block) {
  if (block.type !== 'image') return null;
  const image = block.image;
  if (image.type === 'external') return image.external.url;
  if (image.type === 'file') return image.file.url;
  return null;
}

function testImageUrl(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      };

      const req = https.request(options, (res) => {
        resolve({
          status: res.statusCode,
          accessible: res.statusCode >= 200 && res.statusCode < 400,
          contentType: res.headers['content-type'],
        });
      });

      req.on('error', () => {
        resolve({ status: 0, accessible: false, error: true });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ status: 0, accessible: false, timeout: true });
      });

      req.end();
    } catch (error) {
      resolve({ status: 0, accessible: false, error: error.message });
    }
  });
}

async function main() {
  const pageId = '18cfcf15-b6ad-8167-a571-f768b898058d';
  
  console.log('노션 이미지 URL 테스트...\n');
  
  const blocks = await getNotionPageBlocks(pageId);
  const imageBlocks = blocks.filter(b => b.type === 'image');
  
  console.log(`이미지 블록 ${imageBlocks.length}개 발견\n`);
  console.log('='.repeat(80));
  
  for (let i = 0; i < imageBlocks.length; i++) {
    const block = imageBlocks[i];
    const imageUrl = extractImageUrl(block);
    
    console.log(`\n[${i + 1}] 이미지 블록 ID: ${block.id}`);
    console.log(`    URL: ${imageUrl ? imageUrl.substring(0, 100) + '...' : '없음'}`);
    
    if (imageUrl) {
      console.log(`    URL 형식:`);
      if (imageUrl.includes('file.notion.so')) {
        console.log(`      - file.notion.so 형식`);
      }
      if (imageUrl.includes('prod-files-secure.s3')) {
        console.log(`      - prod-files-secure.s3 형식`);
      }
      if (imageUrl.includes('expirationTimestamp')) {
        console.log(`      - ⚠️  만료 타임스탬프 포함`);
      }
      
      // 이미지 접근 테스트
      console.log(`    접근 테스트 중...`);
      const testResult = await testImageUrl(imageUrl);
      if (testResult.accessible) {
        console.log(`    ✅ 접근 가능 (상태 코드: ${testResult.status}, 타입: ${testResult.contentType})`);
      } else {
        console.log(`    ❌ 접근 불가 (상태 코드: ${testResult.status})`);
        if (testResult.timeout) {
          console.log(`      - 타임아웃 발생`);
        }
        if (testResult.error) {
          console.log(`      - 오류: ${testResult.error}`);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
