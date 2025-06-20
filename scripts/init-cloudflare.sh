#!/bin/bash

# Cloudflare Workers 初始化脚本
# 用于首次设置 Cloudflare Workers 部署环境

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

log_prompt() {
    echo -e "${CYAN}[INPUT]${NC} $1"
}

# 显示欢迎信息
show_welcome() {
    echo ""
    echo "🚀 Yun AI TodoList - Cloudflare Workers 初始化"
    echo "================================================"
    echo ""
    echo "此脚本将帮助您设置 Cloudflare Workers 部署环境"
    echo ""
}

# 检查必要工具
check_prerequisites() {
    log_step "检查必要工具..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装。请访问 https://nodejs.org 安装"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装。请运行: npm install -g pnpm"
        exit 1
    fi
    
    # 检查 wrangler
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler CLI 未安装"
        log_prompt "是否现在安装 Wrangler？(Y/n): "
        read -r install_wrangler
        if [[ "$install_wrangler" != "n" && "$install_wrangler" != "N" ]]; then
            npm install -g wrangler
            log_success "Wrangler 安装完成"
        else
            log_error "Wrangler 是必需的，请手动安装: npm install -g wrangler"
            exit 1
        fi
    fi
    
    log_success "工具检查完成"
}

# Cloudflare 登录
setup_cloudflare_auth() {
    log_step "设置 Cloudflare 认证..."
    
    if wrangler whoami &> /dev/null; then
        CURRENT_USER=$(wrangler whoami 2>/dev/null | grep "logged in as" | cut -d' ' -f4 || echo "unknown")
        log_info "当前已登录用户: $CURRENT_USER"
        log_prompt "是否使用当前账户？(Y/n): "
        read -r use_current
        if [[ "$use_current" == "n" || "$use_current" == "N" ]]; then
            wrangler logout
            wrangler login
        fi
    else
        log_info "请登录您的 Cloudflare 账户"
        wrangler login
    fi
    
    log_success "Cloudflare 认证完成"
}

# 收集配置信息
collect_config() {
    log_step "收集配置信息..."
    
    # 应用名称
    log_prompt "请输入应用名称 (默认: yun-ai-todolist): "
    read -r APP_NAME
    APP_NAME=${APP_NAME:-yun-ai-todolist}
    
    # 自定义域名
    log_prompt "是否配置自定义域名？(y/N): "
    read -r use_custom_domain
    if [[ "$use_custom_domain" == "y" || "$use_custom_domain" == "Y" ]]; then
        log_prompt "请输入自定义域名 (例: todo.yourdomain.com): "
        read -r CUSTOM_DOMAIN
        log_prompt "请输入根域名 (例: yourdomain.com): "
        read -r ZONE_NAME
    fi
    
    # 后端 API URL
    log_prompt "请输入后端 API URL (可选，默认为空): "
    read -r API_BASE_URL
    
    log_success "配置信息收集完成"
}

# 更新配置文件
update_config_files() {
    log_step "更新配置文件..."
    
    # 备份原始配置
    if [ -f "wrangler.toml" ]; then
        cp wrangler.toml wrangler.toml.backup
        log_info "已备份原始配置: wrangler.toml.backup"
    fi
    
    # 更新 wrangler.toml 中的应用名称
    if [ -f "wrangler.toml" ]; then
        sed -i.bak "s/name = \"yun-ai-todolist\"/name = \"$APP_NAME\"/g" wrangler.toml
        sed -i.bak "s/name = \"yun-ai-todolist-dev\"/name = \"$APP_NAME-dev\"/g" wrangler.toml
        sed -i.bak "s/name = \"yun-ai-todolist-prod\"/name = \"$APP_NAME-prod\"/g" wrangler.toml
        
        # 更新 API URL
        if [ -n "$API_BASE_URL" ]; then
            sed -i.bak "s|API_BASE_URL = \"https://api.yourdomain.com\"|API_BASE_URL = \"$API_BASE_URL\"|g" wrangler.toml
        fi
        
        rm -f wrangler.toml.bak
        log_success "wrangler.toml 更新完成"
    fi
    
    # 创建环境变量文件
    if [ ! -f ".env.cloudflare" ]; then
        log_info "创建环境变量文件..."
        cat > .env.cloudflare << EOF
# Cloudflare 配置文件
# 请填入实际值

# Cloudflare 账户信息
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Workers 应用配置
WORKERS_APP_NAME=$APP_NAME
WORKERS_SUBDOMAIN=your-subdomain

EOF
        
        if [ -n "$CUSTOM_DOMAIN" ]; then
            cat >> .env.cloudflare << EOF
# 自定义域名配置
CUSTOM_DOMAIN=$CUSTOM_DOMAIN
ZONE_NAME=$ZONE_NAME

EOF
        fi
        
        if [ -n "$API_BASE_URL" ]; then
            cat >> .env.cloudflare << EOF
# 后端 API 配置
API_BASE_URL=$API_BASE_URL

EOF
        fi
        
        cat >> .env.cloudflare << EOF
# 环境变量
ENVIRONMENT=production
DEBUG_MODE=false
EOF
        
        log_success "环境变量文件创建完成: .env.cloudflare"
    fi
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        pnpm install
    fi
    
    # 安装 workers-site 依赖
    if [ -d "workers-site" ]; then
        cd workers-site
        pnpm install
        cd ..
    fi
    
    log_success "依赖安装完成"
}

# 验证配置
validate_setup() {
    log_step "验证配置..."
    
    # 验证 wrangler 配置
    if [ -f "wrangler.toml" ]; then
        log_success "Wrangler 配置文件存在"
    else
        log_warning "wrangler.toml 配置文件不存在，请检查配置"
    fi
    
    # 检查项目结构
    if [ -d "apps/frontend" ] && [ -d "workers-site" ]; then
        log_success "项目结构验证通过"
    else
        log_warning "项目结构不完整，请检查目录结构"
    fi
}

# 显示下一步操作
show_next_steps() {
    echo ""
    log_success "🎉 Cloudflare Workers 初始化完成！"
    echo ""
    log_info "📋 下一步操作:"
    echo ""
    log_info "1. 编辑 .env.cloudflare 文件，填入您的 Cloudflare 账户信息"
    log_info "2. 如果使用自定义域名，请在 Cloudflare Dashboard 中配置 DNS"
    log_info "3. 运行部署命令:"
    echo "     ./scripts/deploy-cloudflare.sh dev    # 部署到开发环境"
    echo "     ./scripts/deploy-cloudflare.sh prod   # 部署到生产环境"
    echo ""
    log_info "🔧 有用的命令:"
    log_info "   本地开发: cd workers-site && pnpm run dev"
    log_info "   查看日志: wrangler tail"
    log_info "   查看状态: wrangler whoami"
    echo ""
    log_warning "💡 提示:"
    log_warning "   首次部署前请确保前端项目已构建 (pnpm run build:frontend)"
    log_warning "   生产环境部署前请仔细检查配置"
    echo ""
}

# 主函数
main() {
    show_welcome
    check_prerequisites
    setup_cloudflare_auth
    collect_config
    update_config_files
    install_dependencies
    validate_setup
    show_next_steps
}

# 执行主函数
main "$@"