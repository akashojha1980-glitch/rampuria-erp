@echo off
:: Self-elevation script to run as Administrator
title BJS Rampuria ERP - Configure Windows Firewall for LAN Access
color 0b

echo.
echo ============================================================
echo   BJS RAMPURIA JAIN LAW COLLEGE ERP - LAN FIREWALL SETUP
echo ============================================================
echo.

:: Check for Administrative permissions
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

echo [1/2] Adding inbound firewall rule for Port 5000 (TCP)...
netsh advfirewall firewall delete rule name="BJS Rampuria ERP LAN (Port 5000)" >nul 2>&1
netsh advfirewall firewall add rule name="BJS Rampuria ERP LAN (Port 5000)" dir=in action=allow protocol=TCP localport=5000 profile=any >nul

if %errorlevel% equ 0 (
    color 0a
    echo [OK] Firewall rule added successfully!
) else (
    color 0c
    echo [ERROR] Failed to add firewall rule. Please check Windows Defender Firewall service.
)

echo.
echo [2/2] Detecting LAN IPv4 Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1 delims= " %%b in ("%%a") do (
        echo %%b | findstr /v "169.254." >nul && if not defined LAN_IP set "LAN_IP=%%b"
    )
)

echo.
echo ============================================================
echo   LAN ACCESS IS NOW FULLY UNLOCKED!
echo.
if defined LAN_IP (
    echo   📱 Open on Phone / Other PC:  http://%LAN_IP%:5000
) else (
    echo   📱 Open on Phone / Other PC:  http://^<YOUR_WIFI_IP^>:5000
)
echo.
echo   💻 Open on this PC:           http://localhost:5000
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
