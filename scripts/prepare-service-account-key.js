/**
 * 서비스 계정 키를 Vercel 환경 변수용 한 줄 JSON으로 변환
 * 
 * 사용 방법:
 * node scripts/prepare-service-account-key.js
 * 
 * 또는 키 파일 경로 지정:
 * KEY_FILE=./habitree-f49e1-f25aade084d3.json node scripts/prepare-service-account-key.js
 */

const fs = require('fs');
const path = require('path');

function prepareServiceAccountKey() {
  try {
    // 키 파일 경로 (환경 변수 또는 기본값)
    const keyFile = process.env.KEY_FILE || path.join(__dirname, '../habitree-f49e1-f25aade084d3.json');

    console.log('='.repeat(60));
    console.log('서비스 계정 키 준비 (Vercel 환경 변수용)');
    console.log('='.repeat(60));
    console.log(`키 파일: ${keyFile}`);
    console.log('='.repeat(60));
    console.log('');

    // 파일 존재 확인
    if (!fs.existsSync(keyFile)) {
      console.error('❌ 오류: 키 파일을 찾을 수 없습니다.');
      console.error(`   경로: ${keyFile}`);
      console.error('');
      console.error('키 파일 경로를 확인하거나 KEY_FILE 환경 변수를 설정하세요.');
      console.error('');
      console.error('예시:');
      console.error('  KEY_FILE=./habitree-f49e1-f25aade084d3.json node scripts/prepare-service-account-key.js');
      process.exit(1);
    }

    // JSON 파일 읽기
    console.log('키 파일 읽는 중...');
    const jsonContent = fs.readFileSync(keyFile, 'utf8');
    
    // JSON 유효성 검사
    let jsonData;
    try {
      jsonData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ 오류: JSON 파일 형식이 올바르지 않습니다.');
      console.error(parseError.message);
      process.exit(1);
    }

    // 한 줄로 변환 (공백 최소화)
    const oneLineJson = JSON.stringify(jsonData);

    console.log('✅ 키 파일 준비 완료!');
    console.log('');
    console.log('='.repeat(60));
    console.log('Vercel 환경 변수 설정 정보');
    console.log('='.repeat(60));
    console.log('');
    console.log('환경 변수 이름: GOOGLE_SERVICE_ACCOUNT_KEY');
    console.log('');
    console.log('환경 변수 값 (아래 전체를 복사하세요):');
    console.log('-'.repeat(60));
    console.log(oneLineJson);
    console.log('-'.repeat(60));
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 다음 단계:');
    console.log('1. 위의 환경 변수 값을 복사');
    console.log('2. Vercel 대시보드 → Settings → Environment Variables');
    console.log('3. Key: GOOGLE_SERVICE_ACCOUNT_KEY');
    console.log('4. Value: 위에서 복사한 값 (전체 한 줄)');
    console.log('5. Environment: Production, Preview, Development (모두 선택)');
    console.log('6. 저장 후 재배포');
    console.log('');
    console.log('⚠️  보안 주의:');
    console.log('   - 이 키는 절대 Git에 커밋하지 마세요!');
    console.log('   - Vercel 환경 변수에만 저장하세요!');
    console.log('');

    return oneLineJson;
  } catch (error) {
    console.error('');
    console.error('❌ 예상치 못한 오류:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

// 스크립트 실행
prepareServiceAccountKey();
