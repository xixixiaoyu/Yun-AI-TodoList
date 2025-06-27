#!/bin/bash

# ===========================================
# 快速修复 Docker 构建问题脚本
# 专门解决 electron 等依赖的构建失败问题
# ===========================================

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

# 显示横幅
show_banner() {
    echo -e "${BLUE}"
    echo "==========================================="
    echo "  Yun AI TodoList 构建问题快速修复工具"
    echo "==========================================="
    echo -e "${NC}"
}

# 检查 Docker 状态
check_docker() {
    log_info "检查 Docker 状态..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
    log_success "Docker 运行正常"
}

# 停止并清理现有容器
cleanup_containers() {
    log_info "停止并清理现有容器..."
    
    # 停止所有相关容器
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    # 清理悬空镜像
    docker image prune -f 2>/dev/null || true
    
    # 清理构建缓存
    docker builder prune -f 2>/dev/null || true
    
    log_success "容器清理完成"
}

# 设置网络优化环境变量
setup_build_env() {
    log_info "设置构建优化环境变量..."
    
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    export ELECTRON_SKIP_BINARY_DOWNLOAD=1
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
    export NODE_OPTIONS="--max-old-space-size=4096"
    export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
    export NPM_CONFIG_PROGRESS=false
    export CI=true
    export HUSKY=0
    
    log_success "环境变量设置完成"
}

# 优化 pnpm 配置
optimize_pnpm_config() {
    log_info "优化 pnpm 配置..."
    
    # 在容器外设置 pnpm 配置（如果 pnpm 可用）
    if command -v pnpm >/dev/null 2>&1; then
        pnpm config set registry https://registry.npmmirror.com
        pnpm config set electron_mirror https://npmmirror.com/mirrors/electron/
        pnpm config set network-timeout 600000
        pnpm config set fetch-retries 10
        pnpm config set fetch-retry-mintimeout 20000
        pnpm config set fetch-retry-maxtimeout 120000
        log_success "pnpm 配置优化完成"
    else
        log_warning "pnpm 未安装，跳过本地配置"
    fi
}

# 创建临时的优化 Dockerfile
create_temp_dockerfile() {
    log_info "创建临时优化的 Dockerfile..."
    
    # 备份原始文件
    cp Dockerfile.dev Dockerfile.dev.backup
    
    # 在 Dockerfile.dev 中添加额外的优化
    cat >> Dockerfile.dev.temp << 'EOF'
# 临时优化配置
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_PROGRESS=false
ENV CI=true
ENV HUSKY=0
EOF
    
    log_success "临时 Dockerfile 创建完成"
}

# 执行分阶段构建
staged_build() {
    log_info "开始分阶段构建..."
    
    local max_retries=3
    local services=("backend-dev" "frontend-dev")
    
    for service in "${services[@]}"; do
        log_info "构建 $service 服务..."
        local retry_count=0
        
        while [ $retry_count -lt $max_retries ]; do
            if docker-compose -f docker-compose.dev.yml build \
                --no-cache \
                --build-arg BUILDKIT_INLINE_CACHE=1 \
                "$service"; then
                log_success "$service 构建成功"
                break
            else
                retry_count=$((retry_count + 1))
                log_warning "$service 构建失败，重试 $retry_count/$max_retries..."
                
                if [ $retry_count -lt $max_retries ]; then
                    log_info "等待 10 秒后重试..."
                    sleep 10
                    # 清理构建缓存
                    docker builder prune -f 2>/dev/null || true
                fi
            fi
        done
        
        if [ $retry_count -eq $max_retries ]; then
            log_error "$service 构建失败，已达到最大重试次数"
            return 1
        fi
    done
    
    log_success "所有服务构建完成"
}

# 验证构建结果
verify_build() {
    log_info "验证构建结果..."
    
    local images=("yun-ai-todolist-backend-dev" "yun-ai-todolist-frontend-dev")
    
    for image in "${images[@]}"; do
        if docker images | grep -q "$image"; then
            log_success "✓ $image 镜像构建成功"
        else
            log_error "✗ $image 镜像构建失败"
            return 1
        fi
    done
    
    log_success "所有镜像验证通过"
}

# 启动服务并测试
start_and_test() {
    log_info "启动服务并进行测试..."
    
    # 启动基础服务
    log_info "启动数据库和缓存服务..."
    docker-compose -f docker-compose.dev.yml up -d postgres-dev redis-dev
    
    # 等待基础服务就绪
    sleep 10
    
    # 启动应用服务
    log_info "启动应用服务..."
    docker-compose -f docker-compose.dev.yml up -d backend-dev frontend-dev
    
    # 等待服务启动
    sleep 15
    
    # 检查服务状态
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        log_success "服务启动成功"
        
        # 显示服务信息
        echo ""
        log_info "服务访问地址:"
        echo "  前端: http://localhost:5173"
        echo "  后端: http://localhost:3000"
        echo "  数据库管理: http://localhost:8080"
        echo ""
        
        return 0
    else
        log_error "服务启动失败"
        docker-compose -f docker-compose.dev.yml logs
        return 1
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log_info "清理临时文件..."
    
    # 恢复原始 Dockerfile
    if [ -f Dockerfile.dev.backup ]; then
        mv Dockerfile.dev.backup Dockerfile.dev.original
        log_info "原始 Dockerfile 已备份为 Dockerfile.dev.original"
    fi
    
    # 删除临时文件
    rm -f Dockerfile.dev.temp
    
    log_success "临时文件清理完成"
}

# 显示帮助信息
show_help() {
    echo "快速修复 Docker 构建问题脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --quick     - 快速修复（推荐）"
    echo "  --full      - 完整修复（包括清理和重建）"
    echo "  --clean     - 仅清理环境"
    echo "  --help      - 显示此帮助信息"
    echo ""
}

# 快速修复模式
quick_fix() {
    show_banner
    log_info "开始快速修复模式..."
    
    check_docker
    setup_build_env
    optimize_pnpm_config
    
    # 尝试直接构建
    log_info "尝试直接构建..."
    if docker-compose -f docker-compose.dev.yml build --parallel; then
        log_success "快速修复成功！"
        start_and_test
    else
        log_warning "快速修复失败，尝试完整修复..."
        full_fix
    fi
}

# 完整修复模式
full_fix() {
    show_banner
    log_info "开始完整修复模式..."
    
    check_docker
    cleanup_containers
    setup_build_env
    optimize_pnpm_config
    staged_build
    verify_build
    start_and_test
    
    log_success "完整修复完成！"
}

# 仅清理模式
clean_only() {
    show_banner
    log_info "开始清理模式..."
    
    check_docker
    cleanup_containers
    
    log_success "清理完成！"
}

# 主函数
main() {
    case "${1:-quick}" in
        "--quick")
            quick_fix
            ;;
        "--full")
            full_fix
            ;;
        "--clean")
            clean_only
            ;;
        "--help")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 检查是否在项目根目录
if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 设置错误处理
trap cleanup_temp_files EXIT

# 执行主函数
main "$@"