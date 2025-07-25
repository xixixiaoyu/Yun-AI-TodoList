#!/bin/bash

# 缓存管理脚本
# 提供缓存清理、状态查看和性能统计功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 缓存文件路径
CACHE_PATHS=(
    ".eslintcache"
    ".prettiercache"
    "node_modules/.cache"
    "apps/frontend/.eslintcache"
    "apps/frontend/.prettiercache"
    "apps/backend/.eslintcache"
    "apps/backend/.prettiercache"
    ".cache"
    ".temp"
    ".tmp"
)

# 显示帮助信息
show_help() {
    echo "缓存管理脚本 - 管理项目中的各种缓存文件"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  status    显示缓存状态和大小"
    echo "  clean     清理所有缓存文件"
    echo "  eslint    仅清理 ESLint 缓存"
    echo "  prettier  仅清理 Prettier 缓存"
    echo "  node      仅清理 Node.js 缓存"
    echo "  stats     显示缓存统计信息"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 status     # 查看缓存状态"
    echo "  $0 clean      # 清理所有缓存"
    echo "  $0 eslint     # 仅清理 ESLint 缓存"
}

# 获取文件/目录大小（人类可读格式）
get_size() {
    local path="$1"
    if [ -f "$path" ] || [ -d "$path" ]; then
        if command -v du >/dev/null 2>&1; then
            du -sh "$path" 2>/dev/null | cut -f1
        else
            echo "N/A"
        fi
    else
        echo "0B"
    fi
}

# 显示缓存状态
show_status() {
    echo -e "${BLUE}📊 缓存状态报告${NC}"
    echo "=================================="
    
    local total_size=0
    local found_caches=0
    
    for cache_path in "${CACHE_PATHS[@]}"; do
        if [ -f "$cache_path" ] || [ -d "$cache_path" ]; then
            local size=$(get_size "$cache_path")
            echo -e "${GREEN}✓${NC} $cache_path: $size"
            ((found_caches++))
        else
            echo -e "${YELLOW}○${NC} $cache_path: 不存在"
        fi
    done
    
    echo ""
    echo -e "${BLUE}📈 统计信息:${NC}"
    echo "  - 找到缓存: $found_caches/${#CACHE_PATHS[@]}"
    
    if [ $found_caches -gt 0 ]; then
        echo -e "${GREEN}💡 提示: 运行 '$0 clean' 清理所有缓存${NC}"
    else
        echo -e "${GREEN}✨ 所有缓存都是干净的！${NC}"
    fi
}

# 清理指定缓存
clean_cache() {
    local pattern="$1"
    local description="$2"
    local cleaned=0
    
    echo -e "${YELLOW}🧹 清理 $description...${NC}"
    
    for cache_path in "${CACHE_PATHS[@]}"; do
        if [[ "$cache_path" == *"$pattern"* ]]; then
            if [ -f "$cache_path" ] || [ -d "$cache_path" ]; then
                local size=$(get_size "$cache_path")
                rm -rf "$cache_path"
                echo -e "${GREEN}✓${NC} 已删除 $cache_path ($size)"
                ((cleaned++))
            fi
        fi
    done
    
    if [ $cleaned -eq 0 ]; then
        echo -e "${YELLOW}○${NC} 没有找到 $description 缓存文件"
    else
        echo -e "${GREEN}✅ 清理了 $cleaned 个 $description 缓存文件${NC}"
    fi
}

# 清理所有缓存
clean_all() {
    echo -e "${BLUE}🧹 开始清理所有缓存...${NC}"
    echo ""
    
    local cleaned=0
    local total_size_before=0
    
    for cache_path in "${CACHE_PATHS[@]}"; do
        if [ -f "$cache_path" ] || [ -d "$cache_path" ]; then
            local size=$(get_size "$cache_path")
            rm -rf "$cache_path"
            echo -e "${GREEN}✓${NC} 已删除 $cache_path ($size)"
            ((cleaned++))
        fi
    done
    
    echo ""
    if [ $cleaned -eq 0 ]; then
        echo -e "${GREEN}✨ 所有缓存都已经是干净的！${NC}"
    else
        echo -e "${GREEN}🎉 成功清理了 $cleaned 个缓存文件/目录${NC}"
        echo -e "${BLUE}💡 下次运行 lint/format 命令时会重新生成缓存${NC}"
    fi
}

# 显示缓存统计
show_stats() {
    echo -e "${BLUE}📊 缓存性能统计${NC}"
    echo "=================================="
    
    # ESLint 缓存统计
    if [ -f ".eslintcache" ]; then
        echo -e "${GREEN}ESLint 缓存:${NC}"
        echo "  - 文件大小: $(get_size .eslintcache)"
        echo "  - 修改时间: $(stat -c %y .eslintcache 2>/dev/null || stat -f %Sm .eslintcache 2>/dev/null || echo 'N/A')"
    fi
    
    # Prettier 缓存统计
    if [ -f ".prettiercache" ]; then
        echo -e "${GREEN}Prettier 缓存:${NC}"
        echo "  - 文件大小: $(get_size .prettiercache)"
        echo "  - 修改时间: $(stat -c %y .prettiercache 2>/dev/null || stat -f %Sm .prettiercache 2>/dev/null || echo 'N/A')"
    fi
    
    # Node.js 缓存统计
    if [ -d "node_modules/.cache" ]; then
        echo -e "${GREEN}Node.js 缓存:${NC}"
        echo "  - 目录大小: $(get_size node_modules/.cache)"
        echo "  - 文件数量: $(find node_modules/.cache -type f 2>/dev/null | wc -l || echo 'N/A')"
    fi
    
    echo ""
    echo -e "${BLUE}💡 缓存优化建议:${NC}"
    echo "  - 定期清理缓存以释放磁盘空间"
    echo "  - 缓存可以显著提升 lint/format 速度"
    echo "  - 在 CI/CD 中可以缓存这些文件以加速构建"
}

# 主函数
main() {
    case "${1:-help}" in
        "status")
            show_status
            ;;
        "clean")
            clean_all
            ;;
        "eslint")
            clean_cache "eslint" "ESLint"
            ;;
        "prettier")
            clean_cache "prettier" "Prettier"
            ;;
        "node")
            clean_cache ".cache" "Node.js"
            ;;
        "stats")
            show_stats
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 运行主函数
main "$@"
