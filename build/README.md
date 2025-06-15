# 构建资源目录

此目录包含 Electron 应用程序构建所需的资源文件。

## 需要的图标文件

请将以下图标文件放置在此目录中：

### macOS
- `icon.icns` - macOS 应用程序图标（推荐尺寸：1024x1024）

### Windows
- `icon.ico` - Windows 应用程序图标（包含多种尺寸：16x16, 32x32, 48x48, 256x256）

### Linux
- `icon.png` - Linux 应用程序图标（推荐尺寸：512x512）

### DMG 背景（可选）
- `dmg-background.png` - macOS DMG 安装包背景图片（推荐尺寸：540x380）

## 图标生成工具

可以使用以下工具生成不同格式的图标：

1. **在线工具**：
   - https://iconverticons.com/online/
   - https://convertio.co/

2. **命令行工具**：
   ```bash
   # 安装 electron-icon-builder
   npm install -g electron-icon-builder
   
   # 从 PNG 生成所有格式图标
   electron-icon-builder --input=./logo.png --output=./build --flatten
   ```

3. **使用现有的 logo.png**：
   ```bash
   # 复制现有 logo 作为临时图标
   cp public/logo.png build/icon.png
   ```

## 当前状态

- ✅ entitlements.mac.plist - macOS 权限配置文件
- ❌ icon.icns - 需要创建
- ❌ icon.ico - 需要创建  
- ❌ icon.png - 需要创建
- ❌ dmg-background.png - 可选
