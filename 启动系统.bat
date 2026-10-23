@echo off
chcp 65001 >nul
echo ============================================
echo   🏫 校园景点导览系统 - 启动脚本
echo ============================================
echo.

cd /d "%~dp0"

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] 检测到 Python
    echo.
    echo 正在启动 Python HTTP 服务器...
    echo 访问地址: http://localhost:8000
    echo.
    echo 按 Ctrl+C 停止服务器
    echo ============================================
    python -m http.server 8000
    pause
    exit /b
)

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] 检测到 Node.js
    echo.
    echo 正在启动本地 HTTP 服务器...
    echo 访问地址: http://localhost:8000
    echo.
    echo 按 Ctrl+C 停止服务器
    echo ============================================
    npx http-server -p 8000 -c-1
    pause
    exit /b
)

echo [ERROR] 未检测到 Python 或 Node.js
echo 请安装其中之一:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo 或者直接双击 index.html 打开（部分功能可能受限）
pause
