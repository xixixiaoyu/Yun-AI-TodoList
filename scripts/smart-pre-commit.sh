#!/bin/bash

# 智能 pre-commit 检查脚本
# 简化版本：提供快速和完整两种检查模式

set -e

# 记录开始时间
START_TIME=$(date +%s)

echo "🔍 开始 pre-commit 检查..."

# 获取暂存文件信息
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
    echo "⚠️  没有暂存文件，跳过检查"
    exit 0
fi

STAGED_COUNT=$(echo "$STAGED_FILES" | wc -l)
STAGED_CODE_FILES=$(echo "$STAGED_FILES" | grep -E '\.(vue|ts|tsx|js|jsx)$' | wc -l || echo "0")

echo "📊 暂存文件统计："
echo "  - 总文件数: $STAGED_COUNT"
echo "  - 代码文件: $STAGED_CODE_FILES"

# 简化的检查策略
COMMIT_CHECK_LEVEL=${COMMIT_CHECK_LEVEL:-"auto"}

if [ "$COMMIT_CHECK_LEVEL" = "full" ]; then
    echo "🚀 完整检查模式"
    CHECK_MODE="full"
elif [ "$COMMIT_CHECK_LEVEL" = "fast" ]; then
    echo "⚡ 快速检查模式"
    CHECK_MODE="fast"
elif [ "$STAGED_COUNT" -gt 20 ] || [ "$STAGED_CODE_FILES" -gt 10 ]; then
    echo "📦 大量文件变更，使用完整检查"
    CHECK_MODE="full"
else
    echo "⚡ 使用快速检查模式"
    CHECK_MODE="fast"
fi

# 执行检查
echo ""
if [ "$CHECK_MODE" = "full" ]; then
    echo "🔍 执行完整检查..."

    # 1. 格式化代码（使用缓存）
    echo "🎨 1/3 格式化代码..."
    if ! pnpm run format; then
        echo "❌ 代码格式化失败！"
        exit 1
    fi

    # 2. 修复 ESLint 问题（使用缓存）
    echo "🔧 2/3 修复 ESLint 问题..."
    if ! pnpm run lint:fix; then
        echo "❌ ESLint 修复失败！"
        exit 1
    fi

    # 3. 类型检查
    echo "🔍 3/3 类型检查..."
    if ! pnpm run type-check; then
        echo "❌ TypeScript 类型检查失败！"
        echo "💡 运行 'pnpm run type-check' 查看详细错误"
        exit 1
    fi

    echo "✅ 完整检查通过"
else
    echo "⚡ 执行快速检查（仅暂存文件）..."
fi

# 运行 lint-staged 处理暂存文件（已启用缓存）
echo "🎨 处理暂存文件..."
if ! pnpm lint-staged; then
    echo "❌ 暂存文件处理失败！"
    echo "💡 检查文件格式和语法错误"
    exit 1
fi

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "🎉 Pre-commit 检查完成！"
echo "⏱️  总耗时: ${DURATION}s"

# 显示检查统计和提示
if [ "$CHECK_MODE" = "full" ]; then
    echo "📊 完整检查模式："
    echo "  ✅ 项目级格式化和检查"
    echo "  ✅ 类型检查"
    echo "  ✅ 暂存文件处理"
    echo "  💡 使用缓存加速后续检查"
else
    echo "📊 快速检查模式："
    echo "  ✅ 暂存文件处理"
    echo "  ⚡ 使用缓存提升速度"
    echo "  💡 完整检查: COMMIT_CHECK_LEVEL=full git commit"
fi

echo ""
echo "📝 提交信息规范："
echo "  - 使用约定式提交格式"
echo "  - 例如: feat: 添加新功能"
echo ""
