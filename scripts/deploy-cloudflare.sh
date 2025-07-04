#!/bin/bash

# ===========================================
# Yun AI TodoList - Cloudflare Workers 部署脚本
# ===========================================
#
# 功能：
# - 自动构建前端项目
# - 部署到 Cloudflare Workers
# - 支持开发和生产环境
# - 完整的错误处理和日志
#
# 使用方法:
#   ./scripts/deploy-cloudflare.sh [dev|prod] [选项]
#
# 示例:
#   ./scripts/deploy-cloudflare.sh prod --force
#   ./scripts/deploy-cloudflare.sh dev --dry-run --debug
# ===========================================

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
    echo "===========================================
Yun AI TodoList - Cloudflare Workers 部署脚本
===========================================

📖 使用方法:
  $0 [环境] [选项]

🌍 环境选择:
  dev     部署到开发环境 (默认)
  prod    部署到生产环境

⚙️ 可用选项:
  --force     强制部署，跳过所有确认
  --dry-run   模拟部署，显示将要执行的操作但不实际执行
  --debug     显示详细的调试信息
  --clean     部署前清理构建缓存
  --help      显示此帮助信息

📝 使用示例:
  $0 prod --force                    # 强制部署到生产环境
  $0 dev --dry-run --debug           # 模拟部署到开发环境并显示调试信息
  $0 prod --clean                    # 清理缓存后部署到生产环境

🔧 环境要求:
  - Node.js >= 18.0.0
  - pnpm >= 9.0.0
  - wrangler CLI
  - 已登录 Cloudflare 账户

📚 更多信息:
  - 项目文档: README.md
  - Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
  - 问题反馈: GitHub Issues

===========================================
"
}

# 解析参数
ENVIRONMENT="dev"
FORCE=false
DRY_RUN=false
DEBUG=false
CLEAN=false

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
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            echo ""
            log_info "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 验证环境参数
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "无效的环境参数。使用 'dev' 或 'prod'"
    exit 1
fi

echo ""
log_info "🚀 开始部署到 Cloudflare Workers ($ENVIRONMENT 环境)..."
log_debug "参数: ENVIRONMENT=$ENVIRONMENT, FORCE=$FORCE, DRY_RUN=$DRY_RUN, CLEAN=$CLEAN"
echo ""

# 检查必要的工具
log_step "🔍 检查必要工具..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装。请先安装 Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE_VERSION="18.0.0"
if ! printf '%s\n%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V -C; then
    log_error "Node.js 版本过低。当前版本: $NODE_VERSION，要求版本: >= $REQUIRED_NODE_VERSION"
    exit 1
fi
log_debug "Node.js 版本: $NODE_VERSION ✓"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装。请运行: npm install -g pnpm"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
log_debug "pnpm 版本: $PNPM_VERSION ✓"

# 检查 Wrangler CLI
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI 未安装。请运行: npm install -g wrangler"
    exit 1
fi

WRANGLER_VERSION=$(wrangler --version)
log_debug "Wrangler 版本: $WRANGLER_VERSION ✓"

log_success "✅ 工具检查完成"

# 检查 Wrangler 登录状态
log_step "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    log_warning "⚠️  未登录 Cloudflare 账户"
    log_info "请运行以下命令登录: wrangler login"

    if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
        echo ""
        read -p "是否现在登录 Cloudflare？(y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "正在打开浏览器进行登录..."
            wrangler login
        else
            log_error "需要登录 Cloudflare 才能继续部署"
            exit 1
        fi
    else
        log_error "需要登录 Cloudflare 才能继续部署"
        exit 1
    fi
fi

# 获取账户信息
ACCOUNT_INFO=$(wrangler whoami 2>/dev/null || echo "未知用户")
log_success "✅ Cloudflare 登录状态正常"
log_debug "账户信息: $ACCOUNT_INFO"

# 验证配置文件
log_step "📋 验证项目配置..."

# 检查 wrangler.toml
if [ ! -f "wrangler.toml" ]; then
    log_error "wrangler.toml 配置文件不存在"
    log_info "请确保在项目根目录运行此脚本"
    exit 1
fi
log_debug "wrangler.toml 文件存在 ✓"

# 验证 wrangler.toml 语法
if ! wrangler config validate 2>/dev/null; then
    log_warning "⚠️  wrangler.toml 配置可能有问题，但继续执行..."
else
    log_debug "wrangler.toml 语法验证通过 ✓"
fi

# 检查 package.json
if [ ! -f "package.json" ]; then
    log_error "package.json 文件不存在"
    exit 1
fi
log_debug "package.json 文件存在 ✓"

