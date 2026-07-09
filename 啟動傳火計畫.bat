@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   傳火計畫啟動中...
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo 找不到 Node.js，請先安裝 Node.js 18 或更新版本。
  pause
  exit /b 1
)
start "" http://localhost:3000
node server.js
pause
