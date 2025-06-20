# DevOps 与部署解决方案：现代化 CI/CD 流水线

## 技术概述

本项目采用现代化的 DevOps 实践，包括容器化部署、自动化 CI/CD 流水线、监控告警、日志收集等，实现了从开发到生产的全流程自动化管理。

## 🐳 容器化架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    负载均衡层                                │
│  ├─ Nginx Proxy      ├─ SSL Termination                   │
│  ├─ Rate Limiting     ├─ Static Assets                     │
│  └─ Health Checks     └─ Request Routing                   │
├─────────────────────────────────────────────────────────────┤
│                    应用容器层                                │
│  ├─ Frontend (Vue)    ├─ Backend (NestJS)                  │
│  ├─ Mobile (Capacitor)├─ Desktop (Electron)                │
│  └─ AI Services       └─ Background Jobs                   │
├─────────────────────────────────────────────────────────────┤
│                    数据存储层                                │
│  ├─ PostgreSQL       ├─ Redis Cache                        │
│  ├─ File Storage     ├─ Backup Storage                     │
│  └─ Log Storage       └─ Metrics Storage                   │
├─────────────────────────────────────────────────────────────┤
│                    监控观测层                                │
│  ├─ Prometheus       ├─ Grafana                            │
│  ├─ Loki Logs        ├─ Jaeger Tracing                     │
│  └─ AlertManager     └─ Health Monitoring                  │
└─────────────────────────────────────────────────────────────┘
```

### Docker 配置

#### 前端 Dockerfile

```dockerfile
# apps/frontend/Dockerfile
# 多阶段构建，优化镜像大小
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build:frontend

# 生产阶段
FROM nginx:alpine AS production

# 安装必要工具
RUN apk add --no-cache curl

# 复制构建产物
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY apps/frontend/default.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

#### 后端 Dockerfile

```dockerfile
# apps/backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma

# 构建应用
RUN npm run build:backend

# 生产阶段
FROM node:18-alpine AS production

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 切换到应用用户
USER nestjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main.js"]
```

#### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    container_name: yun-todolist-frontend
    ports:
      - '80:80'
      - '443:443'
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.frontend.rule=Host(`todolist.example.com`)'
      - 'traefik.http.routers.frontend.tls=true'
      - 'traefik.http.routers.frontend.tls.certresolver=letsencrypt'

  # 后端服务
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    container_name: yun-todolist-backend
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/todolist
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.backend.rule=Host(`api.todolist.example.com`)'
      - 'traefik.http.routers.backend.tls=true'

  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: yun-todolist-postgres
    environment:
      - POSTGRES_DB=todolist
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - '5432:5432'
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: yun-todolist-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: yun-todolist-nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

  # 监控服务
  prometheus:
    image: prom/prometheus:latest
    container_name: yun-todolist-prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - app-network
    restart: unless-stopped

  # Grafana 仪表板
  grafana:
    image: grafana/grafana:latest
    container_name: yun-todolist-grafana
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

## 🚀 CI/CD 流水线

### GitHub Actions 配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 代码质量检查
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # 安全扫描
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit
        run: npm audit --audit-level=high

  # 构建镜像
  build:
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, backend]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images:
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/${{ matrix.service }}/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # 部署到测试环境
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/yun-todolist
            git pull origin develop
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            docker system prune -f

      - name: Run health checks
        run: |
          sleep 30
          curl -f ${{ secrets.STAGING_URL }}/health || exit 1

  # 部署到生产环境
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/yun-todolist
            git pull origin main
            docker-compose pull
            docker-compose up -d
            docker system prune -f

      - name: Run smoke tests
        run: |
          sleep 60
          curl -f ${{ secrets.PRODUCTION_URL }}/health || exit 1
          curl -f ${{ secrets.PRODUCTION_URL }}/api/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# 配置变量
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 开始部署到 ${ENVIRONMENT} 环境..."

# 检查环境
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "❌ 找不到配置文件: $COMPOSE_FILE"
    exit 1
fi

# 备份当前版本
echo "📦 备份当前版本..."
docker-compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Image}}" > backup/deployment-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).txt

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose -f $COMPOSE_FILE pull

# 数据库迁移
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🗄️ 执行数据库迁移..."
    docker-compose -f $COMPOSE_FILE run --rm backend npm run prisma:migrate:deploy
fi

