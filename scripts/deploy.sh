#!/bin/bash

# ===========================================
# Yun AI TodoList - Cloudflare Workers 部署脚本
# ===========================================
# 统一部署到 Cloudflare Workers

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# 显示帮助信息
show_help() {
    echo "Yun AI TodoList - Cloudflare Workers 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  --dry-run      模拟部署（不实际执行）"
    echo "  --force        强制部署（跳过确认）"
    echo ""
    echo "示例:"
    echo "  $0"
    echo "  $0 --dry-run"
    echo "  $0 --force"
}

# 解析参数
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

log_info "🚀 开始部署 Yun AI TodoList..."

# 检查必要工具
log_info "🔍 检查部署工具..."

if ! command -v wrangler &> /dev/null; then
    log_error "wrangler CLI 未安装"
    log_info "请运行: npm install -g wrangler"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装"
    exit 1
fi

log_success "✅ 部署工具检查通过"

# 检查项目结构
log_info "🏗️ 检查项目结构..."

if [ ! -f "wrangler.toml" ]; then
    log_error "wrangler.toml 配置文件不存在"
    exit 1
fi

if [ ! -d "workers-site" ]; then
    log_error "workers-site 目录不存在"
    exit 1
fi

log_success "✅ 项目结构检查通过"

# 构建前端项目
log_info "🔨 构建前端项目..."

if [[ "$DRY_RUN" != "true" ]]; then
    # 安装依赖
    log_info "安装项目依赖..."
    pnpm install --frozen-lockfile

    # 构建共享包
    if [ -d "packages/shared" ]; then
        log_info "构建共享包..."
        pnpm --filter shared build
    fi

    # 构建前端
    log_info "构建前端应用..."
    pnpm --filter frontend build

    # 检查构建结果
    if [ ! -d "apps/frontend/dist" ]; then
        log_error "❌ 前端构建失败，dist 目录不存在"
        exit 1
    fi

    log_success "✅ 前端构建完成"
else
    log_info "[DRY RUN] 跳过前端构建"
fi

# 部署确认
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    echo ""
    log_warning "⚠️ 即将部署到 Cloudflare Workers"
    log_info "📋 部署信息:"
    log_info "   项目: Yun AI TodoList"
    log_info "   构建产物: apps/frontend/dist"
    echo ""

    read -p "确认继续部署？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
fi

# 执行部署
log_info "🚀 部署到 Cloudflare Workers..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] 模拟部署"
    log_info "[DRY RUN] 命令: wrangler deploy"
else
    # 实际部署
    if wrangler deploy; then
        log_success "✅ 部署成功！"
        log_info "🌐 访问地址: https://yun-ai-todolist.your-subdomain.workers.dev"
        log_info "📊 管理面板: https://dash.cloudflare.com/"
    else
        log_error "❌ 部署失败"
        exit 1
    fi
fi

log_success "🎉 部署完成！"
