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
            log_error ".env.example 文件不存在"
            exit 1
        fi
    fi
}

# 清理旧容器和镜像
cleanup() {
    log_info "清理旧的开发环境容器..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    if [ "$1" = "--clean" ]; then
        log_info "清理开发环境镜像和卷..."
        docker-compose -f docker-compose.dev.yml down --volumes --rmi local
        docker system prune -f
    fi
}

# 构建镜像
build() {
    log_info "构建开发环境镜像..."
    docker-compose -f docker-compose.dev.yml build --no-cache
}

# 启动服务
start() {
    log_info "启动开发环境服务..."
    docker-compose -f docker-compose.dev.yml up -d
    
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    services=("postgres-dev" "redis-dev" "backend-dev" "frontend-dev")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务启动失败"
            docker-compose -f docker-compose.dev.yml logs "$service"
        fi
    done
}

# 显示日志
logs() {
    if [ -n "$1" ]; then
        docker-compose -f docker-compose.dev.yml logs -f "$1"
    else
        docker-compose -f docker-compose.dev.yml logs -f
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
    echo "  $0 logs backend-dev         # 查看后端日志"
    echo "  $0 shell frontend-dev       # 进入前端容器"
    echo "  $0 clean --clean            # 完全清理"
}

# 主函数
main() {
    case "$1" in
        start)
            check_docker
            check_env
            cleanup
            build
            start
            log_success "开发环境启动完成！"
            log_info "前端地址: http://localhost:5173"
            log_info "后端地址: http://localhost:3000"
            log_info "数据库管理: http://localhost:8080"
            ;;
        stop)
            log_info "停止开发环境..."
            docker-compose -f docker-compose.dev.yml down
            log_success "开发环境已停止"
            ;;
        restart)
            log_info "重启开发环境..."
            docker-compose -f docker-compose.dev.yml restart
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
            docker-compose -f docker-compose.dev.yml ps
            ;;
        shell)
            if [ -n "$2" ]; then
                docker-compose -f docker-compose.dev.yml exec "$2" sh
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
