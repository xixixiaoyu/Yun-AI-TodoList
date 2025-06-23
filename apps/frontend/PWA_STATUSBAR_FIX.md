# PWA 状态栏颜色修复

## 问题描述

当通过 PWA 安装应用启动时，状态栏显示为蓝色 (`#3b82f6`)，与应用的绿色主题 (`#79b4a6`) 不协调，影响视觉美观。

## 解决方案

### 1. 更新 PWA Manifest 配置

**文件**: `apps/frontend/vite.config.ts`

```typescript
// 修改前
theme_color: '#3b82f6',
background_color: '#ffffff',

// 修改后
theme_color: '#79b4a6',
background_color: '#f8f7f6',
```

### 2. 添加动态主题色配置

**文件**: `apps/frontend/src/utils/pwa-config.ts`

新增 `configurePWAThemeColor()` 函数：

- 根据当前主题（浅色/深色）动态设置状态栏颜色
- 浅色主题：`#79b4a6`（应用主色调）
- 深色主题：`#1a1f25`（深色背景色）
- 支持 iOS Safari、Android 等不同平台的状态栏配置

### 3. 集成主题切换

**文件**: `apps/frontend/src/composables/useTheme.ts`

在 `updateTheme()` 函数中添加：

```typescript
// 更新 PWA 状态栏主题色
try {
  configurePWAThemeColor()
} catch (error) {
  console.warn('Failed to update PWA theme color:', error)
}
```

### 4. 添加 HTML Meta 标签

**文件**: `apps/frontend/index.html`

添加了完整的 PWA 状态栏配置：

```html
<!-- PWA 状态栏配置 -->
<meta name="theme-color" content="#79b4a6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Yun AI TodoList" />
<meta name="msapplication-navbutton-color" content="#79b4a6" />
<meta name="msapplication-TileColor" content="#79b4a6" />
```

### 5. 更新初始背景色

同时更新了页面初始加载时的背景色，使其与应用主题保持一致：

```css
body {
  background-color: #f8f7f6; /* 浅色主题背景 */
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1f25; /* 深色主题背景 */
  }
}
```

## 技术实现

### 跨平台兼容性

1. **iOS Safari**:

   - `apple-mobile-web-app-status-bar-style`: 控制状态栏样式
   - `apple-mobile-web-app-capable`: 启用全屏模式

2. **Android Chrome**:

   - `theme-color`: 控制状态栏和地址栏颜色
   - `msapplication-navbutton-color`: 兼容性支持

3. **Windows**:
   - `msapplication-TileColor`: 磁贴颜色

### 动态主题切换

- 监听主题变化事件
- 实时更新 `meta[name="theme-color"]` 标签
- 根据当前主题选择合适的状态栏样式

## 效果

### 修复前

- 状态栏颜色：蓝色 (`#3b82f6`)
- 与应用绿色主题不协调
- 视觉体验不统一

### 修复后

- 浅色主题：绿色状态栏 (`#79b4a6`)
- 深色主题：深色状态栏 (`#1a1f25`)
- 与应用主题完美协调
- 支持主题切换时的动态更新

## 验证方法

1. 重新构建应用：`pnpm build`
2. 启动开发服务器：`pnpm dev`
3. 在浏览器中访问应用
4. 安装 PWA 应用到设备
5. 启动 PWA 应用
6. 检查状态栏颜色是否为绿色调
7. 切换主题，验证状态栏颜色是否同步更新

## 修复状态

✅ **已修复** - 导入错误已解决，PWA 初始化正常 ✅
**构建成功** - 所有修改已通过构建测试 ✅
**开发服务器运行正常** - 可以进行实时测试

## 注意事项

- 不同设备和浏览器对状态栏颜色的支持可能有差异
- iOS 设备需要添加到主屏幕后才能看到完整效果
- Android 设备在 Chrome 浏览器中即可看到状态栏颜色变化
- 建议在真实设备上测试，模拟器可能无法完全展示效果