# 检查 pnpm-workspace.yaml
if [ ! -f "pnpm-workspace.yaml" ]; then
    log_error "pnpm-workspace.yaml 文件不存在，这不是一个有效的 pnpm workspace"
    exit 1
fi
log_debug "pnpm-workspace.yaml 文件存在 ✓"

log_success "✅ 配置文件验证通过"

# 检查项目结构
log_step "🏗️  检查项目结构..."

# 检查前端目录
if [ ! -d "apps/frontend" ]; then
    log_error "前端项目目录不存在: apps/frontend"
    log_info "请确保在项目根目录运行此脚本"
    exit 1
fi
log_debug "前端目录存在: apps/frontend ✓"

# 检查前端 package.json
if [ ! -f "apps/frontend/package.json" ]; then
    log_error "前端 package.json 不存在: apps/frontend/package.json"
    exit 1
fi
log_debug "前端 package.json 存在 ✓"

# 检查 workers-site 目录
if [ ! -d "workers-site" ]; then
    log_error "Workers 目录不存在: workers-site"
    log_info "请确保 workers-site 目录存在并包含必要的文件"
    exit 1
fi
log_debug "Workers 目录存在: workers-site ✓"

# 检查 workers-site/package.json
if [ ! -f "workers-site/package.json" ]; then
    log_error "Workers package.json 不存在: workers-site/package.json"
    exit 1
fi
log_debug "Workers package.json 存在 ✓"

# 检查共享包目录
if [ ! -d "packages/shared" ]; then
    log_warning "⚠️  共享包目录不存在: packages/shared"
    log_info "如果项目使用共享包，请确保目录存在"
else
    log_debug "共享包目录存在: packages/shared ✓"
fi

log_success "✅ 项目结构检查完成"

# 清理缓存（如果需要）
if [[ "$CLEAN" == "true" ]]; then
    log_step "🧹 清理构建缓存..."
    if [[ "$DRY_RUN" != "true" ]]; then
        # 清理 pnpm 缓存
        log_info "清理 pnpm 缓存..."
        pnpm store prune

        # 清理前端构建缓存
        if [ -d "apps/frontend/dist" ]; then
            log_info "清理前端构建文件..."
            rm -rf apps/frontend/dist
        fi

        if [ -d "apps/frontend/node_modules/.cache" ]; then
            log_info "清理前端缓存..."
            rm -rf apps/frontend/node_modules/.cache
        fi

        log_success "✅ 缓存清理完成"
    else
        log_info "[DRY RUN] 跳过缓存清理"
    fi
fi

# 构建前端项目
log_step "🔨 构建前端项目..."
if [[ "$DRY_RUN" != "true" ]]; then
    # 记录构建开始时间
    BUILD_START_TIME=$(date +%s)

    # 安装根目录依赖
    log_info "安装项目依赖..."
    pnpm install --frozen-lockfile

    # 构建共享包（如果存在）
    if [ -d "packages/shared" ]; then
        log_info "构建共享包..."
        pnpm --filter shared build
    fi

    # 构建前端项目
    log_info "构建前端应用..."
    pnpm --filter frontend build

    # 计算构建时间
    BUILD_END_TIME=$(date +%s)
    BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

    # 检查构建结果
    if [ ! -d "apps/frontend/dist" ]; then
        log_error "❌ 前端构建失败，dist 目录不存在"
        exit 1
    fi

    # 检查关键文件
    if [ ! -f "apps/frontend/dist/index.html" ]; then
        log_error "❌ 构建失败，index.html 不存在"
        exit 1
    fi

    # 显示构建统计信息
    DIST_SIZE=$(du -sh apps/frontend/dist | cut -f1)
    FILE_COUNT=$(find apps/frontend/dist -type f | wc -l)

    log_success "✅ 前端构建完成"
    log_info "📊 构建统计:"
    log_info "   构建时间: ${BUILD_DURATION}s"
    log_info "   输出大小: $DIST_SIZE"
    log_info "   文件数量: $FILE_COUNT"
else
    log_info "[DRY RUN] 跳过前端构建"
fi

# 准备 Workers 环境
log_step "⚙️  准备 Workers 环境..."
if [[ "$DRY_RUN" != "true" ]]; then
    cd workers-site

    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "❌ workers-site/package.json 不存在"
        exit 1
    fi

    # 安装或更新依赖
    if [ ! -d "node_modules" ] || [[ "$FORCE" == "true" ]] || [[ "$CLEAN" == "true" ]]; then
        log_info "安装 Workers 依赖..."
        pnpm install --frozen-lockfile
    else
        log_debug "Workers 依赖已存在，跳过安装"
    fi

    # 验证关键文件
    if [ ! -f "index.js" ]; then
        log_error "❌ workers-site/index.js 不存在"
        exit 1
    fi

    cd ..
    log_success "✅ Workers 环境准备完成"
