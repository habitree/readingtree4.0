# Git 및 GitHub 설정 스크립트
# Habitree Reading Hub v4.0.0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git 및 GitHub 설정 스크립트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Git 설치 확인
Write-Host "[1/4] Git 설치 확인 중..." -ForegroundColor Yellow
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitVersion = git --version
    Write-Host "✅ Git이 설치되어 있습니다: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Git 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://git-scm.com/download/win 접속" -ForegroundColor White
    Write-Host "2. 다운로드 및 설치" -ForegroundColor White
    Write-Host "3. 설치 후 터미널을 재시작하고 이 스크립트를 다시 실행하세요" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 2. Git 사용자 정보 확인
Write-Host "[2/4] Git 사용자 정보 확인 중..." -ForegroundColor Yellow
$userName = git config --global user.name 2>$null
$userEmail = git config --global user.email 2>$null

if ($userName -and $userEmail) {
    Write-Host "✅ Git 사용자 정보가 설정되어 있습니다:" -ForegroundColor Green
    Write-Host "   이름: $userName" -ForegroundColor White
    Write-Host "   이메일: $userEmail" -ForegroundColor White
} else {
    Write-Host "⚠️  Git 사용자 정보가 설정되어 있지 않습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Git 사용자 정보를 설정하세요:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "git config --global user.name `"Your Name`"" -ForegroundColor White
    Write-Host "git config --global user.email `"your.email@example.com`"" -ForegroundColor White
    Write-Host ""
    Write-Host "또는 이 스크립트를 수정하여 사용자 정보를 자동으로 설정할 수 있습니다." -ForegroundColor Gray
}

# 3. 원격 저장소 확인
Write-Host "[3/4] 원격 저장소 확인 중..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "✅ 원격 저장소가 연결되어 있습니다:" -ForegroundColor Green
    Write-Host "   $remoteUrl" -ForegroundColor White
} else {
    Write-Host "⚠️  원격 저장소가 연결되어 있지 않습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "원격 저장소를 연결하세요:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/habitree/readingtree4.0.git" -ForegroundColor White
}

# 4. 현재 상태 확인
Write-Host "[4/4] 현재 Git 상태 확인 중..." -ForegroundColor Yellow
Write-Host ""
git status

# 5. 완료 메시지
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "설정 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Git 사용자 정보 설정 (위에 안내됨)" -ForegroundColor White
Write-Host "2. GitHub Personal Access Token 생성" -ForegroundColor White
Write-Host "   https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "3. 변경 사항 커밋 및 푸시:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m `"커밋 메시지`"" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "자세한 내용은 doc/setup/git-github-setup-guide.md를 참조하세요." -ForegroundColor Gray
Write-Host ""
