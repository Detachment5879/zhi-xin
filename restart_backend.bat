@echo off
echo Killing all Python processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM python3.14.exe 2>nul
echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo.
echo Clearing all __pycache__...
for /d /r "C:\Users\31518\Desktop\kstar-platform\backend" %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
echo.
echo Starting backend (no --reload)...
cd /d "C:\Users\31518\Desktop\kstar-platform\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
