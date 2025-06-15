#!/bin/bash

# 移动端设置验证脚本
# 验证所有移动端开发环境是否正确配置

echo "🔍 移动端设置验证脚本"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# 验证计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0

# 检查函数
check() {
    local name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_info "检查: $name"
    
    if eval "$command" >/dev/null 2>&1; then
        print_success "$name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        print_error "$name"
        return 1
    fi
}

# 应用环境变量
apply_environment() {
    print_info "应用环境变量..."
    
    # 应用 Java 环境
    if [ -f "./fix-java-env-temp.sh" ]; then
        source ./fix-java-env-temp.sh >/dev/null 2>&1
        print_success "Java 环境变量已应用"
    fi
    
    # 应用 Android 环境
    if [ -f "./fix-android-env-temp.sh" ]; then
        source ./fix-android-env-temp.sh >/dev/null 2>&1
        print_success "Android 环境变量已应用"
    fi
}

# 主要验证
main_verification() {
    echo ""
    print_info "开始验证..."
    echo ""
    
    # 基础工具检查
    check "Node.js" "command -v node"
    check "pnpm" "command -v pnpm"
    check "npx" "command -v npx"
    
    # Java 环境检查
    check "Java" "command -v java"
    check "JAVA_HOME 设置" "[ -n \"\$JAVA_HOME\" ] && [ -d \"\$JAVA_HOME\" ]"
    
    # Android 环境检查
    check "Android SDK" "[ -d \"/Users/yunmu/Library/Android/sdk\" ]"
    check "ANDROID_SDK_ROOT 设置" "[ -n \"\$ANDROID_SDK_ROOT\" ] && [ -d \"\$ANDROID_SDK_ROOT\" ]"
    check "adb 工具" "command -v adb"
    
    # Capacitor 检查
    check "Capacitor CLI" "npx cap --version"
    check "Android 平台" "[ -d \"./android\" ]"
    check "iOS 平台" "[ -d \"./ios\" ]"
    
    # 项目构建检查
    check "ESLint 检查" "pnpm lint:check"
    check "TypeScript 检查" "pnpm type-check"
    
    echo ""
}

# 显示详细信息
show_details() {
    print_info "环境详细信息:"
    echo ""
    
    if command -v node >/dev/null 2>&1; then
        echo "Node.js: $(node --version)"
    fi
    
    if command -v pnpm >/dev/null 2>&1; then
        echo "pnpm: $(pnpm --version)"
    fi
    
    if command -v java >/dev/null 2>&1; then
        echo "Java: $(java -version 2>&1 | head -1)"
    fi
    
    if [ -n "$JAVA_HOME" ]; then
        echo "JAVA_HOME: $JAVA_HOME"
    fi
    
    if [ -n "$ANDROID_SDK_ROOT" ]; then
        echo "ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
    fi
    
    if command -v adb >/dev/null 2>&1; then
        echo "adb: $(adb version 2>&1 | head -1)"
    fi
    
    echo ""
}

# 运行 Capacitor 诊断
run_capacitor_doctor() {
    print_info "运行 Capacitor 诊断..."
    echo ""
    npx cap doctor
    echo ""
}

# 显示下一步操作
show_next_steps() {
    echo ""
    print_info "下一步操作:"
    echo ""
    
    if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
        print_success "所有检查都通过！您可以开始移动端开发了。"
        echo ""
        echo "🚀 可用命令:"
        echo "  pnpm mobile:build           # 构建并同步到移动端"
        echo "  pnpm mobile:sync:android     # 同步到 Android"
        echo "  pnpm mobile:android          # 打开 Android Studio"
        echo "  pnpm mobile:run:android      # 运行 Android 应用"
        echo ""
        echo "📱 开发流程:"
        echo "  1. 修改代码"
        echo "  2. pnpm mobile:sync:android"
        echo "  3. pnpm mobile:run:android"
        echo ""
    else
        print_warning "有 $((TOTAL_CHECKS - PASSED_CHECKS)) 项检查未通过。"
        echo ""
        echo "🔧 修复建议:"
        
        if ! command -v java >/dev/null 2>&1; then
            echo "  - 运行: ./scripts/fix-java-android-studio.sh"
        fi
        
        if ! command -v adb >/dev/null 2>&1; then
            echo "  - 运行: ./scripts/fix-android-sdk.sh"
        fi
        
        echo "  - 应用环境变量: source ./fix-java-env-temp.sh && source ./fix-android-env-temp.sh"
        echo ""
    fi
}

# 主函数
main() {
    # 应用环境变量
    apply_environment
    
    # 主要验证
    main_verification
    
    # 显示结果
    echo ""
    print_info "验证结果: $PASSED_CHECKS/$TOTAL_CHECKS 项检查通过"
    
    # 显示详细信息
    show_details
    
    # 运行 Capacitor 诊断
    run_capacitor_doctor
    
    # 显示下一步操作
    show_next_steps
}

# 运行主函数
main "$@"
