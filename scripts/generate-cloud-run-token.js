/**
 * Cloud Run OCR 인증 토큰 생성 스크립트
 * 
 * 사용 방법:
 * node scripts/generate-cloud-run-token.js
 * 
 * 또는 환경 변수로 키 파일 경로 지정:
 * KEY_FILE=./habitree-f49e1-f25aade084d3.json node scripts/generate-cloud-run-token.js
 */

const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function generateToken() {
  try {
    // 키 파일 경로 (환경 변수 또는 기본값)
    const keyFile = process.env.KEY_FILE || path.join(__dirname, '../habitree-f49e1-f25aade084d3.json');
    const cloudRunUrl = 'https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage';

    console.log('='.repeat(60));
    console.log('Cloud Run OCR 인증 토큰 생성');
    console.log('='.repeat(60));
    console.log(`키 파일: ${keyFile}`);
    console.log(`Cloud Run URL: ${cloudRunUrl}`);
    console.log('='.repeat(60));
    console.log('');

    // Google Auth 클라이언트 생성 (ID 토큰용이므로 scope 없이)
    const auth = new GoogleAuth({
      keyFile: keyFile,
      // ID 토큰 생성 시 scope를 지정하지 않음
    });

    console.log('서비스 계정 인증 중...');
    
    // 서비스 계정 이메일 확인
    const projectId = await auth.getProjectId();
    console.log(`프로젝트 ID: ${projectId}`);
    console.log('');

    // ID 토큰 생성 (Cloud Run 인증용)
    console.log('ID 토큰 생성 중...');
    
    // ID 토큰을 생성하기 위해 audience 지정
    const idTokenClient = await auth.getIdTokenClient(cloudRunUrl);
    const idToken = await idTokenClient.idTokenProvider.fetchIdToken(cloudRunUrl);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ 인증 토큰 생성 완료!');
    console.log('='.repeat(60));
    console.log('');
    console.log('다음 토큰을 Vercel 환경 변수에 설정하세요:');
    console.log('');
    console.log('환경 변수 이름: CLOUD_RUN_OCR_AUTH_TOKEN');
    console.log('환경 변수 값:');
    console.log(idToken);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  주의: 이 토큰은 약 1시간 동안만 유효합니다.');
    console.log('   토큰이 만료되면 이 스크립트를 다시 실행하세요.');
    console.log('');

    return idToken;
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:');
    console.error(error.message);
    console.error('');
    
    if (error.message.includes('ENOENT')) {
      console.error('키 파일을 찾을 수 없습니다.');
      console.error('키 파일 경로를 확인하거나 KEY_FILE 환경 변수를 설정하세요.');
      console.error('');
      console.error('예시:');
      console.error('  KEY_FILE=./habitree-f49e1-f25aade084d3.json node scripts/generate-cloud-run-token.js');
    } else if (error.message.includes('private_key')) {
      console.error('키 파일 형식이 올바르지 않습니다.');
      console.error('서비스 계정 JSON 키 파일인지 확인하세요.');
    }
    
    console.error('');
    process.exit(1);
  }
}

// 스크립트 실행
generateToken().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
