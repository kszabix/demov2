@echo off
chcp 65001 >nul
title Project Isle - 3D Survival & Escape
echo =========================================================
echo   🌴 Project Isle: 3D Tropical Island Survival Engine 🌴
echo =========================================================
echo.
echo Ellenorizzuk a Node.js-t a rendszereden...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [HIBA] A Node.js nem talalhato a szamitogepeden!
    echo Kerlek toltsd le a legfrissebb LTS verziot innen:
    echo https://nodejs.org
    echo A telepites utan inditsd ujra ezt a fajlt.
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo.
    echo [INFO] Elso inditas: Fuggosegek telepitese folyamatban (npm install)...
    call npm install
)

echo.
echo [INFO] A jatekszerver inditasa es a bongeszo megnyitasa...
echo 💻 PC-n a jatek cime:   http://localhost:3000
echo 📱 Telefonrol nyisd meg az azonos Wi-Fi-re kapcsolodva (a lent kiirt IP cimmel)!
echo.

start http://localhost:3000
call npm run dev
pause
