@echo off
title Bidhayak Seva Kendra - Goghat AC 201
echo ========================================================
echo   Bidhayak Seva Kendra (Goghat Assembly AC 201)
echo   Hon'ble MLA Prashanta Digar Portal
echo ========================================================
echo.
echo Starting Backend Server (Port 5000)...
start "BSK Backend Server" cmd /k "node backend/server.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "BSK Frontend Server" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo   Webapp is running!
echo   Frontend: http://localhost:3000 or http://127.0.0.1:3000
echo   Backend:  http://localhost:5000 or http://127.0.0.1:5000
echo ========================================================
pause
