<template>
  <section class="screenshots-section">
    <div class="screenshots-container">
      <div class="section-header">
        <h2 class="section-title">应用界面展示</h2>
        <p class="section-description">
          简洁优雅的界面设计，流畅的用户体验，让任务管理变得更加高效
        </p>
      </div>

      <div class="screenshots-grid">
        <div
          v-for="(screenshot, index) in screenshots"
          :key="screenshot.id"
          class="screenshot-card"
          :class="`screenshot-${index + 1}`"
          @click="openLightbox(screenshot)"
        >
          <div class="screenshot-image-container">
            <img
              :src="screenshot.image"
              :alt="screenshot.title"
              class="screenshot-image"
              loading="lazy"
            />
            <div class="screenshot-overlay">
              <div class="overlay-content">
                <i class="i-carbon-zoom-in" />
                <span>点击查看大图</span>
              </div>
            </div>
          </div>
          <div class="screenshot-info">
            <h3 class="screenshot-title">{{ screenshot.title }}</h3>
            <p class="screenshot-description">{{ screenshot.description }}</p>
            <div class="screenshot-tags">
              <span v-for="tag in screenshot.tags" :key="tag" class="screenshot-tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片灯箱 -->
    <div v-if="lightboxImage" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-container" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">
          <i class="i-carbon-close" />
        </button>
        <img :src="lightboxImage.image" :alt="lightboxImage.title" class="lightbox-image" />
        <div class="lightbox-info">
          <h3 class="lightbox-title">{{ lightboxImage.title }}</h3>
          <p class="lightbox-description">{{ lightboxImage.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Screenshot {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
}

const screenshots: Screenshot[] = [
  {
    id: 'homepage',
    title: '主界面',
    description: '简洁直观的任务管理界面，支持快速添加和管理待办事项',
    image: '/首页.png',
    tags: ['任务管理', '界面设计', '用户体验'],
  },
  {
    id: 'completed',
    title: '任务完成',
    description: '任务完成后的庆祝动画和统计展示，增强成就感',
    image: '/todo 完成.png',
    tags: ['任务完成', '动画效果', '数据统计'],
  },
  {
    id: 'productivity-insights',
    title: '生产力洞察',
    description: '深度数据分析和可视化图表，帮助您了解工作习惯和效率趋势',
    image: '/生产力洞察.png',
    tags: ['数据分析', '效率统计', '可视化图表'],
  },
  {
    id: 'ai-assistant',
    title: 'AI 助手',
    description: '智能 AI 助手提供任务分析、建议和自动化功能',
    image: '/AI 助手.png',
    tags: ['AI 分析', '智能助手', '自动化'],
  },
  {
    id: 'settings',
    title: '设置中心',
    description: '丰富的个性化设置选项，打造专属的工作环境',
    image: '/设置.png',
    tags: ['个性化', '主题设置', '配置管理'],
  },
  {
    id: 'i18n',
    title: '国际化支持',
    description: '完整的多语言支持，适应不同地区用户需求',
    image: '/国际化.png',
    tags: ['多语言', '国际化', '本地化'],
  },
]

const lightboxImage = ref<Screenshot | null>(null)

const openLightbox = (screenshot: Screenshot) => {
  lightboxImage.value = screenshot
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxImage.value = null
  document.body.style.overflow = 'auto'
}

// 键盘事件处理
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && lightboxImage.value) {
      closeLightbox()
    }
  }

  document.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'auto'
  })
})
</script>

<style scoped>
.screenshots-section {
  @apply py-20 relative;
  background: linear-gradient(
    135deg,
    rgba(121, 180, 166, 0.02) 0%,
    var(--bg-color) 50%,
    rgba(121, 180, 166, 0.02) 100%
  );
}

.screenshots-container {
  @apply container-responsive;
  max-width: 1400px;
}

.section-header {
  @apply text-center mb-16;
}

.section-title {
  @apply text-4xl lg:text-5xl font-bold text-text mb-6;
  background: linear-gradient(135deg, var(--text-color) 0%, #79b4a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  @apply text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed;
}

.screenshots-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8;
}

.screenshot-card {
  @apply rounded-3xl overflow-hidden transition-all-300 cursor-pointer;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.screenshot-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.screenshot-image-container {
  @apply relative overflow-hidden;
}

.screenshot-image {
  @apply w-full h-64 object-cover transition-transform-300;
}

.screenshot-card:hover .screenshot-image {
  transform: scale(1.05);
}

.screenshot-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 transition-opacity-300;
}

.screenshot-card:hover .screenshot-overlay {
  @apply opacity-100;
}

.overlay-content {
  @apply flex flex-col items-center gap-2 text-white;
}

.overlay-content i {
  @apply text-2xl;
}

.screenshot-info {
  @apply p-6;
}

.screenshot-title {
  @apply text-xl font-bold text-text mb-3;
}

.screenshot-description {
  @apply text-text-secondary mb-4 leading-relaxed;
}

.screenshot-tags {
  @apply flex flex-wrap gap-2;
}

.screenshot-tag {
  @apply px-3 py-1 rounded-full text-xs font-medium;
  background: rgba(121, 180, 166, 0.1);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

/* 灯箱样式 */
.lightbox-overlay {
  @apply fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(10px);
}

.lightbox-container {
  @apply relative max-w-4xl max-h-full bg-card rounded-3xl overflow-hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.lightbox-close {
  @apply absolute top-4 right-4 w-10 h-10 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center z-10 transition-all-300;
}

.lightbox-close:hover {
  @apply bg-opacity-70;
}

.lightbox-image {
  @apply w-full h-auto max-h-80vh object-contain;
}

.lightbox-info {
  @apply p-6;
  background: var(--card-bg-color);
}

.lightbox-title {
  @apply text-2xl font-bold mb-3;
  color: var(--text-color);
}

.lightbox-description {
  @apply leading-relaxed;
  color: var(--text-secondary-color);
}

/* 特殊卡片样式 */
.screenshot-1 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
}

.screenshot-2 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(104, 162, 149, 0.03) 100%);
}

.screenshot-3 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(89, 144, 132, 0.03) 100%);
}

.screenshot-4 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.04) 100%);
}

.screenshot-5 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(104, 162, 149, 0.04) 100%);
}

.screenshot-6 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(89, 144, 132, 0.04) 100%);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .screenshots-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .screenshots-section {
    @apply py-16;
  }

  .section-title {
    @apply text-3xl;
  }

  .section-description {
    @apply text-base;
  }

  .screenshots-grid {
    @apply grid-cols-1 gap-6;
  }

  .screenshot-info {
    @apply p-4;
  }

  .lightbox-container {
    @apply mx-4;
  }
}
</style>
