# 主题模式实现文档

## 概述

本项目支持三种主题模式：浅色、深色和跟随系统。本文档详细说明了主题模式的实现方式。

## 技术实现

### 1. 主题状态管理

使用 `localStorage`
持久化用户的主题偏好，确保用户在不同会话中保持一致的主题体验。

```ts
// 设置主题
localStorage.setItem('theme', 'dark')

// 获取主题
const theme = localStorage.getItem('theme')
```

### 2. 自动监听系统主题变化

通过 `window.matchMedia('(prefers-color-scheme: dark)')`
监听系统主题变化，并根据系统设置更新主题。

```ts
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  const newTheme = e.matches ? 'dark' : 'light'
  // 更新主题逻辑
})
```

### 3. HTML 根元素设置 `data-theme`

在 HTML 文档根元素上设置 `data-theme` 属性，用于 CSS 样式控制。

```ts
document.documentElement.setAttribute('data-theme', theme)
```

### 4. 使用 CSS 变量定义主题颜色

通过 CSS 变量定义主题颜色，方便维护和扩展。

```css
:root {
  --color-bg: #ffffff;
  --color-text: #000000;
}

[data-theme='dark'] {
  --color-bg: #121212;
  --color-text: #ffffff;
}
```

### 5. 平滑过渡动画

为提升用户体验，提供平滑的主题切换动画。

```css
html {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

## 总结

通过上述技术方案，我们实现了灵活且用户友好的主题切换功能，包括浅色、深色和跟随系统三种模式。
