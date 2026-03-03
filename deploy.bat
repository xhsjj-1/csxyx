@echo off
chcp 65001 >nul
title 🎮 跑酷游戏网站部署工具

echo.
echo ========================================
echo     跑酷游戏网站部署工具
echo ========================================
echo.

REM 检查必要文件
echo 📁 检查游戏文件...
if not exist "index.html" (
    echo ❌ 错误: 缺少文件 index.html
    pause
    exit /b 1
)
if not exist "style.css" (
    echo ❌ 错误: 缺少文件 style.css
    pause
    exit /b 1
)
if not exist "game.js" (
    echo ❌ 错误: 缺少文件 game.js
    pause
    exit /b 1
)
echo ✅ 所有必要文件都存在
echo.

:menu
echo 请选择部署方式:
echo 1) GitHub Pages (推荐新手)
echo 2) Netlify (简单快速)
echo 3) Vercel (适合开发者)
echo 4) 本地测试
echo 5) 显示所有选项
echo 6) 退出
echo.

set /p choice="请输入选项 (1-6): "

if "%choice%"=="1" goto github
if "%choice%"=="2" goto netlify
if "%choice%"=="3" goto vercel
if "%choice%"=="4" goto local
if "%choice%"=="5" goto all
if "%choice%"=="6" goto exit
echo ❌ 无效选项
goto menu

:github
echo.
echo 🚀 GitHub Pages部署指南
echo ========================
echo.
echo 请按照以下步骤操作:
echo.
echo 1. 在GitHub创建新仓库:
echo    https://github.com/new
echo    仓库名: parkour-game
echo    描述: A simple parkour game website
echo    选择: Public
echo    不要初始化README
echo.
echo 2. 使用Git上传文件:
echo    git init
echo    git add .
echo    git commit -m "Initial commit"
echo    git branch -M main
echo    git remote add origin https://github.com/YOUR_USERNAME/parkour-game.git
echo    git push -u origin main
echo.
echo 3. 启用GitHub Pages:
echo    进入仓库设置 ^> Pages
echo    分支: main
echo    文件夹: / (root)
echo    保存
echo.
echo 4. 访问你的网站:
echo    https://YOUR_USERNAME.github.io/parkour-game
echo.
pause
goto menu

:netlify
echo.
echo 🚀 Netlify部署指南
echo ==================
echo.
echo 请按照以下步骤操作:
echo.
echo 1. 访问Netlify网站:
echo    https://app.netlify.com
echo.
echo 2. 注册账号并登录
echo.
echo 3. 拖拽部署:
echo    访问: https://app.netlify.com/drop
echo    将游戏文件夹拖到页面
echo.
echo 4. 或使用Git部署:
echo    连接GitHub仓库
echo    自动部署
echo.
echo 5. 获得免费域名:
echo    https://your-game-name.netlify.app
echo.
pause
goto menu

:vercel
echo.
echo 🚀 Vercel部署指南
echo =================
echo.
echo 请按照以下步骤操作:
echo.
echo 1. 访问Vercel网站:
echo    https://vercel.com
echo.
echo 2. 注册账号并登录
echo.
echo 3. 导入项目:
echo    点击"New Project"
echo    导入GitHub仓库
echo    或拖拽文件夹
echo.
echo 4. 自动部署:
echo    Vercel会自动部署
echo    获得免费域名
echo.
echo 5. 访问网站:
echo    https://your-game-name.vercel.app
echo.
pause
goto menu

:local
echo.
echo 🔧 本地测试
echo ===========
echo.
echo 启动本地服务器...
echo 访问: http://localhost:8000
echo 停止: 按Ctrl+C
echo.

REM 检查Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    python -m http.server 8000
    goto menu
)

where python3 >nul 2>nul
if %errorlevel% equ 0 (
    python3 -m http.server 8000
    goto menu
)

echo ❌ 未找到Python，无法启动本地服务器
echo    请安装Python或使用其他HTTP服务器
echo.
pause
goto menu

:all
call :github
echo.
call :netlify
echo.
call :vercel
goto menu

:exit
echo 👋 再见！
timeout /t 2 >nul
exit /b 0