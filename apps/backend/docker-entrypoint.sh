#!/bin/sh
set -e

echo "🚀 Starting Yun AI TodoList Backend..."

# 等待数据库连接
echo "⏳ Waiting for database connection..."
until pnpm prisma db push --accept-data-loss 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# 运行数据库迁移
echo "🔄 Running database migrations..."
pnpm prisma migrate deploy

# 生成 Prisma 客户端（如果需要）
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# 启动应用
echo "🎯 Starting the application..."
exec node dist/main.js
