@echo off
cd /d "C:\Users\31518\Desktop\kstar-platform\backend"

echo Checking Python...
python --version
echo.

echo Installing packages one by one...
echo ---
python -m pip install fastapi --quiet
echo fastapi done
python -m pip install uvicorn --quiet
echo uvicorn done
python -m pip install httpx --quiet
echo httpx done
python -m pip install pydantic --quiet
echo pydantic done
python -m pip install pydantic-settings --quiet
echo pydantic-settings done
python -m pip install python-dotenv --quiet
echo python-dotenv done
echo.

echo Starting server...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
