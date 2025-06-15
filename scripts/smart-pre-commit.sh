#!/bin/bash

# 智能 pre-commit 检查脚本
# 根据提交的文件数量和类型，选择合适的检查策略

set -e

echo "🔍 开始智能 pre-commit 检查..."

# 获取暂存文件信息
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
    echo "⚠️  没有暂存文件，跳过检查"
    exit 0
fi

STAGED_COUNT=$(echo "$STAGED_FILES" | wc -l)
STAGED_TS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(vue|ts|tsx|js|jsx)$' | wc -l)
STAGED_CONFIG_FILES=$(echo "$STAGED_FILES" | grep -E '\.(json|yaml|yml|toml)$' | wc -l)
STAGED_STYLE_FILES=$(echo "$STAGED_FILES" | grep -E '\.(css|scss|sass|less)$' | wc -l)

echo "📊 暂存文件统计："
echo "  - 总文件数: $STAGED_COUNT"
echo "  - TS/Vue 文件: $STAGED_TS_FILES"
echo "  - 配置文件: $STAGED_CONFIG_FILES"
echo "  - 样式文件: $STAGED_STYLE_FILES"

# 检查是否有环境变量控制检查级别
COMMIT_CHECK_LEVEL=${COMMIT_CHECK_LEVEL:-"auto"}

# 根据文件数量和类型决定检查策略
if [ "$COMMIT_CHECK_LEVEL" = "full" ]; then
    echo "🚀 强制完整检查模式"
    CHECK_MODE="full"
elif [ "$COMMIT_CHECK_LEVEL" = "fast" ]; then
    echo "⚡ 强制快速检查模式"
    CHECK_MODE="fast"
elif [ "$STAGED_COUNT" -gt 30 ]; then
    echo "📦 大量文件变更 (>30)，使用完整检查"
    CHECK_MODE="full"
elif [ "$STAGED_TS_FILES" -gt 15 ]; then
    echo "🔧 大量 TS/Vue 文件变更 (>15)，使用完整检查"
    CHECK_MODE="full"
elif [ "$STAGED_TS_FILES" -eq 0 ] && [ "$STAGED_CONFIG_FILES" -gt 0 ]; then
    echo "⚙️  仅配置文件变更，使用快速检查"
    CHECK_MODE="fast"
elif [ "$STAGED_TS_FILES" -eq 0 ] && [ "$STAGED_STYLE_FILES" -gt 0 ]; then
    echo "🎨 仅样式文件变更，使用快速检查"
    CHECK_MODE="fast"
else
    echo "⚡ 适量文件变更，使用快速检查"
    CHECK_MODE="fast"
fi

# 执行相应的检查
if [ "$CHECK_MODE" = "full" ]; then
    echo ""
    echo "🔍 执行完整质量检查..."
    echo "  - 类型检查"
    echo "  - 代码格式化"
    echo "  - ESLint 检查"
    echo ""

    # 分步执行，提供更好的错误信息
    echo "🔧 1/3 修复代码格式..."
    if ! pnpm run format; then
        echo "❌ 代码格式化失败！"
        exit 1
    fi

    echo "🔍 2/3 修复 ESLint 问题..."
    if ! pnpm run lint:fix; then
        echo "❌ ESLint 修复失败！"
        exit 1
    fi

    echo "🔍 3/3 类型检查..."
    if ! pnpm run type-check; then
        echo ""
        echo "❌ TypeScript 类型检查失败！"
        echo "💡 提示："
        echo "  - 检查 TypeScript 类型错误"
        echo "  - 运行 'pnpm run type-check' 查看详细错误"
        echo ""
        exit 1
    fi

    echo "✅ 完整质量检查通过"
else
    echo ""
    echo "⚡ 执行快速检查（仅暂存文件）..."
    echo "  - 代码格式化"
    echo "  - ESLint 修复"
    echo ""
fi

# 运行 lint-staged 处理暂存文件
echo "🎨 处理暂存文件..."
if ! pnpm lint-staged; then
    echo ""
    echo "❌ 暂存文件处理失败！"
    echo "💡 提示："
    echo "  - 检查文件格式是否正确"
    echo "  - 检查是否有语法错误"
    echo ""
    exit 1
fi

echo ""
echo "🎉 Pre-commit 检查完成！"
echo "📝 提交信息提示："
echo "  - 使用清晰的提交信息"
echo "  - 遵循约定式提交规范"
echo ""

# 显示检查统计
if [ "$CHECK_MODE" = "full" ]; then
    echo "📊 本次检查："
    echo "  ✅ 完整项目质量检查"
    echo "  ✅ 暂存文件处理"
    echo "  🕐 检查耗时较长但质量有保障"
else
    echo "📊 本次检查："
    echo "  ✅ 快速暂存文件检查"
    echo "  ⚡ 检查速度快"
    echo "  💡 如需完整检查，运行: COMMIT_CHECK_LEVEL=full git commit"
fi

echo ""
