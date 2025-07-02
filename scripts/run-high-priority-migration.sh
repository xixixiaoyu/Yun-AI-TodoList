#!/bin/bash

# 高优先级数据库改进迁移脚本
# 用于安全地执行数据库结构改进

set -e

echo "🚀 开始执行高优先级数据库改进..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

# 进入后端目录
cd apps/backend

echo "📋 当前数据库状态检查..."
pnpm prisma db pull --print

echo "🔄 生成 Prisma 客户端..."
pnpm prisma generate

echo "📊 检查待执行的迁移..."
pnpm prisma migrate status

echo "⚠️  即将执行数据库迁移，这将："
echo "   1. 重构 User 表结构（移除 JSON 字段）"
echo "   2. 创建 UserPreferences 表"
echo "   3. 迁移现有用户偏好数据"
echo "   4. 添加软删除支持"
echo "   5. 添加版本控制字段"
echo "   6. 创建性能优化索引"
echo ""

read -p "确认执行迁移？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 迁移已取消"
    exit 1
fi

echo "🔄 执行数据库迁移..."
pnpm prisma migrate deploy

echo "✅ 数据库迁移完成！"

echo "🔍 验证迁移结果..."
pnpm prisma db pull --print

echo "📈 数据库统计信息..."
psql $DATABASE_URL -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo "🎉 高优先级数据库改进完成！"
echo ""
echo "📝 改进总结："
echo "   ✅ User 表结构优化完成"
echo "   ✅ UserPreferences 表创建完成"
echo "   ✅ 软删除机制启用"
echo "   ✅ 版本控制字段添加"
echo "   ✅ 性能索引创建完成"
echo ""
echo "🔧 下一步建议："
echo "   1. 重启后端服务以应用新的数据模型"
echo "   2. 运行集成测试验证功能"
echo "   3. 监控数据库性能指标"
