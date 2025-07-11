<template>
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-text">
          <!-- 标题区域 -->
          <div class="hero-title-section">
            <h1 class="hero-title">
              <span class="title-main">Yun AI TodoList</span>
              <span class="title-subtitle">智能待办事项管理</span>
            </h1>
          </div>

          <!-- 描述区域 -->
          <div class="hero-description-section">
            <p class="hero-description">
              基于 <strong>Vue 3 + NestJS + AI</strong> 的现代化全栈待办事项应用
              <br />
              支持智能分析、多平台同步、数据可视化等强大功能
            </p>
          </div>

          <!-- 特性标签 -->
          <div class="hero-features">
            <div class="feature-tag">
              <i class="i-carbon-ai-status" />
              <span>AI 智能分析</span>
            </div>
            <div class="feature-tag">
              <i class="i-carbon-devices" />
              <span>多平台支持</span>
            </div>
            <div class="feature-tag">
              <i class="i-carbon-chart-line" />
              <span>数据可视化</span>
            </div>
          </div>

          <!-- 操作按钮 -->
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

        <!-- 视觉展示区域 -->
        <div class="hero-visual">
          <div class="hero-image-container">
            <img
              src="/officialWebsite/首页.png"
              alt="Yun AI TodoList 应用界面"
              class="hero-image"
              loading="eager"
            />
            <div class="image-glow" />
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
  </section>
</template>

<script setup lang="ts">
// 滚动到演示区域
const scrollToDemo = () => {
  const demoSection = document.querySelector('.screenshots-section')
  if (demoSection) {
    demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 滚动到功能区域
const scrollToFeatures = () => {
  const featuresSection = document.querySelector('.features-section')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

defineOptions({
  name: 'HeroSection',
})
</script>

<style scoped>
/* 英雄区域基础样式 */
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
  @apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10;
}

.hero-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh];
}

/* 文本区域 */
.hero-text {
  @apply space-y-8 lg:space-y-10;
}

.hero-title-section {
  @apply space-y-4;
}

.hero-title {
  @apply space-y-3;
}

.title-main {
  @apply block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight;
  background: linear-gradient(135deg, var(--text-color) 0%, #79b4a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-subtitle {
  @apply block text-xl sm:text-2xl lg:text-3xl font-medium;
  color: var(--text-secondary-color);
}

.hero-description-section {
  @apply max-w-2xl;
}

.hero-description {
  @apply text-lg lg:text-xl leading-relaxed;
  color: var(--text-secondary-color);
}

.hero-description strong {
  @apply font-semibold;
  color: var(--primary-color);
}

/* 特性标签 */
.hero-features {
  @apply flex flex-wrap gap-3;
}

.feature-tag {
  @apply inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all-300;
  background: rgba(121, 180, 166, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
}

.feature-tag:hover {
  background: rgba(121, 180, 166, 0.15);
  border-color: rgba(121, 180, 166, 0.3);
  transform: translateY(-1px);
}

.feature-tag i {
  @apply w-4 h-4 text-primary;
}

/* 操作按钮区域 */
.hero-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.btn-primary {
  @apply inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-white transition-all-300;
  background: linear-gradient(135deg, #79b4a6 0%, #68a295 100%);
  box-shadow: 0 4px 16px rgba(121, 180, 166, 0.3);
  border: none;
  cursor: pointer;
  text-decoration: none;
  min-height: 48px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(121, 180, 166, 0.4);
}

.btn-secondary {
  @apply inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium transition-all-300;
  color: var(--text-color);
  background: rgba(121, 180, 166, 0.1);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
  text-decoration: none;
  min-height: 48px;
}

.btn-secondary:hover {
  background: rgba(121, 180, 166, 0.15);
  transform: translateY(-2px);
  border-color: rgba(121, 180, 166, 0.3);
}

/* 视觉展示区域 */
.hero-visual {
  @apply relative flex justify-center lg:justify-end;
}

.hero-image-container {
  @apply relative max-w-lg lg:max-w-xl;
}

.hero-image {
  @apply w-full h-auto rounded-3xl shadow-2xl transition-transform-300;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 10px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.hero-image:hover {
  transform: scale(1.02);
}

.image-glow {
  @apply absolute inset-0 rounded-3xl opacity-60;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.3) 0%, rgba(121, 180, 166, 0.1) 100%);
  filter: blur(30px);
  z-index: -1;
  transform: scale(1.1);
}

/* 滚动指示器 */
.scroll-indicator {
  @apply absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer transition-all-300;
  z-index: 20;
}

.scroll-indicator:hover {
  transform: translateX(-50%) translateY(-4px);
}

.scroll-arrow {
  @apply w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all-300;
  background: rgba(121, 180, 166, 0.1);
  border: 1px solid rgba(121, 180, 166, 0.2);
  backdrop-filter: blur(10px);
  color: var(--primary-color);
  animation: bounce 2s infinite;
}

.scroll-indicator:hover .scroll-arrow {
  background: rgba(121, 180, 166, 0.15);
  border-color: rgba(121, 180, 166, 0.3);
  transform: scale(1.1);
}

.scroll-text {
  @apply text-sm font-medium;
  color: var(--text-secondary-color);
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    @apply grid-cols-1 text-center gap-10;
  }

  .title-main {
    @apply text-4xl lg:text-5xl;
  }

  .title-subtitle {
    @apply text-xl lg:text-2xl;
  }

  .hero-image {
    transform: none;
  }

  .hero-image:hover {
    transform: scale(1.02);
  }
}

@media (max-width: 768px) {
  .hero-content {
    @apply gap-8 min-h-[70vh];
  }

  .hero-text {
    @apply space-y-5;
  }

  .title-main {
    @apply text-3xl;
  }

  .title-subtitle {
    @apply text-lg;
  }

  .hero-description {
    @apply text-base;
  }

  .hero-actions {
    @apply flex-col gap-3;
  }

  .feature-tag {
    @apply text-xs px-3 py-2;
  }

  .scroll-indicator {
    @apply bottom-6;
  }

  .scroll-arrow {
    @apply w-10 h-10 text-base;
  }

  .scroll-text {
    @apply text-xs;
  }
}
</style>
