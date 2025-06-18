#!/bin/bash

# Cloudflare Workers 部署测试脚本
# 使用方法: ./scripts/test-cloudflare-deployment.sh [URL]

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

# 获取测试 URL
TEST_URL=${1:-"https://yun-ai-todolist-dev.your-subdomain.workers.dev"}

log_info "开始测试 Cloudflare Workers 部署..."
log_info "测试 URL: $TEST_URL"

# 检查必要工具
if ! command -v curl &> /dev/null; then
    log_error "curl 未安装，无法进行测试"
    exit 1
fi

# 测试主页
log_info "测试主页访问..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")

if [ "$HTTP_STATUS" = "200" ]; then
    log_success "主页访问正常 (HTTP $HTTP_STATUS)"
else
    log_error "主页访问失败 (HTTP $HTTP_STATUS)"
    exit 1
fi

# 测试静态资源
log_info "测试静态资源访问..."
ASSETS_URL="$TEST_URL/assets/"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ASSETS_URL")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "403" ]; then
    log_success "静态资源路径可访问"
else
    log_warning "静态资源路径访问异常 (HTTP $HTTP_STATUS)"
fi

# 测试 SPA 路由
log_info "测试 SPA 路由..."
SPA_ROUTES=("/todo" "/todo/tasks" "/todo/settings")

for route in "${SPA_ROUTES[@]}"; do
    ROUTE_URL="$TEST_URL$route"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ROUTE_URL")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "路由 $route 访问正常"
    else
        log_warning "路由 $route 访问异常 (HTTP $HTTP_STATUS)"
    fi
done

# 测试响应头
log_info "测试安全响应头..."
HEADERS=$(curl -s -I "$TEST_URL")

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    log_success "X-Frame-Options 头存在"
else
    log_warning "X-Frame-Options 头缺失"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    log_success "X-Content-Type-Options 头存在"
else
    log_warning "X-Content-Type-Options 头缺失"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
    log_success "Content-Security-Policy 头存在"
else
    log_warning "Content-Security-Policy 头缺失"
fi

# 测试响应时间
log_info "测试响应时间..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$TEST_URL")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l | cut -d. -f1)

if [ "$RESPONSE_TIME_MS" -lt 1000 ]; then
    log_success "响应时间良好: ${RESPONSE_TIME_MS}ms"
elif [ "$RESPONSE_TIME_MS" -lt 3000 ]; then
    log_warning "响应时间一般: ${RESPONSE_TIME_MS}ms"
else
    log_error "响应时间过慢: ${RESPONSE_TIME_MS}ms"
fi

log_success "Cloudflare Workers 部署测试完成！"
log_info "如果发现问题，请检查:"
log_info "1. Wrangler 配置是否正确"
log_info "2. 静态文件是否正确构建"
log_info "3. Workers 代码是否有错误"
log_info "4. 域名解析是否正确"
