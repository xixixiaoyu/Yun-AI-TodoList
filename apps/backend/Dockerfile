# 多阶段构建 - 依赖安装阶段
FROM node:18-alpine AS deps

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache libc6-compat python3 make g++

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile --prod=false

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码和配置文件
COPY . .

# 生成 Prisma 客户端
RUN pnpm prisma generate

# 构建应用
RUN pnpm build

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod=true

# 生产运行阶段
FROM node:18-alpine AS runner

# 安装系统依赖
RUN apk add --no-cache dumb-init curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制生产依赖
COPY --from=builder /app/node_modules ./node_modules

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制 Prisma 相关文件
COPY --from=builder /app/prisma ./prisma

# 复制启动脚本和健康检查脚本
COPY docker-entrypoint.sh healthcheck.js ./
RUN chmod +x docker-entrypoint.sh

# 更改文件所有者
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["./docker-entrypoint.sh"]
