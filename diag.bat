@echo off
cd /d "C:\Users\31518\Desktop\kstar-platform\backend"
echo === TEST 1: Import case_study ===
python -c "from app.api import case_study; print('OK - router prefix:', case_study.router.prefix); print('Routes:', [r.path for r in case_study.router.routes])"
echo.
echo === TEST 2: Import review_reminder ===
python -c "from app.api import review_reminder; print('OK - router prefix:', review_reminder.router.prefix); print('Routes:', [r.path for r in review_reminder.router.routes])"
echo.
echo === TEST 3: Import main app ===
python -c "from app.main import app; routes=[r.path for r in app.routes]; print('Total routes:', len(routes)); case=[r for r in routes if 'case-study' in r]; review_rem=[r for r in routes if 'review/due' in r]; print('case-study routes:', case if case else 'NONE'); print('review/due routes:', review_rem if review_rem else 'NONE')"
pause
