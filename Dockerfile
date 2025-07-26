# ===========================================
# Yun AI TodoList - 多阶段 Docker 构建
# 支持 pnpm monorepo 架构
# ===========================================

# ===========================================
# 基础镜像 - 包含 Node.js 和系统依赖
# ===========================================
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖和 pnpm
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    curl \
    dumb-init \
    && npm install -g pnpm@9.0.0

# 设置 pnpm 存储目录
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ===========================================
# 依赖安装阶段 - 安装所有 workspace 依赖
# ===========================================
FROM base AS deps

# 复制 workspace 配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件以利用 Docker 缓存
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
# 只复制存在的 package.json 文件，避免空目录问题
COPY packages/shared/package.json ./packages/shared/
COPY tools/*/package.json ./tools/*/

# 复制 Prisma schema 文件（postinstall 脚本需要）
COPY apps/backend/prisma ./apps/backend/prisma

# 安装所有依赖（包括开发依赖，用于构建）
RUN pnpm install --frozen-lockfile

# ===========================================
# 前端构建阶段
# ===========================================
FROM deps AS frontend-builder

# 复制前端源代码和共享包
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# 构建前端应用
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter frontend build

# ===========================================
# 后端构建阶段
# ===========================================
FROM deps AS backend-builder

# 复制后端源代码和共享包
COPY apps/backend ./apps/backend
COPY packages ./packages

# 生成 Prisma 客户端
RUN cd apps/backend && pnpm prisma generate

# 构建后端应用
RUN pnpm --filter backend build

# 创建生产依赖
RUN pnpm --filter backend --prod deploy /app/backend-prod

# ===========================================
# 前端生产镜像 - Nginx
# ===========================================
FROM nginx:1.25-alpine AS frontend

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# 复制构建产物
COPY --from=frontend-builder /app/apps/frontend/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# 创建必要的目录并设置权限
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 切换到非 root 用户
USER nginx-app

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

# ===========================================
# 后端生产镜像
# ===========================================
FROM node:18-alpine AS backend

# 安装系统依赖
RUN apk add --no-cache dumb-init curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制生产依赖和构建产物
COPY --from=backend-builder /app/backend-prod ./
COPY --from=backend-builder /app/apps/backend/dist ./dist
COPY --from=backend-builder /app/apps/backend/prisma ./prisma

# 复制启动脚本和健康检查脚本
COPY apps/backend/docker-entrypoint.sh apps/backend/healthcheck.js ./
RUN chmod +x docker-entrypoint.sh

# 更改文件所有者
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露常用端口 (Render 通常使用 10000)
EXPOSE 3000 10000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["./docker-entrypoint.sh"]

# ===========================================
# 开发环境 - 前端服务
# ===========================================
FROM base AS frontend-dev

# 设置环境变量
ENV NODE_ENV=development
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY tools/*/package.json ./tools/*/

# 复制 TypeScript 配置文件
COPY tools/typescript-config ./tools/typescript-config

# 复制 TypeScript 配置文件
COPY tools/typescript-config ./tools/typescript-config

# 复制前端配置文件
COPY apps/frontend/tsconfig*.json ./apps/frontend/
COPY apps/frontend/vite*.config.ts ./apps/frontend/
COPY apps/frontend/uno.config.ts ./apps/frontend/
COPY apps/frontend/eslint.config.js ./apps/frontend/
COPY tsconfig.json ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S developer -u 1001 -G nodejs

# 设置权限
RUN chown -R developer:nodejs /app
USER developer

# 暴露端口
EXPOSE 5173

# 启动开发服务器
CMD ["pnpm", "--filter", "frontend", "dev", "--host", "0.0.0.0"]

# ===========================================
# 开发环境 - 后端服务
# ===========================================
FROM base AS backend-dev

# 设置环境变量
ENV NODE_ENV=development

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY tools/*/package.json ./tools/*/

# 复制后端配置文件
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma
COPY tsconfig.json ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S developer -u 1001 -G nodejs

# 设置权限
RUN chown -R developer:nodejs /app
USER developer

# 暴露端口
EXPOSE 3000 9229

# 启动开发服务器
CMD ["pnpm", "--filter", "backend", "dev"]
