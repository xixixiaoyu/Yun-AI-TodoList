#!/bin/bash

# ===========================================
# Yun AI TodoList - 开发环境 Docker 启动脚本
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

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
}

# 检查 .env 文件
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env 文件不存在，正在从 .env.example 创建..."
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "已创建 .env 文件，请根据需要修改配置"
        else
            log_warning ".env.example 文件不存在，使用默认开发环境配置"
            create_default_env
        fi
    fi
}

# 创建默认开发环境配置
create_default_env() {
    cat > .env << 'EOF'
# 开发环境配置
NODE_ENV=development
POSTGRES_DB=yun_todo_db
POSTGRES_USER=yun_todo_user
POSTGRES_PASSWORD=postgres123
REDIS_PASSWORD=
JWT_SECRET=dev-jwt-secret-key-for-development-only
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=dev-refresh-secret-key-for-development-only
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
LOG_LEVEL=debug
ENABLE_SWAGGER=true
DEBUG_MODE=true
EOF
    log_success "已创建默认开发环境 .env 文件"
}

# 清理旧容器和镜像
cleanup() {
    log_info "清理旧的开发环境容器..."
    docker-compose down --remove-orphans

    if [ "$1" = "--clean" ]; then
        log_info "清理开发环境镜像和卷..."
        docker-compose down --volumes --rmi local
        docker system prune -f
    fi
}

# 检查系统资源
check_resources() {
    log_info "检查系统资源..."

    # 检查可用内存
    if command -v free >/dev/null 2>&1; then
        available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        if [ "$available_mem" -lt 2048 ]; then
            log_warning "可用内存较少 (${available_mem}MB)，构建可能较慢"
        fi
    fi

    # 检查磁盘空间
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB in KB
        log_warning "可用磁盘空间较少，请确保有足够空间"
    fi
}

# 优化构建镜像
build() {
    log_info "构建开发环境镜像..."

    # 检查是否启用 BuildKit
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    # 设置网络优化环境变量
    export ELECTRON_SKIP_BINARY_DOWNLOAD=1
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

    # 使用并行构建和缓存，增加重试机制
    log_info "使用优化构建策略..."
    local max_retries=3
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        if docker-compose build \
            --parallel \
            --build-arg BUILDKIT_INLINE_CACHE=1; then
            log_success "镜像构建成功"
            return 0
        else
            retry_count=$((retry_count + 1))
            log_warning "构建失败，重试 $retry_count/$max_retries..."
            if [ $retry_count -lt $max_retries ]; then
                log_info "清理构建缓存后重试..."
                docker builder prune -f
                sleep 5
            fi
        fi
    done

    log_error "构建失败，已达到最大重试次数"
    return 1
}

# 启动服务
start() {
    log_info "启动开发环境服务..."

    # 分阶段启动服务
    log_info "启动基础服务（数据库和缓存）..."
    docker-compose up -d postgres redis

    log_info "等待基础服务就绪..."
    wait_for_service "postgres" "PostgreSQL"
    wait_for_service "redis" "Redis"

    log_info "启动应用服务..."
    docker-compose up -d backend frontend adminer

    log_info "等待应用服务启动..."
    wait_for_service "backend" "后端服务"
    wait_for_service "frontend" "前端服务"

    # 检查服务状态
    check_services
}

# 等待服务就绪
wait_for_service() {
    local service_name=$1
    local display_name=$2
    local max_attempts=30
    local attempt=1

    log_info "等待 $display_name 启动..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "$service_name.*Up"; then
            log_success "$display_name 已启动"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$display_name 启动超时"
    return 1
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."

    services=("postgres" "redis" "backend" "frontend")

    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务启动失败"
            docker-compose logs "$service"
        fi
    done
}

# 显示日志
logs() {
    if [ -n "$1" ]; then
        docker-compose logs -f "$1"
    else
        docker-compose logs -f
    fi
}

# 显示帮助信息
show_help() {
    echo "Yun AI TodoList 开发环境 Docker 管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start         启动开发环境"
    echo "  stop          停止开发环境"
    echo "  restart       重启开发环境"
    echo "  build         构建镜像"
    echo "  clean         清理容器和镜像"
    echo "  logs [服务名]  查看日志"
    echo "  status        查看服务状态"
    echo "  shell [服务名] 进入容器 shell"
    echo "  help          显示帮助信息"
    echo ""
    echo "选项:"
    echo "  --clean       清理时删除镜像和卷"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 启动开发环境"
    echo "  $0 logs backend             # 查看后端日志"
    echo "  $0 shell frontend           # 进入前端容器"
    echo "  $0 clean --clean            # 完全清理"
}

# 主函数
main() {
    case "$1" in
        start)
            check_docker
            check_resources
            check_env
            cleanup
            build
            start
            log_success "开发环境启动完成！"
            log_info "前端地址: http://localhost:5173"
            log_info "后端地址: http://localhost:3000"
            log_info "后端 API 文档: http://localhost:3000/api/docs"
            log_info "数据库管理: http://localhost:8080"
            log_info ""
            log_info "使用以下命令查看日志："
            log_info "  $0 logs [服务名]"
            ;;
        stop)
            log_info "停止开发环境..."
            docker-compose down
            log_success "开发环境已停止"
            ;;
        restart)
            log_info "重启开发环境..."
            docker-compose restart
            log_success "开发环境已重启"
            ;;
        build)
            check_docker
            build
            ;;
        clean)
            cleanup "$2"
            log_success "清理完成"
            ;;
        logs)
            logs "$2"
            ;;
        status)
            docker-compose ps
            ;;
        shell)
            if [ -n "$2" ]; then
                docker-compose exec "$2" sh
            else
                log_error "请指定服务名"
                exit 1
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
