#!/bin/bash

# Android SDK 问题修复脚本
# 自动检测和修复 Android SDK 配置问题

echo "🔧 Android SDK 问题修复脚本"
echo "============================"

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

# 检查是否安装了 Android Studio
check_android_studio() {
    print_info "检查 Android Studio 安装状态..."
    
    if [ -d "/Applications/Android Studio.app" ]; then
        print_success "Android Studio 已安装"
        return 0
    else
        print_warning "Android Studio 未安装"
        return 1
    fi
}

# 检查 SDK 路径
check_sdk_paths() {
    print_info "检查 Android SDK 路径..."
    
    local paths=(
        "$HOME/Library/Android/sdk"
        "$HOME/Android/Sdk"
        "/usr/local/android-sdk"
        "/opt/android-sdk"
    )
    
    for path in "${paths[@]}"; do
        if [ -d "$path" ]; then
            print_success "找到 SDK: $path"
            FOUND_SDK_PATH="$path"
            return 0
        fi
    done
    
    print_error "未找到 Android SDK"
    return 1
}

# 检查环境变量
check_environment() {
    print_info "检查环境变量..."
    
    if [ -n "$ANDROID_SDK_ROOT" ]; then
        print_success "ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
    else
        print_warning "ANDROID_SDK_ROOT 未设置"
    fi
    
    if [ -n "$ANDROID_HOME" ]; then
        print_success "ANDROID_HOME: $ANDROID_HOME"
    else
        print_warning "ANDROID_HOME 未设置"
    fi
    
    if command -v adb >/dev/null 2>&1; then
        print_success "adb 命令可用: $(which adb)"
    else
        print_warning "adb 命令不可用"
    fi
}

# 临时设置环境变量
set_temp_environment() {
    local sdk_path="$1"
    print_info "临时设置环境变量..."
    
    export ANDROID_SDK_ROOT="$sdk_path"
    export ANDROID_HOME="$sdk_path"
    export PATH="$PATH:$sdk_path/platform-tools:$sdk_path/tools:$sdk_path/tools/bin"
    
    print_success "临时环境变量已设置"
}

# 创建快速修复脚本
create_quick_fix() {
    local sdk_path="$1"
    
    cat > "fix-android-env-temp.sh" << EOF
#!/bin/bash
# 临时 Android 环境修复脚本
export ANDROID_SDK_ROOT="$sdk_path"
export ANDROID_HOME="$sdk_path"
export PATH="\$PATH:$sdk_path/platform-tools:$sdk_path/tools:$sdk_path/tools/bin"

echo "✅ Android 环境变量已临时设置"
echo "SDK 路径: $sdk_path"
echo ""
echo "现在可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
echo ""
EOF
    
    chmod +x "fix-android-env-temp.sh"
    print_success "创建了临时修复脚本: fix-android-env-temp.sh"
}

# 显示解决方案
show_solutions() {
    echo ""
    print_info "解决方案选项:"
    echo ""
    
    echo "🎯 方案 1: 安装 Android Studio (推荐)"
    echo "   1. 访问: https://developer.android.com/studio"
    echo "   2. 下载并安装 Android Studio"
    echo "   3. 启动并完成初始设置"
    echo "   4. 重新运行此脚本"
    echo ""
    
    echo "🎯 方案 2: 仅安装 Android SDK"
    echo "   1. 下载 Command Line Tools:"
    echo "      https://developer.android.com/studio#command-tools"
    echo "   2. 解压到 ~/Library/Android/sdk"
    echo "   3. 运行: ./scripts/setup-android-env.sh"
    echo ""
    
    echo "🎯 方案 3: 使用 Homebrew (macOS)"
    echo "   brew install --cask android-studio"
    echo "   或"
    echo "   brew install --cask android-commandlinetools"
    echo ""
    
    echo "🎯 方案 4: 临时解决方案"
    if [ -n "$FOUND_SDK_PATH" ]; then
        echo "   source ./fix-android-env-temp.sh"
        echo "   然后运行您的 Capacitor 命令"
    else
        echo "   需要先安装 Android SDK"
    fi
    echo ""
}

# 验证修复结果
verify_fix() {
    print_info "验证修复结果..."
    
    if command -v adb >/dev/null 2>&1; then
        print_success "adb 命令可用"
        adb version
    else
        print_error "adb 命令仍不可用"
    fi
    
    if [ -n "$ANDROID_SDK_ROOT" ] && [ -d "$ANDROID_SDK_ROOT" ]; then
        print_success "ANDROID_SDK_ROOT 设置正确: $ANDROID_SDK_ROOT"
    else
        print_error "ANDROID_SDK_ROOT 仍有问题"
    fi
}

# 运行 Capacitor 诊断
run_cap_doctor() {
    print_info "运行 Capacitor 诊断..."
    echo ""
    
    if command -v npx >/dev/null 2>&1; then
        npx cap doctor
    else
        print_error "npx 命令不可用"
    fi
}

# 主函数
main() {
    echo ""
    
    # 检查当前状态
    check_android_studio
    STUDIO_INSTALLED=$?
    
    check_sdk_paths
    SDK_FOUND=$?
    
    check_environment
    
    echo ""
    print_info "诊断结果:"
    echo "  Android Studio: $([ $STUDIO_INSTALLED -eq 0 ] && echo '已安装' || echo '未安装')"
    echo "  Android SDK: $([ $SDK_FOUND -eq 0 ] && echo '已找到' || echo '未找到')"
    echo ""
    
    # 如果找到 SDK，尝试临时修复
    if [ $SDK_FOUND -eq 0 ]; then
        set_temp_environment "$FOUND_SDK_PATH"
        create_quick_fix "$FOUND_SDK_PATH"
        
        echo ""
        print_success "临时修复完成！"
        print_info "运行以下命令应用临时修复:"
        echo "  source ./fix-android-env-temp.sh"
        echo ""
        
        verify_fix
        run_cap_doctor
    else
        show_solutions
    fi
    
    echo ""
    print_info "如需永久修复，请安装 Android Studio 后运行:"
    echo "  ./scripts/setup-android-env.sh"
}

# 运行主函数
main "$@"
