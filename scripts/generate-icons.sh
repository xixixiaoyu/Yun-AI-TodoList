#!/bin/bash

# 图标生成脚本
# 从 build/icon.png 生成所有平台需要的图标格式

set -e

echo "🎨 开始生成应用图标..."

# 检查源图标文件
if [ ! -f "build/icon.png" ]; then
    echo "❌ 源图标文件 build/icon.png 不存在"
    exit 1
fi

# 检查图标尺寸
ICON_SIZE=$(sips -g pixelWidth build/icon.png | tail -1 | awk '{print $2}')
if [ "$ICON_SIZE" -lt 512 ]; then
    echo "⚠️  图标尺寸 ${ICON_SIZE}x${ICON_SIZE} 小于推荐的 512x512，正在调整..."
    sips -z 512 512 build/icon.png
    echo "✅ 图标已调整为 512x512"
fi

# 创建临时目录
TEMP_DIR="build/temp_icons"
mkdir -p "$TEMP_DIR"

echo "📱 生成 macOS 图标 (.icns)..."

# 生成 macOS 需要的各种尺寸
sips -z 16 16 build/icon.png --out "$TEMP_DIR/icon_16x16.png" > /dev/null
sips -z 32 32 build/icon.png --out "$TEMP_DIR/icon_16x16@2x.png" > /dev/null
sips -z 32 32 build/icon.png --out "$TEMP_DIR/icon_32x32.png" > /dev/null
sips -z 64 64 build/icon.png --out "$TEMP_DIR/icon_32x32@2x.png" > /dev/null
sips -z 128 128 build/icon.png --out "$TEMP_DIR/icon_128x128.png" > /dev/null
sips -z 256 256 build/icon.png --out "$TEMP_DIR/icon_128x128@2x.png" > /dev/null
sips -z 256 256 build/icon.png --out "$TEMP_DIR/icon_256x256.png" > /dev/null
sips -z 512 512 build/icon.png --out "$TEMP_DIR/icon_256x256@2x.png" > /dev/null
sips -z 512 512 build/icon.png --out "$TEMP_DIR/icon_512x512.png" > /dev/null
cp build/icon.png "$TEMP_DIR/icon_512x512@2x.png"

# 创建 iconset
ICONSET_DIR="$TEMP_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

mv "$TEMP_DIR"/*.png "$ICONSET_DIR/"

# 生成 .icns 文件
iconutil -c icns "$ICONSET_DIR" -o build/icon.icns

echo "🖥️  生成 Windows 图标 (.ico)..."

# 检查是否有 ImageMagick
if command -v magick >/dev/null 2>&1; then
    # 使用 ImageMagick 生成 .ico 文件
    magick build/icon.png \
        \( -clone 0 -resize 16x16 \) \
        \( -clone 0 -resize 32x32 \) \
        \( -clone 0 -resize 48x48 \) \
        \( -clone 0 -resize 64x64 \) \
        \( -clone 0 -resize 128x128 \) \
        \( -clone 0 -resize 256x256 \) \
        -delete 0 build/icon.ico
elif command -v convert >/dev/null 2>&1; then
    # 使用旧版 ImageMagick
    convert build/icon.png \
        \( -clone 0 -resize 16x16 \) \
        \( -clone 0 -resize 32x32 \) \
        \( -clone 0 -resize 48x48 \) \
        \( -clone 0 -resize 64x64 \) \
        \( -clone 0 -resize 128x128 \) \
        \( -clone 0 -resize 256x256 \) \
        -delete 0 build/icon.ico
else
    echo "⚠️  ImageMagick 未安装，跳过 Windows 图标生成"
    echo "   可以使用在线工具将 build/icon.png 转换为 .ico 格式"
fi

# 清理临时文件
rm -rf "$TEMP_DIR"

echo ""
echo "✅ 图标生成完成！"
echo ""
echo "📁 生成的文件："
[ -f "build/icon.png" ] && echo "  ✅ build/icon.png (Linux)"
[ -f "build/icon.icns" ] && echo "  ✅ build/icon.icns (macOS)"
[ -f "build/icon.ico" ] && echo "  ✅ build/icon.ico (Windows)"

echo ""
echo "💡 提示："
echo "  - 如果需要更好的图标质量，建议使用专业设计工具"
echo "  - 可以将高质量的 1024x1024 PNG 图标放在 build/icon.png"
echo "  - 然后重新运行此脚本生成所有格式"