else
    log_info "[DRY RUN] 跳过 Workers 依赖安装"
fi

# 部署确认
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    echo ""
    log_warning "⚠️  即将部署到 $ENVIRONMENT 环境"
    log_info "📋 部署信息:"
    log_info "   环境: $ENVIRONMENT"
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

# 部署到 Cloudflare Workers
log_step "🚀 部署到 Cloudflare Workers..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] 模拟部署到 $ENVIRONMENT 环境"
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "[DRY RUN] 命令: wrangler deploy --env production"
        DEPLOY_URL="https://yun-ai-todolist-prod.your-subdomain.workers.dev"
    else
        log_info "[DRY RUN] 命令: wrangler deploy --env development"
        DEPLOY_URL="https://yun-ai-todolist-dev.your-subdomain.workers.dev"
    fi
    log_info "[DRY RUN] 部署 URL: $DEPLOY_URL"
else
    # 记录部署开始时间
    DEPLOY_START_TIME=$(date +%s)

    cd workers-site

    # 执行部署
    log_info "正在部署..."
    if [ "$ENVIRONMENT" = "prod" ]; then
        if wrangler deploy --env production; then
            DEPLOY_URL="https://yun-ai-todolist-prod.your-subdomain.workers.dev"
            DEPLOY_SUCCESS=true
        else
            DEPLOY_SUCCESS=false
        fi
    else
        if wrangler deploy --env development; then
            DEPLOY_URL="https://yun-ai-todolist-dev.your-subdomain.workers.dev"
            DEPLOY_SUCCESS=true
        else
            DEPLOY_SUCCESS=false
        fi
    fi

    cd ..

    # 计算部署时间
    DEPLOY_END_TIME=$(date +%s)
    DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))

    if [[ "$DEPLOY_SUCCESS" == "true" ]]; then
        log_success "✅ 成功部署到 $ENVIRONMENT 环境！"
        log_info "⏱️  部署耗时: ${DEPLOY_DURATION}s"
        log_info "🌐 访问地址: $DEPLOY_URL"
    else
        log_error "❌ 部署失败"
        exit 1
    fi
fi



# 部署后验证
if [[ "$DRY_RUN" != "true" && "$DEPLOY_SUCCESS" == "true" ]]; then
    log_step "🔍 验证部署..."

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 5

    # 测试访问
    if curl -f -s "$DEPLOY_URL" > /dev/null; then
        log_success "✅ 服务访问正常"
    else
        log_warning "⚠️  服务可能还在启动中，请稍后手动验证"
    fi
fi

# 显示部署信息
echo ""
echo "=========================================="
log_success "🎉 部署完成！"
echo "=========================================="
echo ""

log_info "📋 部署信息:"
log_info "   🌍 环境: $ENVIRONMENT"
log_info "   🔗 访问地址: $DEPLOY_URL"
log_info "   ⚡ 健康检查: $DEPLOY_URL/health"
if [[ "$DEPLOY_SUCCESS" == "true" ]]; then
    log_info "   ⏱️  部署耗时: ${DEPLOY_DURATION}s"
fi
echo ""

log_info "🔧 有用的命令:"
log_info "   📊 查看实时日志: wrangler tail --env $ENVIRONMENT"
log_info "   🛠️  本地开发模式: wrangler dev"
log_info "   📈 查看部署状态: wrangler deployments list"
log_info "   🔄 回滚部署: wrangler rollback"
log_info "   📱 查看分析数据: wrangler analytics"
echo ""

log_info "🌐 Cloudflare Dashboard:"
log_info "   🔗 Workers 控制台: https://dash.cloudflare.com/workers"
log_info "   📊 分析数据: https://dash.cloudflare.com/workers/analytics"
echo ""

log_warning "💡 后续步骤:"
log_warning "   🔧 配置自定义域名（在 Cloudflare Dashboard 中）"
log_warning "   🔒 设置环境变量和密钥（使用 wrangler secret）"
log_warning "   📈 配置监控和告警"
log_warning "   🚀 优化缓存策略"
echo ""

if [[ "$ENVIRONMENT" == "prod" ]]; then
    log_warning "🔐 生产环境安全提醒:"
    log_warning "   ✅ 确保已配置所有必要的环境变量"
    log_warning "   ✅ 检查 CORS 设置"
    log_warning "   ✅ 验证 API 密钥安全性"
    log_warning "   ✅ 设置监控和告警"
    echo ""
fi

log_success "🎊 祝您使用愉快！"
echo "=========================================="
