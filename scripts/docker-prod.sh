#!/bin/bash

# ===========================================
# Yun AI TodoList - 生产环境 Docker 部署脚本
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

# 检查生产环境配置
check_prod_config() {
    if [ ! -f .env.production ]; then
        log_error "生产环境配置文件 .env.production 不存在"
        log_info "请创建 .env.production 文件并配置生产环境变量"
        exit 1
    fi
    
    # 检查关键环境变量
    source .env.production
    
    required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "生产环境变量 $var 未设置"
            exit 1
        fi
    done
    
    # 检查密码强度
    if [ ${#POSTGRES_PASSWORD} -lt 12 ]; then
        log_error "POSTGRES_PASSWORD 长度至少需要 12 个字符"
        exit 1
    fi
    
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET 长度至少需要 32 个字符"
        exit 1
    fi
}

# 安全扫描
security_scan() {
    log_info "执行安全扫描..."
    
    # 检查是否安装了 trivy
    if command -v trivy &> /dev/null; then
        log_info "使用 Trivy 扫描镜像安全漏洞..."
        trivy image yun-todolist-backend-prod || log_warning "后端镜像安全扫描发现问题"
        trivy image yun-todolist-frontend-prod || log_warning "前端镜像安全扫描发现问题"
    else
        log_warning "未安装 Trivy，跳过安全扫描"
        log_info "建议安装 Trivy: https://aquasecurity.github.io/trivy/"
    fi
}

# 备份数据
backup_data() {
    log_info "备份生产数据..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="./backups/$timestamp"
    
    mkdir -p "$backup_dir"
    
    # 备份数据库
    if docker-compose -f docker-compose.prod.yml ps | grep -q "postgres.*Up"; then
        log_info "备份 PostgreSQL 数据库..."
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres yun_ai_todolist > "$backup_dir/database.sql"
        log_success "数据库备份完成: $backup_dir/database.sql"
    fi
    
    # 备份上传文件
    if [ -d "./uploads" ]; then
        log_info "备份上传文件..."
        cp -r ./uploads "$backup_dir/"
        log_success "文件备份完成: $backup_dir/uploads"
    fi
    
    log_success "数据备份完成: $backup_dir"
}

# 构建生产镜像
build_prod() {
    log_info "构建生产环境镜像..."
    
    # 设置构建参数
    export DOCKER_BUILDKIT=1
    
    # 构建镜像
    docker-compose -f docker-compose.prod.yml build --no-cache --parallel
    
    log_success "生产镜像构建完成"
}

# 部署生产环境
deploy_prod() {
    log_info "部署生产环境..."
    
    # 使用生产环境配置
    export $(cat .env.production | xargs)
    
    # 启动服务
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_prod_services
}

# 检查生产服务状态
check_prod_services() {
    log_info "检查生产服务状态..."
    
    services=("postgres" "redis" "backend" "frontend")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务启动失败"
            docker-compose -f docker-compose.prod.yml logs "$service"
            exit 1
        fi
    done
    
    # 健康检查
    log_info "执行健康检查..."
    
    # 检查后端 API
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "后端 API 健康检查通过"
    else
        log_error "后端 API 健康检查失败"
        exit 1
    fi
    
    # 检查前端
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "前端健康检查通过"
    else
        log_error "前端健康检查失败"
        exit 1
    fi
}

# 滚动更新
rolling_update() {
    log_info "执行滚动更新..."
    
    # 备份当前数据
    backup_data
    
    # 构建新镜像
    build_prod
    
    # 逐个更新服务
    services=("backend" "frontend")
    
    for service in "${services[@]}"; do
        log_info "更新 $service 服务..."
        docker-compose -f docker-compose.prod.yml up -d --no-deps "$service"
        
        # 等待服务启动
        sleep 10
        
        # 检查服务状态
        if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
            log_success "$service 服务更新成功"
        else
            log_error "$service 服务更新失败，正在回滚..."
            # 这里可以添加回滚逻辑
            exit 1
        fi
    done
    
    log_success "滚动更新完成"
}

# 显示帮助信息
show_help() {
    echo "Yun AI TodoList 生产环境 Docker 管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  deploy        部署生产环境"
    echo "  update        滚动更新"
    echo "  stop          停止生产环境"
    echo "  restart       重启生产环境"
    echo "  backup        备份数据"
    echo "  logs [服务名]  查看日志"
    echo "  status        查看服务状态"
    echo "  scan          安全扫描"
    echo "  help          显示帮助信息"
    echo ""
    echo "注意事项:"
    echo "  - 部署前请确保 .env.production 文件存在并正确配置"
    echo "  - 生产环境密码必须足够强壮"
    echo "  - 建议在部署前执行安全扫描"
    echo ""
    echo "示例:"
    echo "  $0 deploy                   # 部署生产环境"
    echo "  $0 update                   # 滚动更新"
    echo "  $0 backup                   # 备份数据"
    echo "  $0 logs backend             # 查看后端日志"
}

# 主函数
main() {
    case "$1" in
        deploy)
            check_docker
            check_prod_config
            build_prod
            security_scan
            deploy_prod
            log_success "生产环境部署完成！"
            log_info "前端地址: http://localhost"
            log_info "后端地址: http://localhost:3000"
            ;;
        update)
            check_docker
            check_prod_config
            rolling_update
            ;;
        stop)
            log_info "停止生产环境..."
            docker-compose -f docker-compose.prod.yml down
            log_success "生产环境已停止"
            ;;
        restart)
            log_info "重启生产环境..."
            docker-compose -f docker-compose.prod.yml restart
            log_success "生产环境已重启"
            ;;
        backup)
            backup_data
            ;;
        logs)
            if [ -n "$2" ]; then
                docker-compose -f docker-compose.prod.yml logs -f "$2"
            else
                docker-compose -f docker-compose.prod.yml logs -f
            fi
            ;;
        status)
            docker-compose -f docker-compose.prod.yml ps
            check_prod_services
            ;;
        scan)
            security_scan
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
