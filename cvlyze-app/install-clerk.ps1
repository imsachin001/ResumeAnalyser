# Installation Script for Clerk Authentication
# Run this from the cvlyze-app root directory

Write-Host "Installing Clerk Authentication packages..." -ForegroundColor Cyan
Write-Host ""

# Install client dependencies
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location -Path "client"
npm install @clerk/clerk-react
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Client dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Client installation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location -Path "..\server"
npm install @clerk/express
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Server dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Server installation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Set-Location -Path ".."

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://clerk.com/ and create an account"
Write-Host "2. Create a new application and get your API keys"
Write-Host "3. Add your keys to the .env files:"
Write-Host "   - client/.env: REACT_APP_CLERK_PUBLISHABLE_KEY"
Write-Host "   - server/.env: CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY"
Write-Host ""
Write-Host "For detailed instructions, see CLERK_AUTHENTICATION_SETUP.md" -ForegroundColor Yellow
