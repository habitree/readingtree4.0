#!/usr/bin/env node
/**
 * 노션 페이지 블록 구조 디버깅 스크립트
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

function extractText(block) {
  if (block.type === 'paragraph') {
    const richText = block.paragraph?.rich_text || [];
    return richText.map(item => item.plain_text).join('').trim();
  }
  if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
    const richText = block[block.type]?.rich_text || [];
    return richText.map(item => item.plain_text).join('').trim();
  }
  return '';
}

async function main() {
  const pageId = '18cfcf15-b6ad-8167-a571-f768b898058d';
  
  console.log('노션 페이지 블록 구조 분석...\n');
  
  const blocks = await getNotionPageBlocks(pageId);
  
  console.log(`총 ${blocks.length}개 블록 발견\n`);
  console.log('='.repeat(80));
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`\n[${i + 1}] 타입: ${block.type}`);
    console.log(`    ID: ${block.id}`);
    console.log(`    생성일: ${block.created_time || '없음'}`);
    console.log(`    수정일: ${block.last_edited_time || '없음'}`);
    
    if (block.type === 'image') {
      const imageUrl = extractImageUrl(block);
      console.log(`    이미지 URL: ${imageUrl ? imageUrl.substring(0, 80) + '...' : '없음'}`);
    } else {
      const text = extractText(block);
      if (text) {
        console.log(`    텍스트: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      } else {
        console.log(`    텍스트: 없음`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
