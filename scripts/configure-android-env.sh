#!/bin/bash

# 永久配置 Android 环境变量脚本

echo "🔧 配置 Android 环境变量"
echo "======================="

# Android SDK 路径
ANDROID_SDK_PATH="/Users/yunmu/Library/Android/sdk"

# 检查 SDK 是否存在
if [ ! -d "$ANDROID_SDK_PATH" ]; then
    echo "❌ Android SDK 路径不存在: $ANDROID_SDK_PATH"
    exit 1
fi

echo "✅ 找到 Android SDK: $ANDROID_SDK_PATH"

# 确定 shell 配置文件
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    else
        SHELL_CONFIG="$HOME/.bashrc"
    fi
else
    SHELL_CONFIG="$HOME/.profile"
fi

echo "使用配置文件: $SHELL_CONFIG"

# 备份现有配置
if [ -f "$SHELL_CONFIG" ]; then
    cp "$SHELL_CONFIG" "${SHELL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 已备份配置文件"
fi

# 检查是否已经配置过
if grep -q "ANDROID_SDK_ROOT" "$SHELL_CONFIG" 2>/dev/null; then
    echo "⚠️  检测到已有 Android 配置，跳过添加"
else
    # 添加环境变量
    cat >> "$SHELL_CONFIG" << 'EOF'

# Android SDK 环境变量 (自动添加)
export ANDROID_SDK_ROOT="/Users/yunmu/Library/Android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/tools/bin"

EOF
    echo "✅ 环境变量已添加到 $SHELL_CONFIG"
fi

# 在当前会话中应用
export ANDROID_SDK_ROOT="$ANDROID_SDK_PATH"
export ANDROID_HOME="$ANDROID_SDK_PATH"
export PATH="$PATH:$ANDROID_SDK_PATH/platform-tools:$ANDROID_SDK_PATH/tools:$ANDROID_SDK_PATH/tools/bin"

echo "✅ 环境变量已在当前会话中生效"

# 验证配置
echo ""
echo "🔍 验证配置:"
echo "ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
echo "ANDROID_HOME: $ANDROID_HOME"

if command -v adb >/dev/null 2>&1; then
    echo "✅ adb 命令可用: $(which adb)"
    adb version | head -1
else
    echo "⚠️  adb 命令不可用，可能需要重启终端"
fi

echo ""
echo "🎉 配置完成！"
echo ""
echo "请执行以下操作之一:"
echo "1. 重启终端"
echo "2. 运行: source $SHELL_CONFIG"
echo "3. 运行: source ./fix-android-env-temp.sh (临时解决方案)"
echo ""
echo "然后可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
