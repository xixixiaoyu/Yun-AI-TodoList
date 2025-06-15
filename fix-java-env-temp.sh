#!/bin/bash
# 临时 Java 环境修复脚本 (Android Studio JDK)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$PATH:/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin"

echo "✅ Java 环境变量已设置 (Android Studio JDK)"
echo "JAVA_HOME: /Applications/Android Studio.app/Contents/jbr/Contents/Home"
echo ""
echo "现在可以运行:"
echo "  pnpm mobile:run:android"
echo "  npx cap run android"
echo ""
