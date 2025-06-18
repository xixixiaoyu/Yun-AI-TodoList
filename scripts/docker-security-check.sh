#!/bin/bash

# Docker 安全检查脚本
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

# 检查 Docker 镜像安全
check_image_security() {
    local image_name=$1
    
    log_info "检查镜像安全性: $image_name"
    
    # 检查镜像是否存在
    if ! docker image inspect "$image_name" >/dev/null 2>&1; then
        log_error "镜像不存在: $image_name"
        return 1
    fi
    
    # 检查镜像大小
    local image_size=$(docker image inspect "$image_name" --format='{{.Size}}' | awk '{print int($1/1024/1024)}')
    if [ "$image_size" -gt 500 ]; then
        log_warning "镜像大小较大: ${image_size}MB (建议小于 500MB)"
    else
        log_success "镜像大小合理: ${image_size}MB"
    fi
    
    # 检查镜像层数
    local layers=$(docker history "$image_name" --quiet | wc -l)
    if [ "$layers" -gt 20 ]; then
        log_warning "镜像层数较多: $layers (建议小于 20 层)"
    else
        log_success "镜像层数合理: $layers"
    fi
    
    # 检查是否使用非 root 用户
    local user=$(docker image inspect "$image_name" --format='{{.Config.User}}')
    if [ -z "$user" ] || [ "$user" = "root" ] || [ "$user" = "0" ]; then
        log_error "镜像使用 root 用户运行，存在安全风险"
    else
        log_success "镜像使用非 root 用户运行: $user"
    fi
}

# 检查容器安全配置
check_container_security() {
    local container_name=$1
    
    log_info "检查容器安全配置: $container_name"
    
    # 检查容器是否存在
    if ! docker container inspect "$container_name" >/dev/null 2>&1; then
        log_error "容器不存在: $container_name"
        return 1
    fi
    
    # 检查是否以特权模式运行
    local privileged=$(docker container inspect "$container_name" --format='{{.HostConfig.Privileged}}')
    if [ "$privileged" = "true" ]; then
        log_error "容器以特权模式运行，存在安全风险"
    else
        log_success "容器未使用特权模式"
    fi
    
    # 检查是否挂载了敏感目录
    local mounts=$(docker container inspect "$container_name" --format='{{range .Mounts}}{{.Source}} {{end}}')
    for mount in $mounts; do
        case "$mount" in
            "/"|"/etc"|"/usr"|"/bin"|"/sbin"|"/var"|"/proc"|"/sys")
                log_warning "容器挂载了敏感系统目录: $mount"
                ;;
        esac
    done
    
    # 检查网络模式
    local network_mode=$(docker container inspect "$container_name" --format='{{.HostConfig.NetworkMode}}')
    if [ "$network_mode" = "host" ]; then
        log_warning "容器使用主机网络模式，可能存在安全风险"
    else
        log_success "容器使用安全的网络模式: $network_mode"
    fi
    
    # 检查资源限制
    local memory_limit=$(docker container inspect "$container_name" --format='{{.HostConfig.Memory}}')
    local cpu_limit=$(docker container inspect "$container_name" --format='{{.HostConfig.CpuQuota}}')
    
    if [ "$memory_limit" = "0" ]; then
        log_warning "容器未设置内存限制"
    else
        local memory_mb=$((memory_limit / 1024 / 1024))
        log_success "容器设置了内存限制: ${memory_mb}MB"
    fi
    
    if [ "$cpu_limit" = "0" ] || [ "$cpu_limit" = "-1" ]; then
        log_warning "容器未设置 CPU 限制"
    else
        log_success "容器设置了 CPU 限制"
    fi
}

# 检查 Docker Compose 安全配置
check_compose_security() {
    local compose_file=${1:-"docker-compose.yml"}
    
    log_info "检查 Docker Compose 安全配置: $compose_file"
    
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose 文件不存在: $compose_file"
        return 1
    fi
    
    # 检查是否使用了默认密码
    if grep -q "postgres123\|redis123\|your-super-secret" "$compose_file"; then
        log_error "发现默认密码，请修改为强密码"
    else
        log_success "未发现明显的默认密码"
    fi
    
    # 检查是否暴露了不必要的端口
    local exposed_ports=$(grep -E "^\s*-\s*[\"']?[0-9]+:[0-9]+" "$compose_file" | wc -l)
    if [ "$exposed_ports" -gt 5 ]; then
        log_warning "暴露了较多端口 ($exposed_ports)，请检查是否必要"
    else
        log_success "端口暴露数量合理: $exposed_ports"
    fi
    
    log_success "Docker Compose 安全检查完成"
}

# 生成安全报告
generate_security_report() {
    local report_file="docker-security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    log_info "生成安全报告: $report_file"
    
    {
        echo "Docker 安全检查报告"
        echo "===================="
        echo "检查时间: $(date)"
        echo ""
        
        echo "镜像安全检查:"
        echo "------------"
        check_image_security "yun-todolist-backend:latest" 2>&1
        check_image_security "yun-todolist-frontend:latest" 2>&1
        echo ""
        
        echo "容器安全检查:"
        echo "------------"
        for container in $(docker ps --format "{{.Names}}" | grep yun-todolist); do
            check_container_security "$container" 2>&1
            echo ""
        done
        
        echo "Docker Compose 安全检查:"
        echo "----------------------"
        check_compose_security "docker-compose.yml" 2>&1
        check_compose_security "docker-compose.prod.yml" 2>&1
        
    } > "$report_file"
    
    log_success "安全报告已生成: $report_file"
}

# 主函数
main() {
    case "${1:-check}" in
        "images")
            check_image_security "yun-todolist-backend:latest"
            check_image_security "yun-todolist-frontend:latest"
            ;;
        "containers")
            for container in $(docker ps --format "{{.Names}}" | grep yun-todolist); do
                check_container_security "$container"
            done
            ;;
        "compose")
            check_compose_security "docker-compose.yml"
            check_compose_security "docker-compose.prod.yml"
            ;;
        "report")
            generate_security_report
            ;;
        "check"|*)
            log_info "开始 Docker 安全检查..."
            check_image_security "yun-todolist-backend:latest"
            check_image_security "yun-todolist-frontend:latest"
            
            for container in $(docker ps --format "{{.Names}}" | grep yun-todolist 2>/dev/null || true); do
                check_container_security "$container"
            done
            
            check_compose_security "docker-compose.yml"
            check_compose_security "docker-compose.prod.yml"
            
            log_success "Docker 安全检查完成"
            ;;
    esac
}

# 执行主函数
main "$@"
