#!/bin/bash

# 构建共享包和前端的脚本
# 确保共享包始终是最新的，避免导入错误

set -e

echo "🚀 开始构建共享包和前端..."

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 清理并构建共享包..."
cd packages/shared

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
pnpm clean

# 构建共享包
echo "🔨 构建共享包..."
pnpm build

# 验证构建结果
if [ ! -d "dist" ]; then
    echo "❌ 共享包构建失败：dist 目录不存在"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ 共享包构建失败：主入口文件不存在"
    exit 1
fi

echo "✅ 共享包构建成功"

# 返回项目根目录
cd "$PROJECT_ROOT"

echo "🎨 构建前端应用..."
cd apps/frontend

# 清理前端构建缓存
echo "🧹 清理前端构建缓存..."
rm -rf node_modules/.vite
rm -rf dist

# 确保 PWA 资源文件存在
echo "🖼️  检查 PWA 资源文件..."
if [ ! -f "public/screenshot-wide.png" ]; then
    echo "📸 创建缺失的截图文件..."
    cp public/logo.png public/screenshot-wide.png
fi

if [ ! -f "public/screenshot-narrow.png" ]; then
    cp public/logo.png public/screenshot-narrow.png
fi

# 构建前端
echo "🔨 构建前端应用..."
pnpm build

# 验证前端构建结果
if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败：dist 目录不存在"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ 前端构建失败：index.html 不存在"
    exit 1
fi

echo "✅ 前端构建成功"

# 返回项目根目录
cd "$PROJECT_ROOT"

echo "🎉 构建完成！"
echo ""
echo "📋 构建总结："
echo "  ✅ 共享包构建成功"
echo "  ✅ PWA 资源文件检查完成"
echo "  ✅ 前端应用构建成功"
echo ""
echo "📁 输出目录："
echo "  - 共享包: packages/shared/dist/"
echo "  - 前端应用: apps/frontend/dist/"
echo ""
echo "🚀 可以启动应用了："
echo "  cd apps/frontend && pnpm preview"
