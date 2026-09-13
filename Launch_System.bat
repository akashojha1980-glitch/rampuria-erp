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

:: Detect LAN IPv4 Address
set "LAN_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1 delims= " %%b in ("%%a") do (
        echo %%b | findstr /v "169.254." >nul && if not defined LAN_IP set "LAN_IP=%%b"
    )
)

echo  [1/3] Starting backend server on all network interfaces (0.0.0.0:5000)...
echo.

:: Start server.js in the backend directory safely (handles spaces in path)
start "BJS Rampuria Jain Law College Server" /D "%~dp0backend" cmd /k "node server.js"

:: Wait for 4 seconds using ping
ping 127.0.0.1 -n 5 >nul

echo  [2/3] Opening College ERP Portal in your browser...
start http://localhost:5000

echo.
echo  ============================================================
echo   SERVER IS LIVE & ACCESSIBLE ON YOUR NETWORK:
echo.
echo   💻 This PC Access   : http://localhost:5000
if defined LAN_IP (
    echo   📱 Phone / Other PC : http://%LAN_IP%:5000
) else (
    echo   📱 Phone / Other PC : http://^<YOUR_WIFI_IP^>:5000
)
echo.
echo   🔑 Admin Username   : admin
echo   🔑 Admin Password   : admin123
echo  ============================================================
echo.
echo  NOTE: Ensure both devices are on the same Wi-Fi network.
echo  If phone cannot connect, run 'Allow_LAN_Firewall.bat' as Admin once.
echo.
echo  Keep the server window open while using the ERP system.
echo  Press any key to close this launcher window...
pause >nul
