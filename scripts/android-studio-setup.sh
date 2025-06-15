#!/bin/bash

# Android Studio 设置指南脚本

echo "🤖 Android Studio 设置指南"
echo "=========================="

# 检查 Android Studio 是否安装
if [ ! -d "/Applications/Android Studio.app" ]; then
    echo "❌ Android Studio 未安装"
    echo ""
    echo "请先安装 Android Studio:"
    echo "1. 访问: https://developer.android.com/studio"
    echo "2. 下载并安装 Android Studio"
    echo "3. 重新运行此脚本"
    exit 1
fi

echo "✅ Android Studio 已安装"

# 打开 Android Studio
echo ""
echo "🚀 正在打开 Android Studio..."
open "/Applications/Android Studio.app"

echo ""
echo "📋 请在 Android Studio 中完成以下设置:"
echo ""
echo "1️⃣  首次启动设置 (如果是首次安装):"
echo "   - 选择 'Do not import settings'"
echo "   - 选择 'Standard' 安装类型"
echo "   - 等待下载完成"
echo ""
echo "2️⃣  配置 SDK (重要!):"
echo "   - 点击 'Configure' 或 'More Actions'"
echo "   - 选择 'SDK Manager'"
echo "   - 在 'SDK Platforms' 标签页:"
echo "     ✓ 勾选 'Android 14.0 (API 34)' 或最新版本"
echo "   - 在 'SDK Tools' 标签页:"
echo "     ✓ 勾选 'Android SDK Build-Tools'"
echo "     ✓ 勾选 'Android SDK Platform-Tools'"
echo "     ✓ 勾选 'Android SDK Command-line Tools'"
echo "     ✓ 勾选 'Android Emulator'"
echo "   - 点击 'Apply' 并等待下载完成"
echo ""
echo "3️⃣  创建虚拟设备 (可选):"
echo "   - 点击 'Configure' > 'AVD Manager'"
echo "   - 点击 'Create Virtual Device'"
echo "   - 选择设备型号 (推荐 Pixel 系列)"
echo "   - 选择系统镜像 (推荐最新版本)"
echo "   - 完成创建"
echo ""
echo "4️⃣  验证安装:"
echo "   - 确保所有组件下载完成"
echo "   - 关闭 Android Studio"
echo "   - 运行: ./scripts/fix-android-sdk.sh"
echo ""

# 等待用户确认
echo "⏳ 请完成上述设置后按 Enter 键继续..."
read -r

# 重新检查 SDK
echo ""
echo "🔍 重新检查 Android SDK..."

SDK_PATH="/Users/yunmu/Library/Android/sdk"
if [ -d "$SDK_PATH/platform-tools" ]; then
    echo "✅ platform-tools 已安装"
    
    # 更新环境变量
    export ANDROID_SDK_ROOT="$SDK_PATH"
    export ANDROID_HOME="$SDK_PATH"
    export PATH="$PATH:$SDK_PATH/platform-tools:$SDK_PATH/tools:$SDK_PATH/tools/bin"
    
    # 测试 adb
    if [ -f "$SDK_PATH/platform-tools/adb" ]; then
        echo "✅ adb 工具可用"
        "$SDK_PATH/platform-tools/adb" version | head -1
        
        # 更新临时修复脚本
        cat > "fix-android-env-temp.sh" << EOF
#!/bin/bash
# 临时 Android 环境修复脚本 (已更新)
export ANDROID_SDK_ROOT="$SDK_PATH"
export ANDROID_HOME="$SDK_PATH"
export PATH="\$PATH:$SDK_PATH/platform-tools:$SDK_PATH/tools:$SDK_PATH/tools/bin"

echo "✅ Android 环境变量已设置"
echo "SDK 路径: $SDK_PATH"
echo ""
echo "现在可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
echo ""
EOF
        chmod +x "fix-android-env-temp.sh"
        
        echo ""
        echo "🎉 设置完成！"
        echo ""
        echo "现在可以运行:"
        echo "  source ./fix-android-env-temp.sh"
        echo "  pnpm mobile:run:android"
        
    else
        echo "❌ adb 工具不可用"
    fi
else
    echo "❌ platform-tools 未安装"
    echo "请确保在 Android Studio 的 SDK Manager 中安装了 'Android SDK Platform-Tools'"
fi

echo ""
echo "💡 提示:"
echo "- 如果仍有问题，请重启终端后重试"
echo "- 确保 Android Studio 中的 SDK 下载完成"
echo "- 可以运行 'npx cap doctor' 检查配置"
