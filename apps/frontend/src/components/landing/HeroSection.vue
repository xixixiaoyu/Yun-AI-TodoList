<template>
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="title-main">Yun AI TodoList</span>
            <span class="title-subtitle">智能待办事项管理</span>
          </h1>
          <p class="hero-description">
            基于 <strong>Vue 3 + NestJS + AI</strong> 的现代化全栈待办事项应用
            <br />
            支持智能分析、多平台同步、数据可视化等强大功能
          </p>
          <div class="hero-features">
            <div class="feature-tag">
              <i class="i-carbon-ai-status" />
              AI 智能分析
            </div>
            <div class="feature-tag">
              <i class="i-carbon-devices" />
              多平台支持
            </div>
            <div class="feature-tag">
              <i class="i-carbon-chart-line" />
              数据可视化
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn-primary" @click="scrollToDemo">
              <i class="i-carbon-play" />
              立即体验
            </button>
            <a
              href="https://github.com/yunmu-todolist/yun-ai-todolist"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary"
            >
              <i class="i-carbon-logo-github" />
              查看源码
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-image-container">
            <img
              src="/首页.png"
              alt="Yun AI TodoList 应用界面"
              class="hero-image"
              loading="eager"
            />
            <div class="image-glow"></div>
          </div>
        </div>
      </div>

      <!-- 滚动指示器 -->
      <div class="scroll-indicator" @click="scrollToFeatures">
        <div class="scroll-arrow">
          <i class="i-carbon-chevron-down" />
        </div>
        <span class="scroll-text">了解更多</span>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="hero-bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
const scrollToDemo = () => {
  const demoSection = document.querySelector('.screenshots-section')
  if (demoSection) {
    demoSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToFeatures = () => {
  const featuresSection = document.querySelector('.features-section')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.hero-section {
  @apply relative min-h-screen flex items-center justify-center overflow-hidden;
  background: linear-gradient(
    135deg,
    var(--bg-color) 0%,
    rgba(121, 180, 166, 0.08) 50%,
    var(--bg-color) 100%
  );
}

.hero-container {
  @apply container-responsive py-20 relative z-10;
  max-width: 1200px;
}

.hero-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}

.hero-text {
  @apply space-y-8;
}

.hero-title {
  @apply space-y-2;
}

.title-main {
  @apply block text-5xl lg:text-6xl font-bold text-text;
  background: linear-gradient(135deg, var(--text-color) 0%, #79b4a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-subtitle {
  @apply block text-2xl lg:text-3xl font-medium text-text-secondary;
}

.hero-description {
  @apply text-lg lg:text-xl text-text-secondary leading-relaxed;
}

.hero-features {
  @apply flex flex-wrap gap-3;
}

.feature-tag {
  @apply flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium;
  background: rgba(121, 180, 166, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
}

.hero-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.btn-primary {
  @apply flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-white transition-all-300;
  background: linear-gradient(135deg, #79b4a6 0%, #68a295 100%);
  box-shadow: 0 4px 16px rgba(121, 180, 166, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(121, 180, 166, 0.4);
}

.btn-secondary {
  @apply flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium transition-all-300;
  color: var(--text-color);
  background: rgba(121, 180, 166, 0.1);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
  text-decoration: none;
}

.btn-secondary:hover {
  background: rgba(121, 180, 166, 0.15);
  transform: translateY(-2px);
}

.hero-visual {
  @apply relative;
}

.hero-image-container {
  @apply relative;
}

.hero-image {
  @apply w-full h-auto rounded-3xl shadow-2xl;
  max-width: 600px;
}

.image-glow {
  @apply absolute inset-0 rounded-3xl;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.2) 0%, rgba(121, 180, 166, 0.1) 100%);
  filter: blur(20px);
  z-index: -1;
}

.scroll-indicator {
  @apply absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer transition-all-300;
}

.scroll-indicator:hover {
  transform: translateX(-50%) translateY(-4px);
}

.scroll-arrow {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
  background: rgba(121, 180, 166, 0.1);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
  animation: bounce 2s infinite;
}

.scroll-text {
  @apply text-sm text-text-secondary;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.hero-bg-decoration {
  @apply absolute inset-0 overflow-hidden pointer-events-none;
}

.bg-circle {
  @apply absolute rounded-full opacity-20;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.3) 0%, rgba(121, 180, 166, 0.1) 100%);
  filter: blur(40px);
}

.bg-circle-1 {
  @apply w-96 h-96 -top-48 -right-48;
  animation: float 6s ease-in-out infinite;
}

.bg-circle-2 {
  @apply w-64 h-64 top-1/2 -left-32;
  animation: float 8s ease-in-out infinite reverse;
}

.bg-circle-3 {
  @apply w-80 h-80 -bottom-40 right-1/4;
  animation: float 10s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    @apply grid-cols-1 text-center;
  }

  .title-main {
    @apply text-4xl;
  }

  .title-subtitle {
    @apply text-xl;
  }
}

@media (max-width: 640px) {
  .hero-container {
    @apply py-16;
  }

  .title-main {
    @apply text-3xl;
  }

  .hero-description {
    @apply text-base;
  }

  .hero-actions {
    @apply flex-col;
  }
}
</style>
