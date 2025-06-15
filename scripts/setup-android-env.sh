#!/bin/bash

# Android 环境配置脚本
# 用于配置 Android SDK 环境变量

echo "🤖 Android 环境配置脚本"
echo "=========================="

# 检测操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "检测到操作系统: $MACHINE"

# 常见的 Android SDK 路径
COMMON_PATHS=(
    "$HOME/Library/Android/sdk"                    # macOS 默认路径
    "$HOME/Android/Sdk"                            # Linux 默认路径
    "/usr/local/android-sdk"                       # 系统安装路径
    "/opt/android-sdk"                             # 可选安装路径
    "$HOME/AppData/Local/Android/Sdk"              # Windows 路径
)

# 查找 Android SDK
find_android_sdk() {
    echo "🔍 查找 Android SDK..."
    
    for path in "${COMMON_PATHS[@]}"; do
        if [ -d "$path" ]; then
            echo "✅ 找到 Android SDK: $path"
            ANDROID_SDK_ROOT="$path"
            return 0
        fi
    done
    
    echo "❌ 未找到 Android SDK"
    return 1
}

# 验证 SDK 完整性
verify_sdk() {
    local sdk_path="$1"
    
    echo "🔍 验证 SDK 完整性..."
    
    # 检查必要的目录
    local required_dirs=(
        "platform-tools"
        "platforms"
        "build-tools"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$sdk_path/$dir" ]; then
            echo "⚠️  缺少目录: $dir"
            return 1
        fi
    done
    
    # 检查 adb 工具
    if [ ! -f "$sdk_path/platform-tools/adb" ]; then
        echo "⚠️  缺少 adb 工具"
        return 1
    fi
    
    echo "✅ SDK 验证通过"
    return 0
}

# 配置环境变量
setup_environment() {
    local sdk_path="$1"
    
    echo "🔧 配置环境变量..."
    
    # 确定 shell 配置文件
    local shell_config=""
    if [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_config="$HOME/.bashrc"
        # macOS 使用 .bash_profile
        if [ "$MACHINE" = "Mac" ]; then
            shell_config="$HOME/.bash_profile"
        fi
    else
        shell_config="$HOME/.profile"
    fi
    
    echo "使用配置文件: $shell_config"
    
    # 备份现有配置
    if [ -f "$shell_config" ]; then
        cp "$shell_config" "${shell_config}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ 已备份现有配置文件"
    fi
    
    # 添加环境变量
    cat >> "$shell_config" << EOF

# Android SDK 环境变量 (由 setup-android-env.sh 添加)
export ANDROID_SDK_ROOT="$sdk_path"
export ANDROID_HOME="$sdk_path"
export PATH="\$PATH:\$ANDROID_SDK_ROOT/platform-tools"
export PATH="\$PATH:\$ANDROID_SDK_ROOT/tools"
export PATH="\$PATH:\$ANDROID_SDK_ROOT/tools/bin"

EOF
    
    echo "✅ 环境变量已添加到 $shell_config"
    
    # 立即应用环境变量
    export ANDROID_SDK_ROOT="$sdk_path"
    export ANDROID_HOME="$sdk_path"
    export PATH="$PATH:$sdk_path/platform-tools"
    export PATH="$PATH:$sdk_path/tools"
    export PATH="$PATH:$sdk_path/tools/bin"
    
    echo "✅ 环境变量已在当前会话中生效"
}

# 显示安装指南
show_install_guide() {
    echo ""
    echo "📋 Android Studio 安装指南"
    echo "=========================="
    echo ""
    echo "1. 下载 Android Studio:"
    echo "   https://developer.android.com/studio"
    echo ""
    echo "2. 安装并启动 Android Studio"
    echo ""
    echo "3. 完成初始设置向导:"
    echo "   - 选择 'Standard' 安装类型"
    echo "   - 下载推荐的 SDK 组件"
    echo "   - 接受许可协议"
    echo ""
    echo "4. 安装完成后重新运行此脚本"
    echo ""
    echo "5. 或者手动设置环境变量:"
    echo "   export ANDROID_SDK_ROOT=\"\$HOME/Library/Android/sdk\""
    echo "   export ANDROID_HOME=\"\$ANDROID_SDK_ROOT\""
    echo "   export PATH=\"\$PATH:\$ANDROID_SDK_ROOT/platform-tools\""
    echo ""
}

# 显示验证命令
show_verification() {
    echo ""
    echo "🔍 验证安装"
    echo "==========="
    echo ""
    echo "运行以下命令验证安装:"
    echo "  adb version"
    echo "  android list targets"
    echo "  npx cap doctor"
    echo ""
    echo "重新启动终端或运行:"
    echo "  source ~/.zshrc    # 如果使用 zsh"
    echo "  source ~/.bashrc   # 如果使用 bash"
    echo ""
}

# 主函数
main() {
    if find_android_sdk; then
        if verify_sdk "$ANDROID_SDK_ROOT"; then
            setup_environment "$ANDROID_SDK_ROOT"
            echo ""
            echo "🎉 Android SDK 配置完成!"
            echo "SDK 路径: $ANDROID_SDK_ROOT"
            show_verification
        else
            echo ""
            echo "⚠️  SDK 不完整，请重新安装 Android Studio"
            show_install_guide
        fi
    else
        echo ""
        echo "❌ 未找到 Android SDK"
        show_install_guide
    fi
}

# 运行主函数
main
