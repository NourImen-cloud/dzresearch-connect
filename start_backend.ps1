# DzResearch Connect — Start Backend
# Run this from the project root: .\start_backend.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DzResearch Connect — Backend         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting FastAPI on http://localhost:8000" -ForegroundColor Green
Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
