#!/bin/bash

# 使用 Android Studio 内置 JDK 修复 Java 问题

echo "☕ 使用 Android Studio 内置 JDK"
echo "=============================="

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

# 查找 Android Studio 内置 JDK
find_android_studio_jdk() {
    print_info "查找 Android Studio 内置 JDK..."
    
    # Android Studio 可能的 JDK 路径
    local jdk_paths=(
        "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        "/Applications/Android Studio.app/Contents/jre/Contents/Home"
        "/Applications/Android Studio.app/Contents/jre/jdk/Contents/Home"
        "/opt/android-studio/jre"
        "/opt/android-studio/jbr"
    )
    
    for path in "${jdk_paths[@]}"; do
        if [ -d "$path" ]; then
            print_success "找到 Android Studio JDK: $path"
            ANDROID_STUDIO_JDK="$path"
            return 0
        fi
    done
    
    print_error "未找到 Android Studio 内置 JDK"
    return 1
}

# 验证 JDK
verify_jdk() {
    local jdk_path="$1"
    
    print_info "验证 JDK: $jdk_path"
    
    if [ ! -f "$jdk_path/bin/java" ]; then
        print_error "java 可执行文件不存在"
        return 1
    fi
    
    if [ ! -f "$jdk_path/bin/javac" ]; then
        print_warning "javac 可执行文件不存在 (可能是 JRE)"
    fi
    
    # 测试 Java 版本
    local java_version=$("$jdk_path/bin/java" -version 2>&1 | head -n 1)
    print_success "Java 版本: $java_version"
    
    return 0
}

# 配置环境变量
setup_java_environment() {
    local jdk_path="$1"
    
    print_info "配置 Java 环境变量..."
    
    # 确定 shell 配置文件
    local shell_config=""
    if [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            shell_config="$HOME/.bash_profile"
        else
            shell_config="$HOME/.bashrc"
        fi
    else
        shell_config="$HOME/.profile"
    fi
    
    print_info "使用配置文件: $shell_config"
    
    # 备份现有配置
    if [ -f "$shell_config" ]; then
        cp "$shell_config" "${shell_config}.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "已备份配置文件"
    fi
    
    # 检查是否已经配置过
    if grep -q "JAVA_HOME.*Android Studio" "$shell_config" 2>/dev/null; then
        print_warning "检测到已有 Android Studio JDK 配置，跳过添加"
    else
        # 添加环境变量
        cat >> "$shell_config" << EOF

# Java 环境变量 (Android Studio JDK)
export JAVA_HOME="$jdk_path"
export PATH="\$PATH:\$JAVA_HOME/bin"

EOF
        print_success "JAVA_HOME 已添加到 $shell_config"
    fi
    
    # 在当前会话中应用
    export JAVA_HOME="$jdk_path"
    export PATH="$PATH:$jdk_path/bin"
    
    print_success "JAVA_HOME 已在当前会话中生效"
}

# 创建临时修复脚本
create_temp_fix() {
    local jdk_path="$1"
    
    cat > "fix-java-env-temp.sh" << EOF
#!/bin/bash
# 临时 Java 环境修复脚本 (Android Studio JDK)
export JAVA_HOME="$jdk_path"
export PATH="\$PATH:$jdk_path/bin"

echo "✅ Java 环境变量已设置 (Android Studio JDK)"
echo "JAVA_HOME: $jdk_path"
echo ""
echo "现在可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
echo ""
EOF
    
    chmod +x "fix-java-env-temp.sh"
    print_success "创建了临时修复脚本: fix-java-env-temp.sh"
}

# 测试 Java 环境
test_java_environment() {
    print_info "测试 Java 环境..."
    
    if command -v java >/dev/null 2>&1; then
        print_success "java 命令可用"
        java -version 2>&1 | head -3
    else
        print_error "java 命令不可用"
        return 1
    fi
    
    if [ -n "$JAVA_HOME" ] && [ -d "$JAVA_HOME" ]; then
        print_success "JAVA_HOME 设置正确: $JAVA_HOME"
    else
        print_error "JAVA_HOME 设置有问题"
        return 1
    fi
    
    return 0
}

# 显示替代方案
show_alternatives() {
    echo ""
    print_info "如果 Android Studio JDK 不可用，替代方案:"
    echo ""
    
    echo "🎯 方案 1: 安装 Homebrew 和 OpenJDK"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "   brew install openjdk@17"
    echo ""
    
    echo "🎯 方案 2: 下载 OpenJDK"
    echo "   访问: https://adoptium.net/"
    echo "   下载 JDK 17 for macOS"
    echo ""
    
    echo "🎯 方案 3: 使用 Oracle JDK"
    echo "   访问: https://www.oracle.com/java/technologies/downloads/"
    echo "   下载 JDK 17 for macOS"
    echo ""
}

# 主函数
main() {
    echo ""
    
    # 检查 Android Studio 是否安装
    if [ ! -d "/Applications/Android Studio.app" ]; then
        print_error "Android Studio 未安装"
        print_info "请先安装 Android Studio，然后重新运行此脚本"
        show_alternatives
        exit 1
    fi
    
    print_success "Android Studio 已安装"
    
    # 查找 Android Studio 内置 JDK
    if find_android_studio_jdk; then
        if verify_jdk "$ANDROID_STUDIO_JDK"; then
            setup_java_environment "$ANDROID_STUDIO_JDK"
            create_temp_fix "$ANDROID_STUDIO_JDK"
            
            echo ""
            print_success "Java 环境配置完成！"
            
            test_java_environment
            
            echo ""
            print_info "立即使用临时修复:"
            echo "  source ./fix-java-env-temp.sh"
            echo ""
            print_info "永久生效 (重启终端或运行):"
            echo "  source ~/.zshrc"
            echo ""
            print_info "然后可以运行:"
            echo "  pnpm mobile:run:android"
            
        else
            print_error "JDK 验证失败"
            show_alternatives
        fi
    else
        print_error "未找到 Android Studio 内置 JDK"
        show_alternatives
    fi
}

# 运行主函数
main "$@"
