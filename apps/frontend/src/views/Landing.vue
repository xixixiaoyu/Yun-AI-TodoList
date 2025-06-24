<template>
  <div class="landing-page">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import ScreenshotsSection from '@/components/landing/ScreenshotsSection.vue'
import TechStackSection from '@/components/landing/TechStackSection.vue'
import DownloadSection from '@/components/landing/DownloadSection.vue'
import FooterSection from '@/components/landing/FooterSection.vue'

// SEO Meta Tags
onMounted(() => {
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
  @apply min-h-screen bg-bg;
  background: linear-gradient(135deg, var(--bg-color) 0%, rgba(121, 180, 166, 0.05) 100%);
}

/* 全局滚动行为 */
html {
  scroll-behavior: smooth;
}

/* 响应式容器 */
@media (max-width: 768px) {
  .landing-page {
    @apply px-4;
  }
}
</style>
