# 프로젝트 의존성 설치 스크립트
# Node.js가 설치되어 있다고 가정

Write-Host "프로젝트 의존성 설치를 시작합니다..." -ForegroundColor Cyan
Write-Host ""

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptPath ".."
Set-Location $projectRoot

# npm install 실행
Write-Host "npm install 실행 중..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "의존성 설치가 완료되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Yellow
    Write-Host "1. .env.local 파일에 환경 변수를 설정하세요" -ForegroundColor White
    Write-Host "2. 개발 서버를 실행하세요: npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "의존성 설치 중 오류가 발생했습니다." -ForegroundColor Red
    exit 1
}
