#!/bin/bash

# ===========================================
# Yun AI TodoList - 增强版 Docker 安全检查脚本
# 检查 Docker 镜像和容器的安全配置
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

# 安全检查计数器
security_issues=0
security_warnings=0

echo "🔒 Docker 安全检查开始..."

# 检查 Docker 版本
check_docker_version() {
    log_info "检查 Docker 版本..."
    docker_version=$(docker --version)
    echo "$docker_version"
    
    # 检查 Docker 版本是否过旧
    version_num=$(echo "$docker_version" | grep -oE '[0-9]+\.[0-9]+' | head -1)
    major_version=$(echo "$version_num" | cut -d. -f1)
    minor_version=$(echo "$version_num" | cut -d. -f2)
    
    if [ "$major_version" -lt 20 ] || ([ "$major_version" -eq 20 ] && [ "$minor_version" -lt 10 ]); then
        log_warning "Docker 版本较旧，建议升级到 20.10 或更高版本"
        ((security_warnings++))
    else
        log_success "Docker 版本检查通过"
    fi
}

# 检查运行中的容器
check_running_containers() {
    log_info "检查运行中的容器..."
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

# 镜像漏洞扫描
scan_image_vulnerabilities() {
    if command -v trivy &> /dev/null; then
        log_info "使用 Trivy 扫描镜像漏洞..."
        
        # 获取所有 yun-todolist 相关镜像
        images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep yun-todolist || true)
        
        if [ -n "$images" ]; then
            for image in $images; do
                log_info "扫描镜像: $image"
                
                # 扫描高危和严重漏洞
                if trivy image --severity HIGH,CRITICAL --quiet "$image"; then
                    log_success "镜像 $image 安全扫描通过"
                else
                    log_error "镜像 $image 发现安全漏洞"
                    ((security_issues++))
                fi
            done
        else
            log_warning "未找到 yun-todolist 相关镜像"
        fi
    else
        log_warning "Trivy 未安装，跳过镜像漏洞扫描"
        log_info "安装 Trivy: https://aquasecurity.github.io/trivy/"
        ((security_warnings++))
    fi
}

# 检查容器安全配置
check_container_security() {
    log_info "检查容器安全配置..."
    
    containers=$(docker ps --format "{{.Names}}" | grep yun-todolist || true)
    
    if [ -n "$containers" ]; then
        for container in $containers; do
            log_info "检查容器: $container"
            
            # 检查是否以 root 用户运行
            user=$(docker exec "$container" whoami 2>/dev/null || echo "unknown")
            if [ "$user" = "root" ]; then
                log_error "容器 $container 以 root 用户运行"
                ((security_issues++))
            else
                log_success "容器 $container 以非 root 用户运行: $user"
            fi
            
            # 检查容器权限
            privileged=$(docker inspect "$container" --format '{{.HostConfig.Privileged}}')
            if [ "$privileged" = "true" ]; then
                log_error "容器 $container 运行在特权模式"
                ((security_issues++))
            else
                log_success "容器 $container 未运行在特权模式"
            fi
            
            # 检查只读文件系统
            readonly=$(docker inspect "$container" --format '{{.HostConfig.ReadonlyRootfs}}')
            if [ "$readonly" = "true" ]; then
                log_success "容器 $container 使用只读文件系统"
            else
                log_warning "容器 $container 未使用只读文件系统"
                ((security_warnings++))
            fi
            
            # 检查安全选项
            security_opt=$(docker inspect "$container" --format '{{.HostConfig.SecurityOpt}}')
            if echo "$security_opt" | grep -q "no-new-privileges:true"; then
                log_success "容器 $container 启用了 no-new-privileges"
            else
                log_warning "容器 $container 未启用 no-new-privileges"
                ((security_warnings++))
            fi
            
            # 检查内存限制
            memory_limit=$(docker inspect "$container" --format '{{.HostConfig.Memory}}')
            if [ "$memory_limit" != "0" ]; then
                log_success "容器 $container 设置了内存限制"
            else
                log_warning "容器 $container 未设置内存限制"
                ((security_warnings++))
            fi
            
            # 检查 CPU 限制
            cpu_quota=$(docker inspect "$container" --format '{{.HostConfig.CpuQuota}}')
            if [ "$cpu_quota" != "0" ]; then
                log_success "容器 $container 设置了 CPU 限制"
            else
                log_warning "容器 $container 未设置 CPU 限制"
                ((security_warnings++))
            fi
        done
    else
        log_warning "未找到运行中的 yun-todolist 容器"
    fi
}

