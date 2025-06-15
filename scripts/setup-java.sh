#!/bin/bash

# Java 环境设置脚本
# 用于安装和配置 Java 开发环境

echo "☕ Java 环境设置脚本"
echo "==================="

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

# 检查 Java 是否已安装
check_java() {
    print_info "检查 Java 安装状态..."
    
    if command -v java >/dev/null 2>&1; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        print_success "Java 已安装: $JAVA_VERSION"
        
        # 检查版本是否满足要求 (Java 11+)
        MAJOR_VERSION=$(echo "$JAVA_VERSION" | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 11 ] 2>/dev/null; then
            print_success "Java 版本满足要求 (>= 11)"
            return 0
        else
            print_warning "Java 版本过低 ($JAVA_VERSION)，Android 开发需要 Java 11+"
            return 1
        fi
    else
        print_error "Java 未安装"
        return 1
    fi
}

# 检查 JAVA_HOME 环境变量
check_java_home() {
    print_info "检查 JAVA_HOME 环境变量..."
    
    if [ -n "$JAVA_HOME" ]; then
        print_success "JAVA_HOME: $JAVA_HOME"
        
        if [ -d "$JAVA_HOME" ]; then
            print_success "JAVA_HOME 目录存在"
            return 0
        else
            print_warning "JAVA_HOME 目录不存在: $JAVA_HOME"
            return 1
        fi
    else
        print_warning "JAVA_HOME 未设置"
        return 1
    fi
}

# 查找 Java 安装路径
find_java_home() {
    print_info "查找 Java 安装路径..."
    
    # macOS 上查找 Java
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # 使用 /usr/libexec/java_home 查找
        if command -v /usr/libexec/java_home >/dev/null 2>&1; then
            FOUND_JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
            if [ -n "$FOUND_JAVA_HOME" ] && [ -d "$FOUND_JAVA_HOME" ]; then
                print_success "找到 Java 路径: $FOUND_JAVA_HOME"
                return 0
            fi
        fi
        
        # 查找常见路径
        for path in "/Library/Java/JavaVirtualMachines/"*/Contents/Home; do
            if [ -d "$path" ]; then
                FOUND_JAVA_HOME="$path"
                print_success "找到 Java 路径: $FOUND_JAVA_HOME"
                return 0
            fi
        done
    fi
    
    print_error "未找到 Java 安装路径"
    return 1
}

# 安装 Java (使用 Homebrew)
install_java_homebrew() {
    print_info "使用 Homebrew 安装 Java..."
    
    # 检查 Homebrew 是否安装
    if ! command -v brew >/dev/null 2>&1; then
        print_error "Homebrew 未安装"
        print_info "请先安装 Homebrew: https://brew.sh"
        return 1
    fi
    
    print_info "安装 OpenJDK 17..."
    brew install openjdk@17
    
    # 创建符号链接
    print_info "创建符号链接..."
    sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
    
    print_success "Java 17 安装完成"
    return 0
}

# 配置 JAVA_HOME 环境变量
setup_java_home() {
    local java_path="$1"
    
    print_info "配置 JAVA_HOME 环境变量..."
    
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
    if grep -q "JAVA_HOME" "$shell_config" 2>/dev/null; then
        print_warning "检测到已有 JAVA_HOME 配置，跳过添加"
    else
        # 添加环境变量
        cat >> "$shell_config" << EOF

# Java 环境变量 (自动添加)
export JAVA_HOME="$java_path"
export PATH="\$PATH:\$JAVA_HOME/bin"

EOF
        print_success "JAVA_HOME 已添加到 $shell_config"
    fi
    
    # 在当前会话中应用
    export JAVA_HOME="$java_path"
    export PATH="$PATH:$java_path/bin"
    
    print_success "JAVA_HOME 已在当前会话中生效"
}

# 显示安装选项
show_install_options() {
    echo ""
    print_info "Java 安装选项:"
    echo ""
    
    echo "🎯 选项 1: 使用 Homebrew (推荐)"
    echo "   brew install openjdk@17"
    echo ""
    
    echo "🎯 选项 2: 下载 Oracle JDK"
    echo "   访问: https://www.oracle.com/java/technologies/downloads/"
    echo ""
    
    echo "🎯 选项 3: 下载 OpenJDK"
    echo "   访问: https://adoptium.net/"
    echo ""
    
    echo "🎯 选项 4: 使用 Android Studio 内置 JDK"
    echo "   Android Studio 通常包含 JDK，可以配置使用"
    echo ""
}

# 验证安装
verify_installation() {
    print_info "验证 Java 安装..."
    
    if command -v java >/dev/null 2>&1; then
        print_success "java 命令可用"
        java -version
    else
        print_error "java 命令不可用"
        return 1
    fi
    
    if command -v javac >/dev/null 2>&1; then
        print_success "javac 命令可用"
    else
        print_warning "javac 命令不可用 (可能只安装了 JRE)"
    fi
    
    if [ -n "$JAVA_HOME" ] && [ -d "$JAVA_HOME" ]; then
        print_success "JAVA_HOME 设置正确: $JAVA_HOME"
    else
        print_error "JAVA_HOME 设置有问题"
        return 1
    fi
    
    return 0
}

# 主函数
main() {
    echo ""
    
    # 检查当前状态
    JAVA_INSTALLED=1
    JAVA_HOME_SET=1
    
    if check_java; then
        JAVA_INSTALLED=0
    fi
    
    if check_java_home; then
        JAVA_HOME_SET=0
    fi
    
    echo ""
    print_info "诊断结果:"
    echo "  Java 安装: $([ $JAVA_INSTALLED -eq 0 ] && echo '✅ 已安装' || echo '❌ 未安装')"
    echo "  JAVA_HOME: $([ $JAVA_HOME_SET -eq 0 ] && echo '✅ 已设置' || echo '❌ 未设置')"
    echo ""
    
    # 如果 Java 未安装，提供安装选项
    if [ $JAVA_INSTALLED -ne 0 ]; then
        show_install_options
        
        echo "是否使用 Homebrew 安装 Java 17? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if install_java_homebrew; then
                JAVA_INSTALLED=0
            fi
        fi
    fi
    
    # 如果 JAVA_HOME 未设置，尝试查找并设置
    if [ $JAVA_HOME_SET -ne 0 ] && [ $JAVA_INSTALLED -eq 0 ]; then
        if find_java_home; then
            setup_java_home "$FOUND_JAVA_HOME"
            JAVA_HOME_SET=0
        fi
    fi
    
    echo ""
    if [ $JAVA_INSTALLED -eq 0 ] && [ $JAVA_HOME_SET -eq 0 ]; then
        print_success "Java 环境配置完成！"
        verify_installation
        
        echo ""
        print_info "现在可以运行:"
        echo "  source ~/.zshrc  # 重新加载环境变量"
        echo "  pnpm mobile:run:android  # 运行 Android 应用"
    else
        print_error "Java 环境配置未完成"
        echo ""
        print_info "请手动安装 Java 后重新运行此脚本"
    fi
}

# 运行主函数
main "$@"
