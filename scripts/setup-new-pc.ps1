# 새 PC 프로젝트 설치 스크립트
# Habitree Reading Hub v4.0.0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Habitree Reading Hub 설치 스크립트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node.js 설치 확인
Write-Host "[1/4] Node.js 설치 확인 중..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js가 설치되어 있습니다: $nodeVersion" -ForegroundColor Green
    
    # Node.js 버전 확인 (18 이상 필요)
    $versionMatch = $nodeVersion -match 'v(\d+)\.'
    if ($versionMatch) {
        $versionNumber = [int]$matches[1]
        if ($versionNumber -lt 18) {
            Write-Host "⚠️  경고: Node.js 18 이상이 필요합니다. 현재 버전: $nodeVersion" -ForegroundColor Yellow
            Write-Host "   Node.js를 업그레이드하세요: https://nodejs.org/ko/download/" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "❌ Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Node.js 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://nodejs.org/ko/download/ 접속" -ForegroundColor White
    Write-Host "2. LTS 버전 다운로드 및 설치" -ForegroundColor White
    Write-Host "3. 설치 후 터미널을 재시작하고 이 스크립트를 다시 실행하세요" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 2. npm 설치 확인
Write-Host "[2/4] npm 설치 확인 중..." -ForegroundColor Yellow
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCheck) {
    $npmVersion = npm --version
    Write-Host "✅ npm이 설치되어 있습니다: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "   Node.js를 재설치하세요." -ForegroundColor Yellow
    exit 1
}

# 3. 프로젝트 디렉토리 확인
Write-Host "[3/4] 프로젝트 디렉토리 확인 중..." -ForegroundColor Yellow
$projectRoot = $PSScriptRoot + "\.."
if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Host "❌ package.json을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   프로젝트 루트 디렉토리에서 실행하세요." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ 프로젝트 디렉토리 확인 완료" -ForegroundColor Green

# 4. 의존성 설치
Write-Host "[4/4] 프로젝트 의존성 설치 중..." -ForegroundColor Yellow
Write-Host "   이 작업은 몇 분이 걸릴 수 있습니다..." -ForegroundColor Gray
Write-Host ""

Set-Location $projectRoot

try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 의존성 설치가 완료되었습니다!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 의존성 설치 중 오류가 발생했습니다." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ 의존성 설치 중 오류가 발생했습니다: $_" -ForegroundColor Red
    exit 1
}

# 5. 환경 변수 확인
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "환경 변수 확인" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path "$projectRoot\.env.local") {
    Write-Host "✅ .env.local 파일이 존재합니다" -ForegroundColor Green
    Write-Host "   환경 변수가 올바르게 설정되었는지 확인하세요." -ForegroundColor Yellow
} else {
    Write-Host "⚠️  .env.local 파일이 없습니다." -ForegroundColor Yellow
    Write-Host "   .env.local 파일을 생성하고 환경 변수를 설정하세요." -ForegroundColor Yellow
    Write-Host "   자세한 내용은 doc/setup/new-pc-setup-guide.md를 참조하세요." -ForegroundColor Yellow
}

# 6. 완료 메시지
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "설치 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. .env.local 파일에 환경 변수를 설정하세요" -ForegroundColor White
Write-Host "2. 개발 서버를 실행하세요: npm run dev" -ForegroundColor White
Write-Host "3. 브라우저에서 http://localhost:3000 을 열어 확인하세요" -ForegroundColor White
Write-Host ""
Write-Host "자세한 내용은 doc/setup/new-pc-setup-guide.md를 참조하세요." -ForegroundColor Gray
Write-Host ""
