@echo off
cd /d "C:\Users\31518\Desktop\kstar-platform"

echo ========================================
echo 知薪 - 一键启动
echo ========================================

echo.
echo [1/2] Starting backend...
start "知薪后端" cmd /c "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting frontend...
start "知薪前端" cmd /c "cd frontend && npm run dev"

echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Close this window to keep both running.
pause
