#!/bin/sh
set -e

echo "🚀 Starting Yun AI TodoList Backend..."

# 检查必要的环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📍 Environment: ${NODE_ENV:-production}"
echo "🔌 Port: ${PORT:-3000}"

# 等待数据库连接（设置超时）
echo "⏳ Waiting for database connection..."
RETRY_COUNT=0
MAX_RETRIES=30

until pnpm prisma db push --accept-data-loss 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database connection timeout after ${MAX_RETRIES} attempts"
    echo "🔍 Please check your DATABASE_URL configuration"
    exit 1
  fi
  echo "⏳ Database is unavailable - attempt ${RETRY_COUNT}/${MAX_RETRIES}"
  sleep 2
done

echo "✅ Database is ready!"

# 生成 Prisma 客户端
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# 启动应用
echo "🎯 Starting the application on port ${PORT:-3000}..."
exec node dist/main.js
