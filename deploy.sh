#!/bin/bash

# 跑酷游戏网站部署脚本
# 使用方法: ./deploy.sh [平台]

set -e  # 遇到错误时退出

echo "🎮 跑酷游戏网站部署工具"
echo "========================"

# 检查必要文件
check_files() {
    echo "📁 检查游戏文件..."
    required_files=("index.html" "style.css" "game.js")

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ 错误: 缺少文件 $file"
            exit 1
        fi
    done
    echo "✅ 所有必要文件都存在"
}

# GitHub Pages部署
deploy_github() {
    echo "🚀 准备部署到GitHub Pages..."

    # 检查是否已初始化Git仓库
    if [ ! -d ".git" ]; then
        echo "📦 初始化Git仓库..."
        git init
        git add .
        git commit -m "Initial commit: Parkour game website"
    fi

    echo "📝 请按照以下步骤操作:"
    echo ""
    echo "1. 在GitHub创建新仓库:"
    echo "   https://github.com/new"
    echo "   仓库名: parkour-game"
    echo "   描述: A simple parkour game website"
    echo "   选择: Public"
    echo "   不要初始化README"
    echo ""
    echo "2. 添加远程仓库并推送:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/parkour-game.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "3. 启用GitHub Pages:"
    echo "   进入仓库设置 → Pages"
    echo "   分支: main"
    echo "   文件夹: / (root)"
    echo "   保存"
    echo ""
    echo "4. 访问你的网站:"
    echo "   https://YOUR_USERNAME.github.io/parkour-game"
    echo ""
    echo "✅ GitHub Pages部署指南完成"
}

# Netlify部署
deploy_netlify() {
    echo "🚀 准备部署到Netlify..."

    # 检查是否安装了Netlify CLI
    if ! command -v netlify &> /dev/null; then
        echo "📦 需要安装Netlify CLI..."
        echo "   请运行: npm install -g netlify-cli"
        echo "   或访问: https://docs.netlify.com/cli/get-started/"
        exit 1
    fi

    echo "📝 Netlify部署步骤:"
    echo ""
    echo "1. 登录Netlify:"
    echo "   netlify login"
    echo ""
    echo "2. 初始化项目:"
    echo "   netlify init"
    echo ""
    echo "3. 部署网站:"
    echo "   netlify deploy --prod"
    echo ""
    echo "4. 或使用拖拽部署:"
    echo "   访问: https://app.netlify.com/drop"
    echo "   拖拽游戏文件夹到页面"
    echo ""
    echo "✅ Netlify部署指南完成"
}

# Vercel部署
deploy_vercel() {
    echo "🚀 准备部署到Vercel..."

    # 检查是否安装了Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "📦 需要安装Vercel CLI..."
        echo "   请运行: npm install -g vercel"
        echo "   或访问: https://vercel.com/docs/cli"
        exit 1
    fi

    echo "📝 Vercel部署步骤:"
    echo ""
    echo "1. 部署网站:"
    echo "   vercel"
    echo ""
    echo "2. 生产环境部署:"
    echo "   vercel --prod"
    echo ""
    echo "3. 或使用GitHub集成:"
    echo "   连接GitHub仓库到Vercel"
    echo ""
    echo "✅ Vercel部署指南完成"
}

# 本地测试
local_test() {
    echo "🔧 本地测试..."

    # 检查Python
    if command -v python3 &> /dev/null; then
        echo "🐍 使用Python启动本地服务器..."
        echo "   访问: http://localhost:8000"
        echo "   停止: Ctrl+C"
        echo ""
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "🐍 使用Python启动本地服务器..."
        echo "   访问: http://localhost:8000"
        echo "   停止: Ctrl+C"
        echo ""
        python -m http.server 8000
    else
        echo "❌ 未找到Python，无法启动本地服务器"
        echo "   请安装Python或使用其他HTTP服务器"
    fi
}

# 显示帮助
show_help() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  github    显示GitHub Pages部署指南"
    echo "  netlify   显示Netlify部署指南"
    echo "  vercel    显示Vercel部署指南"
    echo "  local     启动本地测试服务器"
    echo "  all       显示所有部署选项"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 github    # GitHub Pages部署"
    echo "  $0 local     # 本地测试"
    echo ""
    echo "无需参数直接运行将检查文件并显示菜单"
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择部署方式:"
    echo "1) GitHub Pages (推荐新手)"
    echo "2) Netlify (简单快速)"
    echo "3) Vercel (适合开发者)"
    echo "4) 本地测试"
    echo "5) 显示所有选项"
    echo "6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice

    case $choice in
        1) deploy_github ;;
        2) deploy_netlify ;;
        3) deploy_vercel ;;
        4) local_test ;;
        5)
            deploy_github
            echo ""
            deploy_netlify
            echo ""
            deploy_vercel
            ;;
        6) echo "👋 再见！"; exit 0 ;;
        *) echo "❌ 无效选项"; show_menu ;;
    esac
}

# 主函数
main() {
    check_files

    if [ $# -eq 0 ]; then
        show_menu
    else
        case $1 in
            github) deploy_github ;;
            netlify) deploy_netlify ;;
            vercel) deploy_vercel ;;
            local) local_test ;;
            all)
                deploy_github
                echo ""
                deploy_netlify
                echo ""
                deploy_vercel
                ;;
            help|--help|-h) show_help ;;
            *)
                echo "❌ 未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    fi
}

# 运行主函数
main "$@"