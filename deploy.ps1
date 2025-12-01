# Smart India Project - Deployment Helper Script
# This script helps you prepare for deployment

Write-Host "`n=== Smart India Project - Deployment Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
$gitCheck = git --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Git found: $gitCheck" -ForegroundColor Green
} else {
    Write-Host "✗ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if code is committed
$status = git status --porcelain
if ($status) {
    Write-Host "`n⚠ Uncommitted changes detected!" -ForegroundColor Yellow
    Write-Host "Files to commit:" -ForegroundColor Yellow
    git status --short
    Write-Host "`nWould you like to commit and push? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "`nCommitting changes..." -ForegroundColor Cyan
        git add .
        git commit -m "Ready for deployment"
        Write-Host "✓ Changes committed" -ForegroundColor Green
        
        Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
        git push
        Write-Host "✓ Pushed to GitHub" -ForegroundColor Green
    }
} else {
    Write-Host "✓ All changes committed" -ForegroundColor Green
}

# Generate SESSION_SECRET
Write-Host "`n=== Generating SESSION_SECRET ===" -ForegroundColor Cyan
$sessionSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "Your SESSION_SECRET:" -ForegroundColor Yellow
Write-Host $sessionSecret -ForegroundColor White
Write-Host "`n⚠ Save this! You'll need it for Railway deployment." -ForegroundColor Yellow

# Check MongoDB setup
Write-Host "`n=== MongoDB Setup Check ===" -ForegroundColor Cyan
Write-Host "Have you set up MongoDB Atlas? (Y/N)" -ForegroundColor Yellow
$mongoResponse = Read-Host
if ($mongoResponse -eq "N" -or $mongoResponse -eq "n") {
    Write-Host "`n📋 MongoDB Atlas Setup Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://www.mongodb.com/cloud/atlas" -ForegroundColor White
    Write-Host "2. Sign up for free account" -ForegroundColor White
    Write-Host "3. Create Free Cluster (M0)" -ForegroundColor White
    Write-Host "4. Create Database User (save password!)" -ForegroundColor White
    Write-Host "5. Network Access → Allow from anywhere (0.0.0.0/0)" -ForegroundColor White
    Write-Host "6. Get connection string" -ForegroundColor White
}

# Railway deployment instructions
Write-Host "`n=== Railway Deployment Steps ===" -ForegroundColor Cyan
Write-Host "1. Go to: https://railway.app" -ForegroundColor White
Write-Host "2. Sign up with GitHub" -ForegroundColor White
Write-Host "3. New Project → Deploy from GitHub repo" -ForegroundColor White
Write-Host "4. Select your repository" -ForegroundColor White
Write-Host "5. Add Environment Variables:" -ForegroundColor White
Write-Host "   - MONGODB_URI = your MongoDB connection string" -ForegroundColor Gray
Write-Host "   - SESSION_SECRET = $sessionSecret" -ForegroundColor Gray
Write-Host "   - NODE_ENV = production" -ForegroundColor Gray
Write-Host "6. Railway will auto-deploy! 🚀" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "✓ Code is ready" -ForegroundColor Green
Write-Host "✓ SESSION_SECRET generated (see above)" -ForegroundColor Green
Write-Host "→ Set up MongoDB Atlas (if not done)" -ForegroundColor Yellow
Write-Host "→ Deploy to Railway (follow steps above)" -ForegroundColor Yellow
Write-Host ""
Write-Host "For detailed guide, see: RAILWAY_DEPLOY.md" -ForegroundColor Cyan
Write-Host ""