# 检查网络安全
check_network_security() {
    log_info "检查 Docker 网络配置..."
    
    networks=$(docker network ls --format "{{.Name}}" | grep yun-todolist || true)
    
    if [ -n "$networks" ]; then
        for network in $networks; do
            log_info "检查网络: $network"
            
            # 检查网络驱动
            driver=$(docker network inspect "$network" --format '{{.Driver}}')
            if [ "$driver" = "bridge" ]; then
                log_success "网络 $network 使用 bridge 驱动"
            else
                log_info "网络 $network 使用 $driver 驱动"
            fi
            
            # 检查网络隔离
            internal=$(docker network inspect "$network" --format '{{.Internal}}')
            if [ "$internal" = "true" ]; then
                log_success "网络 $network 是内部网络"
            else
                log_info "网络 $network 不是内部网络"
            fi
        done
    else
        log_warning "未找到 yun-todolist 网络"
    fi
}

# 检查卷挂载安全
check_volume_security() {
    log_info "检查卷挂载安全..."
    
    volumes=$(docker volume ls --format "{{.Name}}" | grep yun-todolist || true)
    
    if [ -n "$volumes" ]; then
        for volume in $volumes; do
            log_info "检查卷: $volume"
            
            # 检查卷驱动
            driver=$(docker volume inspect "$volume" --format '{{.Driver}}')
            log_info "卷 $volume 使用 $driver 驱动"
        done
    else
        log_warning "未找到 yun-todolist 卷"
    fi
    
    # 检查敏感文件挂载
    containers=$(docker ps --format "{{.Names}}" | grep yun-todolist || true)
    
    if [ -n "$containers" ]; then
        for container in $containers; do
            mounts=$(docker inspect "$container" --format '{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}')
            
            if echo "$mounts" | grep -q "/var/run/docker.sock"; then
                log_error "容器 $container 挂载了 Docker socket"
                ((security_issues++))
            fi
            
            if echo "$mounts" | grep -q "/proc"; then
                log_warning "容器 $container 挂载了 /proc"
                ((security_warnings++))
            fi
            
            if echo "$mounts" | grep -q "/sys"; then
                log_warning "容器 $container 挂载了 /sys"
                ((security_warnings++))
            fi
        done
    fi
}

# 检查镜像安全最佳实践
check_image_best_practices() {
    log_info "检查镜像安全最佳实践..."
    
    images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep yun-todolist || true)
    
    if [ -n "$images" ]; then
        for image in $images; do
            # 检查镜像大小
            size=$(docker images --format "{{.Size}}" "$image")
            log_info "镜像 $image 大小: $size"
            
            # 检查镜像历史层数
            layers=$(docker history "$image" --quiet | wc -l)
            if [ "$layers" -gt 20 ]; then
                log_warning "镜像 $image 层数较多 ($layers)，建议优化"
                ((security_warnings++))
            else
                log_success "镜像 $image 层数合理 ($layers)"
            fi
        done
    fi
}

# 生成安全报告
generate_security_report() {
    echo ""
    echo "🔒 Docker 安全检查报告"
    echo "========================"
    echo "安全问题: $security_issues"
    echo "安全警告: $security_warnings"
    echo ""
    
    if [ "$security_issues" -eq 0 ] && [ "$security_warnings" -eq 0 ]; then
        log_success "所有安全检查通过！"
        return 0
    elif [ "$security_issues" -eq 0 ]; then
        log_warning "发现 $security_warnings 个安全警告，建议优化"
        return 0
    else
        log_error "发现 $security_issues 个安全问题，需要立即修复"
        return 1
    fi
}

# 主函数
main() {
    check_docker_version
    check_running_containers
    scan_image_vulnerabilities
    check_container_security
    check_network_security
    check_volume_security
    check_image_best_practices
    generate_security_report
}

# 执行主函数
main "$@"
