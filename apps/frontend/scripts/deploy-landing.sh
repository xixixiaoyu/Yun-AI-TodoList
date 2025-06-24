#!/bin/bash

# Yun AI TodoList 宣传页面部署脚本
# 支持多种部署方式：本地预览、Cloudflare Pages、Vercel、Netlify

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

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 构建宣传页面
build_landing() {
    log_info "开始构建宣传页面..."
    
    # 清理旧的构建产物
    if [ -d "dist-landing" ]; then
        rm -rf dist-landing
        log_info "清理旧的构建产物"
    fi
    
    # 安装依赖
    log_info "安装依赖..."
    pnpm install
    
    # 构建
    log_info "执行构建..."
    pnpm landing:build
    
    if [ $? -eq 0 ]; then
        log_success "构建完成！"
    else
        log_error "构建失败！"
        exit 1
    fi
}

# 本地预览
preview_local() {
    log_info "启动本地预览..."
    pnpm landing:preview
}

# 部署到 Cloudflare Pages
deploy_cloudflare() {
    log_info "部署到 Cloudflare Pages..."
    
    if ! command -v wrangler &> /dev/null; then
        log_warning "wrangler 未安装，正在安装..."
        npm install -g wrangler
    fi
    
    # 检查是否已登录
    if ! wrangler whoami &> /dev/null; then
        log_info "请先登录 Cloudflare："
        wrangler login
    fi
    
    # 部署
    wrangler pages deploy dist-landing --project-name=yun-ai-todolist-landing
    
    log_success "部署到 Cloudflare Pages 完成！"
}

# 部署到 Vercel
deploy_vercel() {
    log_info "部署到 Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_warning "vercel CLI 未安装，正在安装..."
        npm install -g vercel
    fi
    
    # 部署
    vercel --prod dist-landing
    
    log_success "部署到 Vercel 完成！"
}

# 部署到 Netlify
deploy_netlify() {
    log_info "部署到 Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        log_warning "netlify CLI 未安装，正在安装..."
        npm install -g netlify-cli
    fi
    
    # 检查是否已登录
    if ! netlify status &> /dev/null; then
        log_info "请先登录 Netlify："
        netlify login
    fi
    
    # 部署
    netlify deploy --prod --dir=dist-landing
    
    log_success "部署到 Netlify 完成！"
}

# 生成部署报告
generate_report() {
    log_info "生成部署报告..."
    
    REPORT_FILE="deployment-report.md"
    BUILD_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    BUILD_SIZE=$(du -sh dist-landing 2>/dev/null | cut -f1 || echo "未知")
    
    cat > $REPORT_FILE << EOF
# 宣传页面部署报告

## 构建信息
- **构建时间**: $BUILD_TIME
- **构建大小**: $BUILD_SIZE
- **Node.js 版本**: $(node --version)
- **pnpm 版本**: $(pnpm --version)

## 文件结构
\`\`\`
$(find dist-landing -type f | head -20)
$([ $(find dist-landing -type f | wc -l) -gt 20 ] && echo "... 更多文件")
\`\`\`

## 部署说明
1. 构建产物位于 \`dist-landing/\` 目录
2. 可以部署到任何静态文件托管服务
3. 支持的部署平台：
   - Cloudflare Pages
   - Vercel
   - Netlify
   - GitHub Pages
   - 任何 CDN 或静态文件服务器

## 访问地址
- 本地预览: http://localhost:3003
- 生产环境: 根据部署平台而定

## 性能优化
- 启用了代码分割和资源压缩
- 图片和字体文件已优化
- 支持现代浏览器的 ES2015+ 语法
- 包含完整的 SEO 配置

---
生成时间: $BUILD_TIME
EOF

    log_success "部署报告已生成: $REPORT_FILE"
}

# 显示帮助信息
show_help() {
    echo "Yun AI TodoList 宣传页面部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  build              构建宣传页面"
    echo "  preview            本地预览"
    echo "  deploy-cf          部署到 Cloudflare Pages"
    echo "  deploy-vercel      部署到 Vercel"
    echo "  deploy-netlify     部署到 Netlify"
    echo "  report             生成部署报告"
    echo "  help               显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build           # 构建宣传页面"
    echo "  $0 preview         # 本地预览"
    echo "  $0 deploy-cf       # 部署到 Cloudflare Pages"
}

# 主函数
main() {
    case "$1" in
        "build")
            check_dependencies
            build_landing
            generate_report
            ;;
        "preview")
            check_dependencies
            if [ ! -d "dist-landing" ]; then
                log_warning "构建产物不存在，先执行构建..."
                build_landing
            fi
            preview_local
            ;;
        "deploy-cf")
            check_dependencies
            build_landing
            deploy_cloudflare
            generate_report
            ;;
        "deploy-vercel")
            check_dependencies
            build_landing
            deploy_vercel
            generate_report
            ;;
        "deploy-netlify")
            check_dependencies
            build_landing
            deploy_netlify
            generate_report
            ;;
        "report")
            generate_report
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            log_error "请指定操作，使用 '$0 help' 查看帮助"
            exit 1
            ;;
        *)
            log_error "未知操作: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
