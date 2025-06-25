#!/bin/bash

# ===========================================
# Yun AI TodoList - 仅启动基础服务
# 数据库、缓存和管理工具
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
    log_success "Docker 运行正常"
}

# 创建 .env 文件
create_env() {
    if [ ! -f .env ]; then
        log_info "创建 .env 文件..."
        cat > .env << 'EOF'
NODE_ENV=development
POSTGRES_DB=yun_ai_todolist_dev
POSTGRES_USER=postgres
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
        log_success "已创建 .env 文件"
    else
        log_info ".env 文件已存在"
    fi
}

# 启动基础服务
start_basic_services() {
    log_info "启动基础服务（数据库、缓存和管理工具）..."
    
    # 清理旧容器
    docker-compose -f docker-compose.dev.yml down --remove-orphans > /dev/null 2>&1 || true
    
    # 启动基础服务
    docker-compose -f docker-compose.dev.yml up -d postgres-dev redis-dev adminer
    
    # 等待服务启动
    log_info "等待基础服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -f docker-compose.dev.yml ps | grep -q "postgres-dev.*Up"; then
        log_success "PostgreSQL 启动成功"
    else
        log_error "PostgreSQL 启动失败"
        return 1
    fi
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "redis-dev.*Up"; then
        log_success "Redis 启动成功"
    else
        log_error "Redis 启动失败"
        return 1
    fi
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "adminer.*Up"; then
        log_success "Adminer 启动成功"
    else
        log_warning "Adminer 可能启动失败，但不影响核心功能"
    fi
}

# 显示访问信息和下一步
show_info() {
    echo ""
    log_success "🎉 基础服务启动完成！"
    echo ""
    echo "📱 可用服务："
    echo "  数据库管理:   http://localhost:8080"
    echo "    - 服务器: postgres-dev"
    echo "    - 用户名: postgres"
    echo "    - 密码: postgres123"
    echo "    - 数据库: yun_ai_todolist_dev"
    echo ""
    echo "📊 数据库连接信息："
    echo "  主机: localhost"
    echo "  端口: 5433"
    echo "  数据库: yun_ai_todolist_dev"
    echo "  用户名: postgres"
    echo "  密码: postgres123"
    echo ""
    echo "🔧 下一步操作："
    echo "  1. 启动后端: cd apps/backend && pnpm dev"
    echo "  2. 启动前端: cd apps/frontend && pnpm dev"
    echo ""
    echo "💡 或者尝试构建 Docker 镜像："
    echo "  docker-compose -f docker-compose.dev.yml build backend-dev"
    echo "  docker-compose -f docker-compose.dev.yml build frontend-dev"
    echo ""
    echo "🔧 常用命令："
    echo "  查看状态:     docker-compose -f docker-compose.dev.yml ps"
    echo "  查看日志:     docker-compose -f docker-compose.dev.yml logs -f [服务名]"
    echo "  停止服务:     docker-compose -f docker-compose.dev.yml down"
    echo ""
}

# 停止服务
stop_services() {
    log_info "停止基础服务..."
    docker-compose -f docker-compose.dev.yml down
    log_success "服务已停止"
}

# 显示帮助
show_help() {
    echo "Yun AI TodoList 基础服务管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start, -s     启动基础服务"
    echo "  stop, -t      停止所有服务"
    echo "  restart, -r   重启基础服务"
    echo "  status, -st   查看服务状态"
    echo "  help, -h      显示帮助信息"
    echo ""
}

# 查看状态
show_status() {
    log_info "服务状态："
    docker-compose -f docker-compose.dev.yml ps
}

# 主函数
main() {
    case "${1:-start}" in
        start|-s)
            check_docker
            create_env
            start_basic_services
            show_info
            ;;
        stop|-t)
            stop_services
            ;;
        restart|-r)
            check_docker
            stop_services
            sleep 2
            start_basic_services
            show_info
            ;;
        status|-st)
            show_status
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