# 滚动更新
echo "🔄 执行滚动更新..."
docker-compose -f $COMPOSE_FILE up -d --remove-orphans

# 健康检查
echo "🏥 执行健康检查..."
sleep 30

for service in frontend backend; do
    if ! docker-compose -f $COMPOSE_FILE exec $service curl -f http://localhost/health; then
        echo "❌ $service 健康检查失败"
        echo "🔄 回滚到上一版本..."
        docker-compose -f $COMPOSE_FILE down
        # 这里可以添加回滚逻辑
        exit 1
    fi
done

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker system prune -f

echo "✅ 部署完成！"

# 发送通知
if command -v curl &> /dev/null && [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ ${ENVIRONMENT} 环境部署成功 - 版本: ${VERSION}\"}" \
        $SLACK_WEBHOOK
fi
```

## 📊 监控与观测

### Prometheus 配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert_rules.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  # Prometheus 自监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # 应用监控
  - job_name: 'yun-todolist-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Node Exporter
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Docker 监控
  - job_name: 'docker'
    static_configs:
      - targets: ['docker-exporter:9323']

  # PostgreSQL 监控
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis 监控
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx 监控
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### 告警规则

```yaml
# monitoring/alert_rules.yml
groups:
  - name: application.rules
    rules:
      # 应用可用性告警
      - alert: ApplicationDown
        expr: up{job="yun-todolist-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: '应用服务不可用'
          description: '{{ $labels.instance }} 应用服务已停止响应超过 1 分钟'

      # 高错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: '高错误率检测'
          description: '{{ $labels.instance }} 5xx 错误率超过 10%'

      # 响应时间告警
      - alert: HighResponseTime
        expr:
          histogram_quantile(0.95,
          rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: '响应时间过长'
          description: '{{ $labels.instance }} 95% 响应时间超过 1 秒'

  - name: infrastructure.rules
    rules:
      # CPU 使用率告警
      - alert: HighCPUUsage
        expr:
          100 - (avg by(instance)
          (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'CPU 使用率过高'
          description: '{{ $labels.instance }} CPU 使用率超过 80%'

      # 内存使用率告警
      - alert: HighMemoryUsage
        expr:
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) *
          100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: '内存使用率过高'
          description: '{{ $labels.instance }} 内存使用率超过 85%'

      # 磁盘空间告警
      - alert: DiskSpaceLow
        expr:
          (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
          > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: '磁盘空间不足'
          description: '{{ $labels.instance }} 磁盘使用率超过 90%'

  - name: database.rules
    rules:
      # 数据库连接数告警
      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: '数据库连接数过高'
          description: 'PostgreSQL 连接数超过 80'

      # 数据库锁等待告警
      - alert: DatabaseLockWait
        expr: pg_locks_count > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: '数据库锁等待'
          description: 'PostgreSQL 存在超过 10 个锁等待'
```

### 应用监控指标

```typescript
// apps/backend/src/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common'
import { register, Counter, Histogram, Gauge } from 'prom-client'

@Injectable()
export class MetricsService {
  // HTTP 请求计数器
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  })

  // HTTP 请求持续时间
  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  })

  // 活跃用户数
  private readonly activeUsers = new Gauge({
    name: 'active_users_total',
    help: 'Number of active users',
  })

  // 数据库连接池
  private readonly dbConnectionsActive = new Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
  })

  // AI API 调用
  private readonly aiApiCalls = new Counter({
    name: 'ai_api_calls_total',
    help: 'Total number of AI API calls',
    labelNames: ['type', 'status'],
  })

  // AI Token 使用量
  private readonly aiTokensUsed = new Counter({
    name: 'ai_tokens_used_total',
    help: 'Total number of AI tokens used',
    labelNames: ['type'],
  })

  constructor() {
    // 注册默认指标
    register.registerMetric(this.httpRequestsTotal)
    register.registerMetric(this.httpRequestDuration)
    register.registerMetric(this.activeUsers)
    register.registerMetric(this.dbConnectionsActive)
    register.registerMetric(this.aiApiCalls)
    register.registerMetric(this.aiTokensUsed)
  }

  // 记录 HTTP 请求
  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number
  ) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() })
    this.httpRequestDuration.observe({ method, route }, duration)
  }

  // 更新活跃用户数
  setActiveUsers(count: number) {
    this.activeUsers.set(count)
  }

  // 更新数据库连接数
  setDbConnections(count: number) {
    this.dbConnectionsActive.set(count)
  }

  // 记录 AI API 调用
  recordAiApiCall(type: string, status: 'success' | 'error') {
    this.aiApiCalls.inc({ type, status })
  }

  // 记录 AI Token 使用
  recordAiTokenUsage(type: string, tokens: number) {
    this.aiTokensUsed.inc({ type }, tokens)
  }

  // 获取所有指标
  async getMetrics(): Promise<string> {
    return register.metrics()
  }

  // 重置指标
  resetMetrics() {
    register.resetMetrics()
  }
}
```

### 健康检查端点

```typescript
// apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus'
import { PrismaHealthIndicator } from './prisma-health.indicator'
import { RedisHealthIndicator } from './redis-health.indicator'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  @HealthCheck()
  check() {
    return this.health.check([
      // 数据库健康检查
      () => this.prismaHealth.isHealthy('database'),

      // Redis 健康检查
      () => this.redisHealth.isHealthy('redis'),

      // 内存使用检查
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),

      // 磁盘空间检查
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ])
  }

  @Get('ready')
  @ApiOperation({ summary: '就绪检查' })
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ])
  }

  @Get('live')
  @ApiOperation({ summary: '存活检查' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  }
}
```

## 🔧 运维脚本

### 备份脚本

```bash
#!/bin/bash
# scripts/backup.sh

