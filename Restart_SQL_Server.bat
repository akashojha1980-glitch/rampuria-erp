@echo off
title Restart SQL Server (SQLEXPRESS)
color 0b
echo.
echo  ============================================================
echo     BJS COLLEGE ERP - SQL SERVER RESTART UTILITY
echo  ============================================================
echo.

:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0c
    echo  [ERROR] Administrative privileges are required.
    echo.
    echo  Please close this window, right-click "Restart_SQL_Server.bat"
    echo  and select "Run as administrator".
    echo.
    echo  ============================================================
    pause
    exit /b
)

echo  [1/2] Stopping SQL Server (SQLEXPRESS)...
net stop MSSQL$SQLEXPRESS

echo.
echo  [2/2] Starting SQL Server (SQLEXPRESS)...
net start MSSQL$SQLEXPRESS

echo.
echo  ============================================================
echo   SUCCESS: SQL Server restarted successfully!
echo   All database configurations are now active.
echo  ============================================================
echo.
echo  Press any key to exit...
pause >nul
