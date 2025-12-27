/**
 * 샘플 데이터의 책 이미지를 네이버 API를 통해 업데이트하는 스크립트
 * 
 * 실행 방법:
 * 1. 환경 변수 설정 확인 (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)
 * 2. node scripts/update-sample-data-images.js
 * 3. 출력된 SQL을 doc/database/sample-data.sql에 반영
 */

const sampleBooks = [
  {
    isbn: '9788937460498',
    title: '데미안',
    author: '헤르만 헤세',
    publisher: '민음사',
    published_date: '2010-01-01',
  },
  {
    isbn: '9788937460504',
    title: '노인과 바다',
    author: '어니스트 헤밍웨이',
    publisher: '민음사',
    published_date: '2005-03-15',
  },
  {
    isbn: '9788937460511',
    title: '1984',
    author: '조지 오웰',
    publisher: '민음사',
    published_date: '2004-05-20',
  },
  {
    isbn: '9788983927635',
    title: '해리포터와 마법사의 돌',
    author: 'J.K. 롤링',
    publisher: '문학수첩',
    published_date: '1999-12-01',
  },
  {
    isbn: '9788937460528',
    title: '작은 아씨들',
    author: '루이자 메이 올컷',
    publisher: '민음사',
    published_date: '2008-07-10',
  },
];

async function searchBookImage(title, author) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('네이버 API 키가 설정되지 않았습니다.');
    return null;
  }

  const query = `${title} ${author}`;
  const url = new URL('https://openapi.naver.com/v1/search/book.json');
  url.searchParams.append('query', query);
  url.searchParams.append('display', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      console.error(`네이버 API 호출 실패: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].image;
    }
  } catch (error) {
    console.error(`책 검색 오류 (${title}):`, error.message);
  }

  return null;
}

async function main() {
  console.log('-- 샘플 데이터 이미지 URL 업데이트 SQL\n');
  console.log('-- 네이버 API를 통해 검색한 이미지 URL로 업데이트\n');

  for (const book of sampleBooks) {
    console.log(`-- ${book.title} (${book.author})`);
    const imageUrl = await searchBookImage(book.title, book.author);
    
    if (imageUrl) {
      console.log(`UPDATE books SET cover_image_url = '${imageUrl}' WHERE isbn = '${book.isbn}' AND is_sample = TRUE;`);
    } else {
      console.log(`-- 이미지를 찾을 수 없음: ${book.title}`);
    }
    
    // API 호출 제한을 고려하여 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n-- 업데이트 완료');
}

main().catch(console.error);