set -e

# 配置
BACKUP_DIR="/opt/backups/yun-todolist"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "🗄️ 开始备份数据库..."

# 备份 PostgreSQL
docker exec yun-todolist-postgres pg_dump -U postgres todolist | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# 备份 Redis
docker exec yun-todolist-redis redis-cli --rdb /data/dump.rdb
docker cp yun-todolist-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 备份应用数据
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz /opt/yun-todolist/data

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/yun-todolist/docker-compose*.yml /opt/yun-todolist/.env*

echo "📦 备份完成，文件保存在: $BACKUP_DIR"

# 清理旧备份
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete

echo "🧹 清理 $RETENTION_DAYS 天前的备份文件"

# 上传到云存储（可选）
if [[ -n "$AWS_S3_BUCKET" ]]; then
    echo "☁️ 上传备份到 S3..."
    aws s3 sync $BACKUP_DIR s3://$AWS_S3_BUCKET/backups/yun-todolist/
fi

echo "✅ 备份任务完成"
```

### 日志轮转配置

```bash
# /etc/logrotate.d/yun-todolist
/opt/yun-todolist/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker kill -s USR1 yun-todolist-backend 2>/dev/null || true
        docker kill -s USR1 yun-todolist-nginx 2>/dev/null || true
    endscript
}
```

## 🎯 核心学习要点

### 1. 容器化技术

- **多阶段构建**：优化镜像大小和安全性
- **健康检查**：确保容器服务可用性
- **资源限制**：合理分配 CPU 和内存
- **网络隔离**：使用 Docker 网络进行服务隔离

### 2. CI/CD 流水线

- **自动化测试**：单元测试、集成测试、安全扫描
- **多环境部署**：测试、预生产、生产环境
- **滚动更新**：零停机部署策略
- **回滚机制**：快速恢复到上一版本

### 3. 监控观测

- **指标收集**：Prometheus + Grafana
- **日志聚合**：结构化日志和集中收集
- **链路追踪**：分布式系统调用链分析
- **告警通知**：及时发现和响应问题

### 4. 运维自动化

- **基础设施即代码**：Docker Compose 配置管理
- **自动化备份**：数据安全保障
- **日志管理**：轮转和归档策略
- **性能优化**：资源使用监控和调优

## 📝 简历技术亮点

### DevOps 技术亮点

- **Docker 容器化**：多阶段构建优化
- **Kubernetes 编排**：生产级容器管理
- **CI/CD 自动化**：GitHub Actions 流水线
- **监控告警体系**：Prometheus + Grafana

### 运维技术亮点

- **基础设施即代码**：声明式配置管理
- **自动化部署**：零停机滚动更新
- **安全扫描**：代码和镜像安全检测
- **性能监控**：全链路可观测性

### 工程技术亮点

- **高可用架构**：负载均衡和故障转移
- **数据备份策略**：自动化备份和恢复
- **日志管理**：结构化日志和分析
- **成本优化**：资源使用效率提升
