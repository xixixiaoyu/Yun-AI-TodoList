<template>
  <section class="features-section">
    <div class="features-container">
      <div class="section-header">
        <h2 class="section-title">强大功能特性</h2>
        <p class="section-description">
          集成 AI 智能分析、多平台支持、数据可视化等现代化功能，提升您的工作效率
        </p>
      </div>

      <div class="features-grid">
        <div
          v-for="(feature, index) in features"
          :key="feature.id"
          class="feature-card"
          :class="`feature-card-${index + 1}`"
        >
          <div class="feature-icon">
            <i :class="feature.icon" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
          <ul class="feature-list">
            <li v-for="item in feature.items" :key="item" class="feature-item">
              <i class="i-carbon-checkmark feature-check-icon" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Feature {
  id: string
  title: string
  description: string
  icon: string
  items: string[]
}

const features: Feature[] = [
  {
    id: 'ai-analysis',
    title: 'AI 智能分析',
    description: '基于人工智能的任务分析，自动评估优先级和时间估算，让您的任务管理更加智能高效',
    icon: 'i-carbon-ai-status',
    items: ['自动重要性评级（星级系统）', '智能时间估算', '批量任务分析', '优先级智能排序'],
  },
  {
    id: 'multi-platform',
    title: '多平台支持',
    description: '一次开发，多端运行，数据实时同步，无论您在哪里都能无缝访问您的任务',
    icon: 'i-carbon-devices',
    items: ['Web 浏览器访问', 'Electron 桌面应用', 'PWA 移动端支持', '跨平台数据同步'],
  },
  {
    id: 'data-visualization',
    title: '数据可视化',
    description: '深度生产力洞察，通过直观图表了解工作习惯和效率趋势，优化您的工作方式',
    icon: 'i-carbon-chart-line',
    items: ['任务完成趋势分析', '生产力热力图', '时间分布统计', '效率洞察报告'],
  },
  {
    id: 'task-management',
    title: '高级任务管理',
    description: '完整的任务生命周期管理，支持复杂项目结构，让大型项目管理变得简单',
    icon: 'i-carbon-task',
    items: ['子任务嵌套支持', '拖拽排序功能', '分类标签系统', '任务状态跟踪'],
  },
  {
    id: 'productivity',
    title: '效率工具集成',
    description: '集成番茄钟、时间跟踪等效率工具，科学管理时间，提升专注力',
    icon: 'i-carbon-timer',
    items: ['番茄钟计时器', '专注时间统计', '休息提醒功能', '工作节奏分析'],
  },
  {
    id: 'customization',
    title: '个性化定制',
    description: '丰富的主题和配置选项，打造专属工作环境，让应用完全符合您的使用习惯',
    icon: 'i-carbon-settings',
    items: ['深色/浅色主题', '多语言支持', '界面布局自定义', '快捷键配置'],
  },
]

defineOptions({
  name: 'FeaturesSection',
})
</script>

<style scoped>
.features-section {
  @apply py-20 relative;
  background: linear-gradient(135deg, var(--bg-color) 0%, rgba(121, 180, 166, 0.02) 100%);
}

.features-container {
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

/* 功能特性网格布局 */
.features-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8;
}

.feature-card {
  @apply p-8 rounded-3xl transition-all-300 relative overflow-hidden;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.feature-card::before {
  content: '';
  @apply absolute inset-0 opacity-0 transition-opacity-300;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.05) 0%, rgba(121, 180, 166, 0.02) 100%);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: var(--primary-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.feature-title {
  @apply text-xl font-semibold mb-4;
  color: var(--text-color);
}

.feature-description {
  @apply text-base leading-relaxed mb-6;
  color: var(--text-secondary-color);
}

/* 功能列表样式 */
.feature-list {
  @apply space-y-4 mt-6;
}

.feature-item {
  @apply flex items-start gap-3 text-sm leading-relaxed;
  color: var(--text-secondary-color);
}

.feature-check-icon {
  @apply w-4 h-4 mt-1 flex-shrink-0 text-primary;
}

/* 特殊卡片样式变体 */
.feature-card-1 {
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.03) 0%, var(--card-bg-color) 100%);
}

.feature-card-2 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
}

.feature-card-3 {
  background: linear-gradient(
    135deg,
    rgba(121, 180, 166, 0.02) 0%,
    var(--card-bg-color) 50%,
    rgba(121, 180, 166, 0.02) 100%
  );
}

.feature-card-4 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
}

.feature-card-5 {
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.03) 0%, var(--card-bg-color) 100%);
}

.feature-card-6 {
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(121, 180, 166, 0.02) 50%,
    var(--card-bg-color) 100%
  );
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .features-grid {
    @apply grid-cols-1 md:grid-cols-2 gap-6;
  }
}

@media (max-width: 768px) {
  .features-section {
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

  .features-grid {
    @apply grid-cols-1 gap-6;
  }

  .feature-card {
    @apply p-6;
  }

  .feature-icon {
    @apply w-12 h-12 text-2xl mb-4;
  }

  .feature-title {
    @apply text-lg;
  }

  .feature-description {
    @apply text-sm;
  }

  .feature-item {
    @apply text-xs;
  }

  .feature-check-icon {
    @apply w-3.5 h-3.5;
  }
}

@media (max-width: 640px) {
  .features-grid {
    @apply gap-4;
  }

  .feature-list {
    @apply space-y-3 mt-4;
  }
}

/* 极小屏幕优化 (320px-375px) */
@media (max-width: 375px) {
  .features-section {
    @apply py-12;
  }

  .section-header {
    @apply mb-8;
  }

  .section-title {
    @apply text-xl;
  }

  .section-description {
    @apply text-sm;
  }

  .features-grid {
    @apply gap-3;
  }

  .feature-card {
    @apply p-4;
  }

  .feature-icon {
    @apply w-10 h-10 text-xl mb-3;
  }

  .feature-title {
    @apply text-base;
  }

  .feature-description {
    @apply text-xs;
  }

  .feature-item {
    @apply text-xs;
  }

  .feature-check-icon {
    @apply w-3 h-3;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .feature-card-1,
[data-theme='dark'] .feature-card-2,
[data-theme='dark'] .feature-card-3,
[data-theme='dark'] .feature-card-4,
[data-theme='dark'] .feature-card-5,
[data-theme='dark'] .feature-card-6 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(37, 43, 50, 0.02) 100%);
}

/* 动画优化 */
@media (prefers-reduced-motion: reduce) {
  .feature-card {
    transition: none;
  }

  .feature-card:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .feature-check-icon {
    color: var(--text-color);
  }

  .feature-item {
    color: var(--text-color);
  }
}
</style>
