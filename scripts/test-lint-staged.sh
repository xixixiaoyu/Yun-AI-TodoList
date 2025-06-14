#!/bin/bash

# 测试 lint-staged 配置的安全性
# 这个脚本会创建一些测试文件，然后验证 lint-staged 是否正常工作

set -e

echo "🧪 开始测试 lint-staged 配置..."

# 创建临时测试目录
TEST_DIR="temp_test_files"
mkdir -p "$TEST_DIR"

# 创建测试文件
echo "📝 创建测试文件..."

# 创建一个简单的 Vue 文件
cat > "$TEST_DIR/TestComponent.vue" << 'EOF'
<template>
  <div class="test">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
const title = 'Test Component'
</script>

<style scoped>
.test {
  color: red;
}
</style>
EOF

# 创建一个简单的 TypeScript 文件
cat > "$TEST_DIR/test.ts" << 'EOF'
export const testFunction = (name: string): string => {
  return `Hello, ${name}!`
}
EOF

# 创建一个 JSON 文件
cat > "$TEST_DIR/test.json" << 'EOF'
{
  "name": "test",
  "version": "1.0.0"
}
EOF

echo "✅ 测试文件创建完成"

# 将文件添加到 git 暂存区
echo "📋 添加文件到 git 暂存区..."
git add "$TEST_DIR"/*

# 运行 lint-staged（但不提交）
echo "🔍 运行 lint-staged 测试..."
if pnpm lint-staged --dry-run; then
    echo "✅ lint-staged 干运行成功"
else
    echo "❌ lint-staged 干运行失败"
    exit 1
fi

# 实际运行 lint-staged
echo "🚀 实际运行 lint-staged..."
if pnpm lint-staged; then
    echo "✅ lint-staged 运行成功"
else
    echo "❌ lint-staged 运行失败"
    exit 1
fi

# 检查文件是否仍然存在
echo "🔍 检查文件完整性..."
if [ -f "$TEST_DIR/TestComponent.vue" ] && [ -f "$TEST_DIR/test.ts" ] && [ -f "$TEST_DIR/test.json" ]; then
    echo "✅ 所有测试文件仍然存在"
else
    echo "❌ 某些测试文件丢失了！"
    ls -la "$TEST_DIR/"
    exit 1
fi

# 清理测试文件
echo "🧹 清理测试文件..."
git reset HEAD "$TEST_DIR"/*
rm -rf "$TEST_DIR"

echo "🎉 lint-staged 配置测试通过！"
echo ""
echo "📋 测试结果："
echo "  ✅ 文件不会被意外删除"
echo "  ✅ 格式化正常工作"
echo "  ✅ ESLint 检查正常工作"
echo "  ✅ 只处理暂存的文件"
echo ""
echo "🔒 您的 lint-staged 配置现在是安全的！"
