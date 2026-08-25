@echo off
title BJS Rampuria Jain Law College ERP - Admission System Launcher
color 0a
echo.
echo  ============================================================
echo     B.J.S. RAMPURIA JAIN LAW COLLEGE ERP  ^|  LOCAL SERVER
echo  ============================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo  [ERROR] Node.js is NOT installed or not added to system PATH.
    echo  Please install Node.js LTS version from: https://nodejs.org/
    echo.
    echo  Press any key to exit...
    pause >nul
    exit
)

:: Close any old server instances running on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo  [1/3] Starting backend server...
echo.

:: Start server.js in the backend directory safely (handles spaces in path)
start "BJS Rampuria Jain Law College Server" /D "%~dp0backend" cmd /k "node server.js"

:: Wait for 4 seconds using ping
ping 127.0.0.1 -n 5 >nul

echo  [3/3] Opening College ERP Portal in your browser...
start http://localhost:5000

echo.
echo  ============================================================
echo   Server is running at: http://localhost:5000
echo   Admin Username : admin
echo   Admin Password : admin123
echo  ============================================================
echo.
echo  Keep the server window open while using the ERP system.
echo  Press any key to close this launcher window...
pause >nul
