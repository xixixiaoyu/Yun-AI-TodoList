#!/bin/bash

# Docker 构建脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
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

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "Docker 环境检查通过"
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."

    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -t yun-todolist-backend:latest ./apps/backend

    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -t yun-todolist-frontend:latest ./apps/frontend

    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    local env=${1:-"dev"}

    log_info "启动 $env 环境服务..."

    case "$env" in
        "prod")
            docker-compose -f docker-compose.prod.yml up -d
            ;;
        "dev")
            docker-compose -f docker-compose.dev.yml up -d
            ;;
        "test")
            docker-compose -f docker-compose.test.yml up -d
            ;;
        *)
            docker-compose up -d
            ;;
    esac

    log_success "$env 环境服务启动完成"
}

# 停止服务
stop_services() {
    local env=${1:-"dev"}

    log_info "停止 $env 环境服务..."

    if [ "$env" = "prod" ]; then
        docker-compose down
    else
        docker-compose -f docker-compose.dev.yml down
    fi

    log_success "$env 环境服务停止完成"
}

# 清理资源
cleanup() {
    log_info "清理 Docker 资源..."

    # 停止所有容器
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

    # 删除未使用的镜像
    docker image prune -f

    # 删除未使用的卷
    docker volume prune -f

    log_success "资源清理完成"
}

# 查看日志
view_logs() {
    local service=${1:-""}
    local env=${2:-"dev"}

    if [ "$env" = "prod" ]; then
        if [ -n "$service" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$service"
        else
            docker-compose -f docker-compose.dev.yml logs -f
        fi
    fi
}

# 显示帮助信息
show_help() {
    echo "Yun AI TodoList Docker 管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  build                构建 Docker 镜像"
    echo "  start [env]          启动服务 (env: dev|prod, 默认: dev)"
    echo "  stop [env]           停止服务 (env: dev|prod, 默认: dev)"
    echo "  restart [env]        重启服务 (env: dev|prod, 默认: dev)"
    echo "  logs [service] [env] 查看日志"
    echo "  cleanup              清理 Docker 资源"
    echo "  help                 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build             # 构建镜像"
    echo "  $0 start dev         # 启动开发环境"
    echo "  $0 start prod        # 启动生产环境"
    echo "  $0 logs backend dev  # 查看开发环境后端日志"
    echo "  $0 cleanup           # 清理资源"
}

# 主函数
main() {
    case "${1:-help}" in
        "build")
            check_docker
            build_images
            ;;
        "start")
            check_docker
            start_services "${2:-dev}"
            ;;
        "stop")
            check_docker
            stop_services "${2:-dev}"
            ;;
        "restart")
            check_docker
            stop_services "${2:-dev}"
            start_services "${2:-dev}"
            ;;
        "logs")
            view_logs "$2" "${3:-dev}"
            ;;
        "cleanup")
            check_docker
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
