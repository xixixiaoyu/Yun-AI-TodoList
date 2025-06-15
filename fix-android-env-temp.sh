#!/bin/bash
# 临时 Android 环境修复脚本
export ANDROID_SDK_ROOT="/Users/yunmu/Library/Android/sdk"
export ANDROID_HOME="/Users/yunmu/Library/Android/sdk"
export PATH="$PATH:/Users/yunmu/Library/Android/sdk/platform-tools:/Users/yunmu/Library/Android/sdk/tools:/Users/yunmu/Library/Android/sdk/tools/bin"

echo "✅ Android 环境变量已临时设置"
echo "SDK 路径: /Users/yunmu/Library/Android/sdk"
echo ""
echo "现在可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
echo ""
