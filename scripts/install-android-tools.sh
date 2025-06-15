#!/bin/bash

# Android SDK 工具安装脚本
# 安装缺失的 Android SDK 组件

echo "🔧 Android SDK 工具安装脚本"
echo "============================"

# 设置环境变量
export ANDROID_SDK_ROOT="/Users/yunmu/Library/Android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"

# 检查 SDK 目录
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "❌ Android SDK 目录不存在: $ANDROID_SDK_ROOT"
    exit 1
fi

echo "✅ 找到 Android SDK: $ANDROID_SDK_ROOT"

# 检查 cmdline-tools
CMDLINE_TOOLS_DIR="$ANDROID_SDK_ROOT/cmdline-tools"
if [ ! -d "$CMDLINE_TOOLS_DIR" ]; then
    echo "⚠️  cmdline-tools 不存在，需要手动安装"
    echo ""
    echo "请按照以下步骤操作:"
    echo ""
    echo "1. 打开 Android Studio"
    echo "2. 进入 Preferences/Settings"
    echo "3. 选择 Appearance & Behavior > System Settings > Android SDK"
    echo "4. 在 SDK Tools 标签页中，确保勾选:"
    echo "   - Android SDK Build-Tools"
    echo "   - Android SDK Platform-Tools"
    echo "   - Android SDK Command-line Tools"
    echo "5. 点击 Apply 安装"
    echo ""
    echo "或者使用 Android Studio 的 SDK Manager:"
    echo "1. 打开 Android Studio"
    echo "2. 点击 Tools > SDK Manager"
    echo "3. 在 SDK Tools 标签页安装必要组件"
    echo ""
    
    # 尝试通过 Android Studio 打开 SDK Manager
    if [ -d "/Applications/Android Studio.app" ]; then
        echo "🚀 正在打开 Android Studio..."
        open "/Applications/Android Studio.app"
        echo ""
        echo "请在 Android Studio 中:"
        echo "1. 点击 Configure > SDK Manager"
        echo "2. 或者 Tools > SDK Manager"
        echo "3. 安装 SDK Platform-Tools 和 SDK Build-Tools"
    fi
    
    exit 1
fi

# 查找 sdkmanager
SDKMANAGER=""
if [ -f "$CMDLINE_TOOLS_DIR/latest/bin/sdkmanager" ]; then
    SDKMANAGER="$CMDLINE_TOOLS_DIR/latest/bin/sdkmanager"
elif [ -f "$CMDLINE_TOOLS_DIR/bin/sdkmanager" ]; then
    SDKMANAGER="$CMDLINE_TOOLS_DIR/bin/sdkmanager"
else
    # 查找其他可能的位置
    for dir in "$CMDLINE_TOOLS_DIR"/*; do
        if [ -f "$dir/bin/sdkmanager" ]; then
            SDKMANAGER="$dir/bin/sdkmanager"
            break
        fi
    done
fi

if [ -z "$SDKMANAGER" ]; then
    echo "❌ 找不到 sdkmanager 工具"
    echo "请通过 Android Studio 安装 SDK Command-line Tools"
    exit 1
fi

echo "✅ 找到 sdkmanager: $SDKMANAGER"

# 安装必要的组件
echo ""
echo "🔧 安装 Android SDK 组件..."

# 接受许可协议
echo "📋 接受许可协议..."
yes | "$SDKMANAGER" --licenses

# 安装 platform-tools
echo "📦 安装 platform-tools..."
"$SDKMANAGER" "platform-tools"

# 安装 build-tools
echo "📦 安装 build-tools..."
"$SDKMANAGER" "build-tools;34.0.0"

# 安装 Android 平台
echo "📦 安装 Android 平台..."
"$SDKMANAGER" "platforms;android-34"

# 验证安装
echo ""
echo "🔍 验证安装..."

if [ -f "$ANDROID_SDK_ROOT/platform-tools/adb" ]; then
    echo "✅ platform-tools 安装成功"
    export PATH="$PATH:$ANDROID_SDK_ROOT/platform-tools"
    "$ANDROID_SDK_ROOT/platform-tools/adb" version
else
    echo "❌ platform-tools 安装失败"
fi

if [ -d "$ANDROID_SDK_ROOT/build-tools" ]; then
    echo "✅ build-tools 安装成功"
else
    echo "❌ build-tools 安装失败"
fi

if [ -d "$ANDROID_SDK_ROOT/platforms" ]; then
    echo "✅ platforms 安装成功"
else
    echo "❌ platforms 安装失败"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "现在可以运行:"
echo "  source ./fix-android-env-temp.sh"
echo "  pnpm mobile:run:android"
