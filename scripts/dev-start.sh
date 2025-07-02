#!/bin/bash

# 开发环境启动脚本
# 确保共享包构建完成后再启动前端开发服务器

set -e

echo "🚀 启动开发环境..."

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 检查并构建共享包
echo "📦 检查共享包状态..."
if [ ! -d "packages/shared/dist" ] || [ ! -f "packages/shared/dist/index.js" ]; then
    echo "🔨 共享包未构建，开始构建..."
    cd packages/shared
    pnpm build
    cd "$PROJECT_ROOT"
    echo "✅ 共享包构建完成"
else
    echo "✅ 共享包已存在"
fi

# 检查 PWA 资源文件
echo "🖼️  检查 PWA 资源文件..."
cd apps/frontend/public

if [ ! -f "screenshot-wide.png" ]; then
    echo "📸 创建缺失的宽屏截图..."
    cp logo.png screenshot-wide.png
fi

if [ ! -f "screenshot-narrow.png" ]; then
    echo "📸 创建缺失的窄屏截图..."
    cp logo.png screenshot-narrow.png
fi

echo "✅ PWA 资源文件检查完成"

# 返回前端目录
cd "$PROJECT_ROOT/apps/frontend"

# 清理开发缓存
echo "🧹 清理开发缓存..."
rm -rf node_modules/.vite

# 启动开发服务器
echo "🎨 启动前端开发服务器..."
echo ""
echo "📋 开发服务器信息："
echo "  - 前端地址: http://localhost:3001"
echo "  - 后端地址: http://localhost:3000"
echo ""
echo "💡 提示："
echo "  - 如需同时启动后端，请运行: pnpm dev:all"
echo "  - 如需重新构建共享包，请运行: pnpm build:shared"
echo ""

pnpm dev
