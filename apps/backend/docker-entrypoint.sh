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
echo "🔗 Database URL: ${DATABASE_URL}"

# 更可靠的数据库连接检查函数
check_database_connection() {
  echo "⏳ Checking database connection..."

  # 使用 node 脚本进行更精确的连接测试
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function testConnection() {
      try {
        await prisma.\$connect();
        console.log('✅ Database connection successful');
        await prisma.\$disconnect();
        process.exit(0);
      } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
      }
    }

    testConnection();
  " 2>/dev/null
}

# 等待数据库连接（设置超时）
echo "⏳ Waiting for database connection..."
RETRY_COUNT=0
MAX_RETRIES=30

until check_database_connection; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database connection timeout after ${MAX_RETRIES} attempts"
    echo "🔍 Please check your DATABASE_URL configuration"
    echo "🔍 Current DATABASE_URL format: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
    exit 1
  fi
  echo "⏳ Database is unavailable - attempt ${RETRY_COUNT}/${MAX_RETRIES}"
  sleep 3
done

echo "✅ Database is ready!"

# 生成 Prisma 客户端
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# 运行数据库迁移
echo "🔄 Running database migrations..."
pnpm prisma migrate deploy || {
  echo "⚠️  Migration failed, trying db push..."
  pnpm prisma db push --accept-data-loss
}

echo "✅ Database setup completed!"

# 启动应用
echo "🎯 Starting the application on port ${PORT:-3000}..."
exec node dist/main.js
