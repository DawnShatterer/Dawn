@echo off
echo ==============================================
echo DAWN - ML ENGINE STARTUP (Python 3)
echo ==============================================

echo Checking dependencies...
pip install -r requirements.txt

echo.
echo Starting ML Engine on Port 8000...
uvicorn ml_engine:app --host 0.0.0.0 --port 8000 --reload
