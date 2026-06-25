@echo off
cd /d "C:\Users\31518\Desktop\kstar-platform\frontend"

echo ========================================
echo KSTAR Frontend Setup
echo ========================================

echo.
echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [2/2] Starting Next.js dev server...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
call npm run dev
pause
