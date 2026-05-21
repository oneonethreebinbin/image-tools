@echo off
chcp 65001 >nul
echo ==============================================
echo   AI 去水印服务启动脚本
echo   基于 LaMa (Large Mask Inpainting) 模型
echo ==============================================
echo.

cd /d "%~dp0"

REM 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 检查并安装依赖
echo [检查] 正在检查依赖...
pip show simple-lama-inpainting >nul 2>&1
if %errorlevel% neq 0 (
    echo [安装] 首次运行，正在安装依赖（需要几分钟）...
    echo.
    pip install -r requirements.txt --break-system-packages 2>nul || pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请手动运行:
        echo   pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo.
    echo [完成] 依赖安装成功！
)

echo.
echo [启动] 正在启动 AI 去水印服务...
echo.
echo 服务地址: http://localhost:8765
echo API 文档: http://localhost:8765/docs
echo.
echo 按 Ctrl+C 停止服务
echo ==============================================
echo.

python server.py

pause
