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
              <i class="i-carbon-checkmark" />
              {{ item }}
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
    description: '基于人工智能的任务分析，自动评估优先级和时间估算',
    icon: 'i-carbon-ai-status',
    items: ['自动重要性评级（星级系统）', '智能时间估算', '批量任务分析', '优先级智能排序'],
  },
  {
    id: 'multi-platform',
    title: '多平台支持',
    description: '一次开发，多端运行，数据实时同步',
    icon: 'i-carbon-devices',
    items: ['Web 浏览器访问', 'Electron 桌面应用', 'PWA 移动端支持', '跨平台数据同步'],
  },
  {
    id: 'data-visualization',
    title: '数据可视化',
    description: '深度生产力洞察，通过直观图表了解工作习惯和效率趋势',
    icon: 'i-carbon-chart-line',
    items: ['任务完成趋势分析', '生产力热力图', '时间分布统计', '效率洞察报告'],
  },
  {
    id: 'task-management',
    title: '高级任务管理',
    description: '完整的任务生命周期管理，支持复杂项目结构',
    icon: 'i-carbon-task',
    items: ['子任务嵌套支持', '拖拽排序功能', '分类标签系统', '任务状态跟踪'],
  },
  {
    id: 'productivity',
    title: '效率工具集成',
    description: '集成番茄钟、时间跟踪等效率工具',
    icon: 'i-carbon-timer',
    items: ['番茄钟计时器', '专注时间统计', '休息提醒功能', '工作节奏分析'],
  },
  {
    id: 'customization',
    title: '个性化定制',
    description: '丰富的主题和配置选项，打造专属工作环境',
    icon: 'i-carbon-settings',
    items: ['深色/浅色主题', '多语言支持', '界面布局自定义', '快捷键配置'],
  },
]
</script>

<style scoped>
.features-section {
  @apply py-20 relative;
  background: linear-gradient(135deg, var(--bg-color) 0%, rgba(121, 180, 166, 0.02) 100%);
}

.features-container {
  @apply container-responsive;
  max-width: 1200px;
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
  @apply opacity-100;
}

.feature-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.feature-title {
  @apply text-xl font-bold text-text mb-4;
}

.feature-description {
  @apply text-text-secondary mb-6 leading-relaxed;
}

.feature-list {
  @apply space-y-3;
}

.feature-item {
  @apply flex items-start gap-3 text-sm text-text-secondary;
}

.feature-item i {
  @apply text-primary mt-0.5 flex-shrink-0;
}

/* 特殊卡片样式 */
.feature-card-1 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
}

.feature-card-2 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(104, 162, 149, 0.03) 100%);
}

.feature-card-3 {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(89, 144, 132, 0.03) 100%);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .features-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .features-section {
    @apply py-16;
  }

  .section-title {
    @apply text-3xl;
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
}
</style>
