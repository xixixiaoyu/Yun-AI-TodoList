#!/bin/bash

# Cloudflare Workers 部署脚本
# 使用方法: ./scripts/deploy-cloudflare.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-dev}
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "无效的环境参数。使用 'dev' 或 'prod'"
    exit 1
fi

log_info "开始部署到 Cloudflare Workers ($ENVIRONMENT 环境)..."

# 检查必要的工具
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI 未安装。请运行: npm install -g wrangler"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装。请先安装 pnpm"
    exit 1
fi

# 检查 Wrangler 登录状态
if ! wrangler whoami &> /dev/null; then
    log_warning "未登录 Cloudflare。请运行: wrangler login"
    exit 1
fi

# 构建前端项目
log_info "构建前端项目..."
cd apps/frontend
pnpm run build
cd ../..

# 检查构建结果
if [ ! -d "apps/frontend/dist" ]; then
    log_error "前端构建失败，dist 目录不存在"
    exit 1
fi

log_success "前端构建完成"

# 安装 Workers 依赖
log_info "安装 Workers 依赖..."
cd workers-site
if [ ! -f "package.json" ]; then
    log_error "workers-site/package.json 不存在"
    exit 1
fi

pnpm install
cd ..

# 部署到 Cloudflare Workers
log_info "部署到 Cloudflare Workers..."

if [ "$ENVIRONMENT" = "prod" ]; then
    wrangler deploy --env production
    log_success "成功部署到生产环境！"
    log_info "访问地址: https://yun-ai-todolist-prod.your-subdomain.workers.dev"
else
    wrangler deploy --env development
    log_success "成功部署到开发环境！"
    log_info "访问地址: https://yun-ai-todolist-dev.your-subdomain.workers.dev"
fi

# 显示部署信息
log_info "部署完成！"
log_info "你可以使用以下命令查看部署状态:"
log_info "  wrangler tail --env $ENVIRONMENT  # 查看实时日志"
log_info "  wrangler dev                      # 本地开发模式"

# 提示自定义域名配置
log_warning "如需配置自定义域名，请:"
log_warning "1. 在 Cloudflare Dashboard 中添加域名"
log_warning "2. 更新 wrangler.toml 中的 routes 配置"
log_warning "3. 重新部署"
