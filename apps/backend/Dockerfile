# 使用 Node.js 18 Alpine 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json
COPY package.json ./

# 安装依赖
RUN pnpm install

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN pnpm prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 复制启动脚本和健康检查脚本
COPY docker-entrypoint.sh healthcheck.js ./
RUN chmod +x docker-entrypoint.sh

# 更改文件所有者
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["./docker-entrypoint.sh"]
