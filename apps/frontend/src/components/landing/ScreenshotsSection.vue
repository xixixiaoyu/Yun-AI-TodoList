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

    <!-- 重构优化的图片灯箱 -->
    <Teleport to="body">
      <div v-if="lightboxImage" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-container" @click.stop>
          <!-- 关闭按钮 -->
          <button class="lightbox-close" @click="closeLightbox" aria-label="关闭灯箱">
            <i class="i-carbon-close" />
          </button>

          <!-- 图片显示区域 -->
          <div class="lightbox-content">
            <div class="lightbox-image-container">
              <img
                :src="lightboxImage.image"
                :alt="lightboxImage.title"
                class="lightbox-image"
                @load="onImageLoad"
                @error="onImageError"
              />
            </div>
          </div>

          <!-- 图片信息 -->
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
    </Teleport>
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

// 图片加载完成处理
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('图片加载完成:', img.naturalWidth, 'x', img.naturalHeight)
}

// 图片加载错误处理
const onImageError = (event: Event) => {
  console.error('图片加载失败:', event)
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

/* 重构优化的灯箱样式 */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  backdrop-filter: blur(16px);
  animation: lightboxFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lightbox-container {
  position: relative;
  background: var(--card-bg-color);
  border-radius: 1.5rem;
  width: 100%;
  height: 100%;
  max-width: min(90vw, 1200px);
  max-height: min(90vh, 800px);
  overflow: hidden;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: lightboxSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.lightbox-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 0;
  overflow: hidden;
}

.lightbox-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.75rem;
  display: block;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.lightbox-info {
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.02) 100%);
}

.lightbox-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-color);
  line-height: 1.3;
}

.lightbox-description {
  line-height: 1.6;
  margin-bottom: 1rem;
  color: var(--text-secondary-color);
  font-size: 0.95rem;
}

.lightbox-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lightbox-tag {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(121, 180, 166, 0.12);
  color: var(--primary-color);
  border: 1px solid rgba(121, 180, 166, 0.25);
  transition: all 0.2s ease;
}

.lightbox-tag:hover {
  background: rgba(121, 180, 166, 0.18);
  border-color: rgba(121, 180, 166, 0.4);
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

  .lightbox-overlay {
    padding: 1rem;
  }

  .lightbox-container {
    max-width: 95vw;
    max-height: 95vh;
  }

  .lightbox-content {
    padding: 1rem;
  }

  .lightbox-info {
    padding: 1.5rem;
  }

  .lightbox-title {
    font-size: 1.25rem;
  }

  .lightbox-description {
    font-size: 0.875rem;
  }

  .lightbox-close {
    width: 2.5rem;
    height: 2.5rem;
    top: 0.75rem;
    right: 0.75rem;
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

  .lightbox-overlay {
    padding: 0.5rem;
  }

  .lightbox-container {
    max-width: 98vw;
    max-height: 98vh;
  }

  .lightbox-content {
    padding: 0.75rem;
  }

  .lightbox-info {
    padding: 1rem;
  }

  .lightbox-title {
    font-size: 1.125rem;
  }

  .lightbox-description {
    font-size: 0.8rem;
  }

  .lightbox-close {
    width: 2.25rem;
    height: 2.25rem;
    top: 0.5rem;
    right: 0.5rem;
  }

  .lightbox-tag {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}

/* 全局样式：防止灯箱打开时的滚动 */
:global(.lightbox-open) {
  overflow: hidden;
}
</style>
