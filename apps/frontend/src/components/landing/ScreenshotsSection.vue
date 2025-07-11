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
          :class="`screenshot-card-${index + 1}`"
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
                <i class="i-carbon-zoom-in overlay-icon" />
                <span class="overlay-text">点击查看大图</span>
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

    <!-- 简化的图片灯箱 -->
    <div v-if="lightboxImage" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-container" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">
          <i class="i-carbon-close" />
        </button>
        <div class="lightbox-image-wrapper">
          <img :src="lightboxImage.image" :alt="lightboxImage.title" class="lightbox-image" />
        </div>
        <div class="lightbox-info">
          <h3 class="lightbox-title">{{ lightboxImage.title }}</h3>
          <p class="lightbox-description">{{ lightboxImage.description }}</p>
          <div class="lightbox-tags">
            <span v-for="tag in lightboxImage.tags" :key="tag" class="lightbox-tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

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
    description: '简洁直观的任务管理界面，支持快速添加和管理待办事项，提供流畅的用户体验',
    image: '/officialWebsite/首页.png',
    tags: ['任务管理', '界面设计', '用户体验'],
  },
  {
    id: 'completed',
    title: '任务完成',
    description: '任务完成后的庆祝动画和统计展示，增强成就感，激励持续完成任务',
    image: '/officialWebsite/todo 完成.png',
    tags: ['任务完成', '动画效果', '数据统计'],
  },
  {
    id: 'productivity-insights',
    title: '生产力洞察',
    description: '深度数据分析和可视化图表，帮助您了解工作习惯和效率趋势，优化工作方式',
    image: '/officialWebsite/生产力洞察.png',
    tags: ['数据分析', '效率统计', '可视化图表'],
  },
  {
    id: 'ai-assistant',
    title: 'AI 助手',
    description: '智能 AI 助手提供任务分析、建议和自动化功能，让任务管理更加智能',
    image: '/officialWebsite/AI 助手.png',
    tags: ['AI 分析', '智能助手', '自动化'],
  },
  {
    id: 'settings',
    title: '设置中心',
    description: '丰富的个性化设置选项，打造专属工作环境，支持主题切换和多语言',
    image: '/officialWebsite/设置.png',
    tags: ['个性化', '主题切换', '配置管理'],
  },
  {
    id: 'calendar',
    title: '日历视图',
    description: '直观的日历界面，轻松管理时间和任务安排，提供月视图和日程规划',
    image: '/officialWebsite/日历.png',
    tags: ['日历管理', '时间规划', '任务安排'],
  },
]

// 灯箱状态
const lightboxImage = ref<Screenshot | null>(null)

// 打开灯箱
const openLightbox = (screenshot: Screenshot) => {
  lightboxImage.value = screenshot
  document.body.style.overflow = 'hidden'
  document.body.classList.add('lightbox-open')
}

// 关闭灯箱
const closeLightbox = () => {
  lightboxImage.value = null
  document.body.style.overflow = ''
  document.body.classList.remove('lightbox-open')
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && lightboxImage.value) {
    closeLightbox()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  document.body.classList.remove('lightbox-open')
})

defineOptions({
  name: 'ScreenshotsSection',
})
</script>

<style scoped>
.screenshots-section {
  @apply py-20 relative;
  background: linear-gradient(
    180deg,
    var(--bg-color) 0%,
    rgba(121, 180, 166, 0.03) 50%,
    var(--bg-color) 100%
  );
}

.screenshots-container {
  @apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-header {
  @apply text-center mb-16;
}

.section-title {
  @apply text-3xl lg:text-4xl font-bold mb-4;
  color: var(--text-color);
}

.section-description {
  @apply text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto;
  color: var(--text-secondary-color);
}

/* 截图网格布局 */
.screenshots-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
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
  transform: translateY(-4px);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 截图图片容器 */
.screenshot-image-container {
  @apply relative overflow-hidden;
  aspect-ratio: 16 / 10;
}

.screenshot-image {
  @apply w-full h-full object-cover transition-all-300;
}

/* 悬停覆盖层 */
.screenshot-overlay {
  @apply absolute inset-0 bg-black/60 opacity-0 transition-all-300 flex items-center justify-center;
  backdrop-filter: blur(4px);
}

.screenshot-card:hover .screenshot-overlay {
  opacity: 1;
}

.overlay-content {
  @apply flex flex-col items-center gap-2 text-white;
}

.overlay-icon {
  @apply w-8 h-8 text-white;
}

.overlay-text {
  @apply text-sm font-medium;
}

.screenshot-info {
  @apply p-6;
}

.screenshot-title {
  @apply text-xl font-semibold mb-3;
  color: var(--text-color);
}

.screenshot-description {
  @apply text-base leading-relaxed mb-4;
  color: var(--text-secondary-color);
}

/* 截图标签 */
.screenshot-tags {
  @apply flex flex-wrap gap-2;
}

.screenshot-tag {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium;
  background: rgba(121, 180, 166, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
}

/* 灯箱样式 */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(12px);
  animation: lightboxFadeIn 0.3s ease-out;
}

.lightbox-container {
  position: relative;
  background: var(--card-bg-color);
  border-radius: 1.5rem;
  max-width: 90vw;
  max-height: 90vh;
  width: fit-content;
  height: fit-content;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  animation: lightboxSlideIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  margin: auto;
}

.lightbox-close {
  @apply absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center z-10 transition-all-300;
  backdrop-filter: blur(10px);
}

.lightbox-close:hover {
  @apply bg-black/80 scale-110;
}

.lightbox-image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lightbox-image {
  max-width: calc(90vw - 2rem);
  max-height: calc(90vh - 8rem);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  display: block;
}

.lightbox-info {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.lightbox-title {
  @apply text-2xl font-bold mb-3;
  color: var(--text-color);
}

.lightbox-description {
  @apply leading-relaxed mb-4;
  color: var(--text-secondary-color);
}

.lightbox-tags {
  @apply flex flex-wrap gap-2;
}

.lightbox-tag {
  @apply px-3 py-1.5 rounded-full text-sm font-medium;
  background: rgba(121, 180, 166, 0.15);
  color: var(--primary-color);
  border: 1px solid rgba(121, 180, 166, 0.3);
}

/* 灯箱动画 */
@keyframes lightboxFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes lightboxSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .screenshots-grid {
    @apply grid-cols-1 md:grid-cols-2 gap-6;
  }
}

@media (max-width: 768px) {
  .screenshots-section {
    @apply py-16;
  }

  .section-header {
    @apply mb-12;
  }

  .section-title {
    @apply text-2xl;
  }

  .section-description {
    @apply text-base;
  }

  .screenshots-grid {
    @apply grid-cols-1 gap-4;
  }

  .screenshot-info {
    @apply p-4;
  }

  .screenshot-title {
    @apply text-lg;
  }

  .screenshot-description {
    @apply text-sm;
  }

  .lightbox-container {
    max-width: 100%;
    margin: 0 0.5rem;
  }

  .lightbox-info {
    padding: 1rem;
  }

  .lightbox-title {
    font-size: 1.25rem;
  }

  .lightbox-description {
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .overlay-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .overlay-text {
    font-size: 0.75rem;
  }

  .lightbox-close {
    width: 2.5rem;
    height: 2.5rem;
    top: 0.5rem;
    right: 0.5rem;
  }
}

/* 全局样式：防止灯箱打开时的滚动 */
:global(.lightbox-open) {
  overflow: hidden;
}
</style>
