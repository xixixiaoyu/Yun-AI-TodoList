# Docker 部署指南

本文档详细介绍如何使用 Docker 部署 Yun AI TodoList 应用。

## 📋 目录

- [项目概述](#项目概述)
- [部署前准备](#部署前准备)
- [本地 Docker 部署](#本地-docker-部署)
- [生产环境部署](#生产环境部署)
- [VPS 服务器部署](#vps-服务器部署)
- [环境变量配置](#环境变量配置)
- [数据持久化](#数据持久化)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)
- [性能优化](#性能优化)

## 🎯 项目概述

Yun AI TodoList 提供了完整的 Docker 容器化解决方案：

- **多阶段构建**：优化镜像大小和构建效率
- **生产优化**：包含安全配置和性能调优
- **服务编排**：使用 Docker Compose 管理多服务
- **数据持久化**：PostgreSQL 和 Redis 数据持久化
- **健康检查**：内置服务健康监控
- **日志管理**：结构化日志输出

## 🚀 部署前准备

### 1. 系统要求

**最低配置：**

- CPU: 2 核心
- 内存: 4GB RAM
- 存储: 20GB 可用空间
- 操作系统: Linux/macOS/Windows

**推荐配置：**

- CPU: 4 核心
- 内存: 8GB RAM
- 存储: 50GB SSD
- 网络: 稳定的互联网连接

### 2. 安装 Docker

**Ubuntu/Debian:**

```bash
# 更新包索引
sudo apt update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**macOS:**

```bash
# 使用 Homebrew
brew install --cask docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Windows:**

```bash
# 下载并安装 Docker Desktop
# https://www.docker.com/products/docker-desktop

# 或使用 Chocolatey
choco install docker-desktop
```

### 3. 验证安装

```bash
# 检查 Docker 版本
docker --version
docker compose version

# 测试 Docker 运行
docker run hello-world
```

## 🏠 本地 Docker 部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/Yun-AI-TodoList.git
cd Yun-AI-TodoList
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 3. 开发环境部署

```bash
# 启动开发环境
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f
```

**访问地址：**

- 前端: http://localhost:3001
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api/v1/docs
- 数据库: localhost:5432

### 4. 停止服务

```bash
# 停止服务
docker compose -f docker-compose.dev.yml down

# 停止并删除数据卷
docker compose -f docker-compose.dev.yml down -v
```

## 🏭 生产环境部署

### 1. 配置生产环境变量

创建 `.env.production` 文件：

```bash
# 复制生产环境模板
cp .env.production.example .env.production

# 编辑生产环境变量
nano .env.production
```

**重要配置项：**

```bash
# 应用环境
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# 数据库（使用强密码）
POSTGRES_PASSWORD=your-strong-password-min-16-chars
POSTGRES_USER=todolist_user
POSTGRES_DB=yun_ai_todolist

# Redis（使用强密码）
REDIS_PASSWORD=your-redis-strong-password

# JWT（生成强密钥）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# AI 服务
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. 生产环境部署

```bash
# 构建并启动生产环境
docker compose -f docker-compose.prod.yml up -d --build

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看启动日志
docker compose -f docker-compose.prod.yml logs -f
```

### 3. 验证部署

```bash
# 检查服务健康状态
curl http://localhost/api/v1/health

# 检查前端页面
curl -I http://localhost

# 查看容器资源使用
docker stats
```

## 🖥️ VPS 服务器部署

### 1. 推荐 VPS 提供商

| 提供商           | 最低配置       | 月费用 | 特点               |
| ---------------- | -------------- | ------ | ------------------ |
| **DigitalOcean** | 2GB RAM, 1 CPU | $12/月 | 简单易用，文档丰富 |
| **Linode**       | 2GB RAM, 1 CPU | $10/月 | 性能稳定，价格合理 |
| **Vultr**        | 2GB RAM, 1 CPU | $10/月 | 全球节点，速度快   |
| **腾讯云**       | 2GB RAM, 1 CPU | ¥60/月 | 国内访问快         |
| **阿里云**       | 2GB RAM, 1 CPU | ¥70/月 | 企业级服务         |

### 2. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git htop

# 配置防火墙
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 创建部署用户
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
```

### 3. 部署应用

```bash
# 切换到部署用户
su - deploy

# 克隆项目
git clone https://github.com/your-username/Yun-AI-TodoList.git
cd Yun-AI-TodoList

# 配置环境变量
cp .env.production.example .env.production
nano .env.production

# 部署应用
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. 配置域名和 SSL

**使用 Nginx Proxy Manager（推荐）：**

```bash
# 创建 nginx-proxy-manager 目录
mkdir ~/nginx-proxy-manager
cd ~/nginx-proxy-manager

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
EOF

# 启动 Nginx Proxy Manager
docker compose up -d
```

**访问管理界面：**

- URL: http://your-server-ip:81
- 默认账号: admin@example.com
- 默认密码: changeme

### 5. 配置反向代理

在 Nginx Proxy Manager 中添加：

1. **前端代理：**

   - Domain: yourdomain.com
   - Forward to: localhost:80
   - SSL: 启用 Let's Encrypt

2. **API 代理：**
   - Domain: api.yourdomain.com
   - Forward to: localhost:3000
   - SSL: 启用 Let's Encrypt

## ⚙️ 环境变量配置

### 完整环境变量列表

**应用基础配置：**

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn
```

**数据库配置：**

```bash
# PostgreSQL
POSTGRES_DB=yun_ai_todolist
POSTGRES_USER=todolist_user
POSTGRES_PASSWORD=your-strong-password-min-16-chars
DATABASE_URL=postgresql://todolist_user:password@postgres:5432/yun_ai_todolist

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-strong-password
REDIS_DB=0
```

**认证配置：**

```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

**AI 服务配置：**

```bash
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
CLAUDE_API_KEY=sk-ant-your-claude-api-key
```

**安全配置：**

```bash
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 环境变量生成工具

**生成强密码：**

```bash
# 生成 32 位随机密码
openssl rand -base64 32

# 生成 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 pwgen
sudo apt install pwgen
pwgen -s 32 1
```

## 💾 数据持久化

### 数据卷管理

**查看数据卷：**

```bash
# 列出所有数据卷
docker volume ls

# 查看特定数据卷详情
docker volume inspect yun-todolist-postgres-prod-data
```

**备份数据：**

```bash
# 备份 PostgreSQL 数据
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres yun_ai_todolist > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份 Redis 数据
docker compose -f docker-compose.prod.yml exec redis redis-cli --rdb /data/dump_$(date +%Y%m%d_%H%M%S).rdb

# 备份上传文件
docker run --rm -v yun-todolist-backend-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

**恢复数据：**

```bash
# 恢复 PostgreSQL 数据
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres yun_ai_todolist < backup_20250102_120000.sql

# 恢复上传文件
docker run --rm -v yun-todolist-backend-uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup_20250102_120000.tar.gz -C /data
```

### 自动备份脚本

创建 `scripts/backup.sh`：

```bash
#!/bin/bash
set -e

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres yun_ai_todolist > $BACKUP_DIR/db_backup_$DATE.sql

# 备份上传文件
docker run --rm -v yun-todolist-backend-uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_backup_$DATE.tar.gz -C /data .

# 清理旧备份（保留 7 天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**设置定时备份：**

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /home/deploy/Yun-AI-TodoList/scripts/backup.sh >> /home/deploy/backup.log 2>&1
```

## 📊 监控和日志

### 日志管理

**查看实时日志：**

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs -f backend

# 查看最近 100 行日志
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

**日志轮转配置：**

```bash
# 在 docker-compose.prod.yml 中添加日志配置
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 性能监控

**安装监控工具：**

```bash
# 创建监控目录
mkdir ~/monitoring
cd ~/monitoring

# 创建 Prometheus + Grafana 配置
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana-data:
EOF

# 启动监控服务
docker compose -f docker-compose.monitoring.yml up -d
```

**系统监控命令：**

```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看 Docker 磁盘使用
docker system df
```

## 🔧 故障排除

### 常见问题解决

**1. 容器启动失败**

```bash
# 查看容器状态
docker compose -f docker-compose.prod.yml ps

# 查看失败原因
docker compose -f docker-compose.prod.yml logs backend

# 重启特定服务
docker compose -f docker-compose.prod.yml restart backend
```

**2. 数据库连接失败**

```bash
# 检查数据库容器状态
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# 测试数据库连接
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d yun_ai_todolist -c "SELECT 1;"

# 查看数据库日志
docker compose -f docker-compose.prod.yml logs postgres
```

**3. 内存不足**

```bash
# 查看内存使用
free -h

# 清理 Docker 缓存
docker system prune -a

# 重启服务释放内存
docker compose -f docker-compose.prod.yml restart
```

**4. 磁盘空间不足**

```bash
# 查看磁盘使用
df -h

# 清理 Docker 数据
docker system prune -a --volumes

# 清理日志文件
sudo journalctl --vacuum-time=7d
```

**5. 端口冲突**

```bash
# 查看端口占用
sudo netstat -tlnp | grep :80

# 停止冲突服务
sudo systemctl stop apache2
sudo systemctl stop nginx

# 修改端口配置
nano docker-compose.prod.yml
```

### 调试技巧

**进入容器调试：**

```bash
# 进入后端容器
docker compose -f docker-compose.prod.yml exec backend sh

# 进入数据库容器
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres yun_ai_todolist

# 查看容器文件系统
docker compose -f docker-compose.prod.yml exec backend ls -la /app
```

**网络调试：**

```bash
# 测试容器间网络连接
docker compose -f docker-compose.prod.yml exec backend ping postgres

# 查看网络配置
docker network ls
docker network inspect yun-todolist-prod-network
```

## 🚀 性能优化

### Docker 优化

**镜像优化：**

```bash
# 使用多阶段构建减小镜像大小
# 已在 Dockerfile 中实现

# 查看镜像大小
docker images | grep yun-ai-todolist

# 清理未使用的镜像
docker image prune -a
```

**容器资源限制：**

```yaml
# 在 docker-compose.prod.yml 中配置
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 系统优化

**内核参数优化：**

```bash
# 编辑系统配置
sudo nano /etc/sysctl.conf

# 添加以下配置
vm.max_map_count=262144
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535

# 应用配置
sudo sysctl -p
```

**文件描述符限制：**

```bash
# 编辑限制配置
sudo nano /etc/security/limits.conf

# 添加以下配置
* soft nofile 65535
* hard nofile 65535

# 重启生效
sudo reboot
```

### 数据库优化

**PostgreSQL 配置优化：**

```bash
# 在 docker-compose.prod.yml 中添加环境变量
environment:
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
  POSTGRES_MAX_CONNECTIONS: 100
```

**Redis 配置优化：**

```bash
# Redis 内存优化
command: >
  redis-server
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru
  --save 900 1
  --save 300 10
```

## 📋 部署检查清单

**部署前检查：**

- [ ] Docker 和 Docker Compose 已安装
- [ ] 环境变量已正确配置
- [ ] 防火墙端口已开放
- [ ] 域名 DNS 已配置
- [ ] SSL 证书已准备

**部署后验证：**

- [ ] 所有容器正常运行
- [ ] 健康检查通过
- [ ] 前端页面可访问
- [ ] API 接口正常响应
- [ ] 数据库连接正常
- [ ] 用户注册登录功能正常
- [ ] 文件上传功能正常
- [ ] 日志输出正常

**安全检查：**

- [ ] 使用强密码
- [ ] 非 root 用户运行
- [ ] 防火墙已配置
- [ ] SSL 证书有效
- [ ] 敏感端口未暴露

**性能检查：**

- [ ] 内存使用正常
- [ ] CPU 使用正常
- [ ] 磁盘空间充足
- [ ] 网络连接稳定
- [ ] 响应时间正常

---

## 🎉 部署成功！

恭喜您成功使用 Docker 部署了 Yun AI TodoList 应用！

**接下来您可以：**

- 🔧 配置监控和告警
- 📊 设置性能监控
- 🔒 加强安全配置
- 📱 部署移动端应用
- 🌍 配置 CDN 加速

**如果遇到问题：**

- 📖 查看故障排除章节
- 🐛 提交 GitHub Issue
- 💬 加入社区讨论

**祝您使用愉快！** 🎊
