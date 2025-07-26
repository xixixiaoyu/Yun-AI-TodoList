#!/bin/bash

# 七牛云部署脚本
# 使用方法: ./scripts/deploy-qiniu.sh

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

# 检查环境变量
check_env() {
    log_info "🔍 检查环境变量..."
    
    if [ -z "$QINIU_ACCESS_KEY" ]; then
        log_error "❌ QINIU_ACCESS_KEY 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$QINIU_SECRET_KEY" ]; then
        log_error "❌ QINIU_SECRET_KEY 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$QINIU_BUCKET" ]; then
        log_error "❌ QINIU_BUCKET 环境变量未设置"
        exit 1
    fi
    
    log_success "✅ 环境变量检查通过"
}

# 检查 qshell 工具
check_qshell() {
    log_info "🔍 检查 qshell 工具..."
    
    if ! command -v qshell &> /dev/null; then
        log_warning "⚠️ qshell 未安装，正在安装..."
        
        # 根据系统类型下载 qshell
        OS=$(uname -s)
        ARCH=$(uname -m)
        
        case $OS in
            "Darwin")
                if [ "$ARCH" = "arm64" ]; then
                    QSHELL_URL="https://devtools.qiniu.com/qshell-v2.12.1-darwin-arm64.tar.gz"
                else
                    QSHELL_URL="https://devtools.qiniu.com/qshell-v2.12.1-darwin-x64.tar.gz"
                fi
                ;;
            "Linux")
                if [ "$ARCH" = "aarch64" ]; then
                    QSHELL_URL="https://devtools.qiniu.com/qshell-v2.12.1-linux-arm64.tar.gz"
                else
                    QSHELL_URL="https://devtools.qiniu.com/qshell-v2.12.1-linux-x64.tar.gz"
                fi
                ;;
            *)
                log_error "❌ 不支持的操作系统: $OS"
                exit 1
                ;;
        esac
        
        # 下载并安装 qshell
        curl -L "$QSHELL_URL" -o qshell.tar.gz
        tar -xzf qshell.tar.gz
        chmod +x qshell
        sudo mv qshell /usr/local/bin/
        rm qshell.tar.gz
        
        log_success "✅ qshell 安装完成"
    else
        log_success "✅ qshell 已安装"
    fi
}

# 配置 qshell 账号
setup_qshell() {
    log_info "🔧 配置 qshell 账号..."
    
    qshell account "$QINIU_ACCESS_KEY" "$QINIU_SECRET_KEY" "deploy-account"
    
    log_success "✅ qshell 账号配置完成"
}

# 检查构建产物
check_build() {
    log_info "🔍 检查构建产物..."
    
    if [ ! -d "apps/frontend/dist" ]; then
        log_error "❌ 构建产物不存在: apps/frontend/dist"
        log_info "请先运行: pnpm build"
        exit 1
    fi
    
    if [ ! -f "apps/frontend/dist/index.html" ]; then
        log_error "❌ index.html 不存在"
        exit 1
    fi
    
    log_success "✅ 构建产物检查通过"
}

# 创建上传配置文件
create_upload_config() {
    log_info "📝 创建上传配置文件..."
    
    cat > qiniu-upload.json << EOF
{
    "src_dir": "./apps/frontend/dist",
    "bucket": "$QINIU_BUCKET",
    "key_prefix": "",
    "overwrite": true,
    "check_exists": true,
    "check_hash": true,
    "check_size": true,
    "rescan_local": true,
    "skip_file_prefixes": ".DS_Store,Thumbs.db",
    "skip_path_prefixes": ".git,.svn",
    "skip_fixed_strings": ".DS_Store,Thumbs.db",
    "skip_suffixes": ".tmp,.swp",
    "log_file": "qiniu-upload.log",
    "log_level": "info",
    "log_rotate": 1,
    "log_stdout": false,
    "file_type": 0
}
EOF
    
    log_success "✅ 上传配置文件创建完成"
}

# 执行上传
upload_files() {
    log_info "🚀 开始上传文件到七牛云..."
    
    # 显示上传信息
    echo ""
    log_info "📋 上传信息:"
    log_info "   存储空间: $QINIU_BUCKET"
    log_info "   源目录: ./apps/frontend/dist"
    log_info "   文件数量: $(find apps/frontend/dist -type f | wc -l)"
    echo ""
    
    # 执行上传
    if qshell qupload2 --config qiniu-upload.json; then
        log_success "✅ 文件上传成功！"
    else
        log_error "❌ 文件上传失败"
        exit 1
    fi
}

# 清理临时文件
cleanup() {
    log_info "🧹 清理临时文件..."
    
    rm -f qiniu-upload.json
    rm -f qiniu-upload.log
    
    log_success "✅ 清理完成"
}

# 显示访问信息
show_access_info() {
    echo ""
    log_success "🎉 部署完成！"
    echo ""
    log_info "🌐 访问地址:"
    
    if [ -n "$QINIU_DOMAIN" ]; then
        log_info "   自定义域名: https://$QINIU_DOMAIN"
    fi
    
    log_info "   七牛云域名: http://$QINIU_BUCKET.your-region.qiniucdn.com"
    log_info "   管理控制台: https://portal.qiniu.com"
    echo ""
    log_info "💡 提示: 如果使用自定义域名，请确保已正确配置 CNAME 记录"
}

# 主函数
main() {
    echo ""
    log_info "🚀 开始七牛云部署流程..."
    echo ""
    
    check_env
    check_qshell
    setup_qshell
    check_build
    create_upload_config
    upload_files
    cleanup
    show_access_info
}

# 执行主函数
main "$@"
