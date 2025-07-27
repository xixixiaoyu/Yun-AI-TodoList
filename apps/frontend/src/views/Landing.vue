<template>
  <div class="landing-page">
    <!-- 主要内容区域 -->
    <main class="landing-main">
      <!-- Hero Section -->
      <HeroSection />

      <!-- Features Section -->
      <FeaturesSection />

      <!-- Screenshots Section -->
      <ScreenshotsSection />

      <!-- Tech Stack Section -->
      <TechStackSection />

      <!-- Download Section -->
      <DownloadSection />

      <!-- Footer Section -->
      <FooterSection />
    </main>
  </div>
</template>

<script setup lang="ts">
import DownloadSection from '@/components/landing/DownloadSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import FooterSection from '@/components/landing/FooterSection.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import ScreenshotsSection from '@/components/landing/ScreenshotsSection.vue'
import TechStackSection from '@/components/landing/TechStackSection.vue'
import { onMounted } from 'vue'

// 性能监控
const startTime = performance.now()

// SEO Meta Tags 和性能监控
onMounted(async () => {
  // 动态导入性能监控模块以避免依赖问题
  try {
    const { performanceMonitor } = await import('@/utils/performance')
    const loadTime = performance.now() - startTime
    performanceMonitor.recordMetric('landing-page-load', loadTime, 'render')
  } catch (error) {
    console.warn('Performance monitoring not available:', error)
  }

  document.title = 'Yun AI TodoList - 智能待办事项管理应用'

  // Meta Description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      '基于 Vue 3 + NestJS + AI 的现代化全栈待办事项应用，支持智能分析、多平台同步、数据可视化等功能。'
    )
  } else {
    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content =
      '基于 Vue 3 + NestJS + AI 的现代化全栈待办事项应用，支持智能分析、多平台同步、数据可视化等功能。'
    document.head.appendChild(meta)
  }

  // Keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]')
  if (metaKeywords) {
    metaKeywords.setAttribute(
      'content',
      'TodoList,待办事项,AI,Vue3,NestJS,TypeScript,任务管理,效率工具'
    )
  } else {
    const meta = document.createElement('meta')
    meta.name = 'keywords'
    meta.content = 'TodoList,待办事项,AI,Vue3,NestJS,TypeScript,任务管理,效率工具'
    document.head.appendChild(meta)
  }

  // Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (!ogTitle) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:title')
    meta.content = 'Yun AI TodoList - 智能待办事项管理应用'
    document.head.appendChild(meta)
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (!ogDescription) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:description')
    meta.content =
      '基于 Vue 3 + NestJS + AI 的现代化全栈待办事项应用，支持智能分析、多平台同步、数据可视化等功能。'
    document.head.appendChild(meta)
  }

  const ogType = document.querySelector('meta[property="og:type"]')
  if (!ogType) {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:type')
    meta.content = 'website'
    document.head.appendChild(meta)
  }
})
</script>

<style scoped>
.landing-page {
  @apply min-h-screen;
  background: linear-gradient(135deg, var(--bg-color) 0%, rgba(121, 180, 166, 0.05) 100%);
  /* 优化渲染性能 */
  contain: layout style paint;
  will-change: auto;
}

.landing-main {
  @apply relative;
  /* 创建新的层叠上下文以优化渲染 */
  isolation: isolate;
}

/* 全局滚动行为优化 */
:global(html) {
  scroll-behavior: smooth;
  /* 优化滚动性能 */
  scroll-padding-top: 2rem;
}

/* 减少重绘和回流 */
:global(*) {
  /* 优化盒模型计算 */
  box-sizing: border-box;
}

/* 响应式容器 */
@media (max-width: 768px) {
  .landing-page {
    @apply px-4;
  }

  /* Landing 页面导航栏优化 */
  :global(.nav-bar) {
    background-color: rgba(var(--card-bg-color), 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(121, 180, 166, 0.1);
  }
}

/* 极小屏幕优化 */
@media (max-width: 375px) {
  .landing-page {
    @apply px-3;
  }

  :global(.nav-bar) {
    padding: 0.4rem;
  }
}

/* 动画性能优化 */
@media (prefers-reduced-motion: reduce) {
  :global(*) {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  :global(html) {
    scroll-behavior: auto;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .landing-page {
    background: var(--bg-color);
  }
}

/* 打印样式优化 */
@media print {
  .landing-page {
    background: white;
    color: black;
  }
}
</style>
