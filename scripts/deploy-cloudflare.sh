#!/bin/bash

# Cloudflare Workers 部署脚本
# 使用方法: ./scripts/deploy-cloudflare.sh [dev|prod] [--force] [--dry-run]
# 示例: ./scripts/deploy-cloudflare.sh prod --force

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# 显示帮助信息
show_help() {
    echo "Cloudflare Workers 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [环境] [选项]"
    echo ""
    echo "环境:"
    echo "  dev     部署到开发环境 (默认)"
    echo "  prod    部署到生产环境"
    echo ""
    echo "选项:"
    echo "  --force     强制部署，跳过确认"
    echo "  --dry-run   模拟部署，不实际执行"
    echo "  --debug     显示调试信息"
    echo "  --help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 prod --force"
    echo "  $0 dev --dry-run"
}

# 解析参数
ENVIRONMENT="dev"
FORCE=false
DRY_RUN=false
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help)
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

# 验证环境参数
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "无效的环境参数。使用 'dev' 或 'prod'"
    exit 1
fi

log_info "开始部署到 Cloudflare Workers ($ENVIRONMENT 环境)..."
log_debug "参数: ENVIRONMENT=$ENVIRONMENT, FORCE=$FORCE, DRY_RUN=$DRY_RUN"

# 检查必要的工具
log_step "检查必要工具..."
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI 未安装。请运行: npm install -g wrangler"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装。请先安装 pnpm"
    exit 1
fi

log_success "工具检查完成"

# 检查 Wrangler 登录状态
log_step "检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    log_warning "未登录 Cloudflare。请运行: wrangler login"
    if [[ "$FORCE" != "true" ]]; then
        read -p "是否现在登录？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            wrangler login
        else
            exit 1
        fi
    else
        exit 1
    fi
fi

log_success "Cloudflare 登录状态正常"

# 验证 wrangler.toml 配置
log_step "验证配置文件..."
if [ ! -f "wrangler.toml" ]; then
    log_error "wrangler.toml 配置文件不存在"
    exit 1
fi

# 验证配置文件
log_step "验证配置文件..."
if [ ! -f "wrangler.toml" ]; then
    log_error "wrangler.toml 配置文件不存在"
    exit 1
fi
log_success "配置文件验证通过"

# 检查项目结构
log_step "检查项目结构..."
if [ ! -d "apps/frontend" ]; then
    log_error "前端项目目录不存在: apps/frontend"
    exit 1
fi

if [ ! -d "workers-site" ]; then
    log_error "Workers 目录不存在: workers-site"
    exit 1
fi

log_success "项目结构检查完成"

# 构建前端项目
log_step "构建前端项目..."
if [[ "$DRY_RUN" != "true" ]]; then
    cd apps/frontend

    # 清理旧的构建文件
    if [ -d "dist" ]; then
        log_info "清理旧的构建文件..."
        rm -rf dist
    fi

    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        pnpm install
    fi

    # 构建项目
    log_info "开始构建..."
    pnpm run build

    cd ../..

    # 检查构建结果
    if [ ! -d "apps/frontend/dist" ]; then
        log_error "前端构建失败，dist 目录不存在"
        exit 1
    fi

    # 检查关键文件
    if [ ! -f "apps/frontend/dist/index.html" ]; then
        log_error "构建失败，index.html 不存在"
        exit 1
    fi

    log_success "前端构建完成"
else
    log_info "[DRY RUN] 跳过前端构建"
fi

# 安装 Workers 依赖
log_step "准备 Workers 环境..."
if [[ "$DRY_RUN" != "true" ]]; then
    cd workers-site

    if [ ! -f "package.json" ]; then
        log_error "workers-site/package.json 不存在"
        exit 1
    fi

    # 安装依赖
    if [ ! -d "node_modules" ] || [[ "$FORCE" == "true" ]]; then
        log_info "安装 Workers 依赖..."
        pnpm install
    fi

    cd ..
    log_success "Workers 环境准备完成"
else
    log_info "[DRY RUN] 跳过 Workers 依赖安装"
fi

# 部署确认（已禁用，默认直接部署）
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    log_warning "即将部署到 $ENVIRONMENT 环境"
    log_info "自动继续部署..."
fi

# 部署到 Cloudflare Workers
log_step "部署到 Cloudflare Workers..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] 模拟部署到 $ENVIRONMENT 环境"
    log_info "[DRY RUN] 命令: wrangler deploy --env $ENVIRONMENT"
else
    cd workers-site

    if [ "$ENVIRONMENT" = "prod" ]; then
        wrangler deploy --env production
        DEPLOY_URL="https://yun-ai-todolist-prod.your-subdomain.workers.dev"
    else
        wrangler deploy --env development
        DEPLOY_URL="https://yun-ai-todolist-dev.your-subdomain.workers.dev"
    fi

    cd ..

    log_success "成功部署到 $ENVIRONMENT 环境！"
    log_info "访问地址: $DEPLOY_URL"
fi



# 显示部署信息
log_success "部署完成！"
echo ""
log_info "📋 部署信息:"
log_info "   环境: $ENVIRONMENT"
log_info "   访问地址: $DEPLOY_URL"
log_info "   健康检查: $DEPLOY_URL/health"
echo ""
log_info "🔧 有用的命令:"
log_info "   查看实时日志: wrangler tail --env $ENVIRONMENT"
log_info "   本地开发模式: wrangler dev"
log_info "   查看部署状态: wrangler deployments list"
echo ""
log_warning "💡 提示:"
log_warning "   如需配置自定义域名，请在 Cloudflare Dashboard 中设置"
log_warning "   更新 wrangler.toml 中的 routes 配置后重新部署"
log_warning "   生产环境建议配置环境变量和密钥管理"
