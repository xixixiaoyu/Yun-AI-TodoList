<template>
  <section class="tech-stack-section">
    <div class="tech-stack-container">
      <div class="section-header">
        <h2 class="section-title">现代化技术栈</h2>
        <p class="section-description">采用业界领先的技术栈，确保应用的性能、安全性和可维护性</p>
      </div>

      <div class="tech-categories">
        <div v-for="category in techCategories" :key="category.id" class="tech-category">
          <div class="category-header">
            <div class="category-icon">
              <i :class="category.icon" />
            </div>
            <h3 class="category-title">{{ category.title }}</h3>
            <p class="category-description">{{ category.description }}</p>
          </div>

          <div class="tech-items">
            <div v-for="tech in category.technologies" :key="tech.name" class="tech-item">
              <div class="tech-logo">
                <i :class="tech.icon" />
              </div>
              <div class="tech-info">
                <h4 class="tech-name">{{ tech.name }}</h4>
                <span class="tech-version">{{ tech.version }}</span>
                <p class="tech-desc">{{ tech.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 架构图 -->
      <div class="architecture-section">
        <h3 class="architecture-title">系统架构</h3>
        <div class="architecture-diagram">
          <div class="arch-layer frontend-layer">
            <h4>前端层</h4>
            <div class="arch-items">
              <span>Vue 3</span>
              <span>TypeScript</span>
              <span>UnoCSS</span>
              <span>Vite</span>
            </div>
          </div>
          <div class="arch-arrow">
            <i class="i-carbon-arrow-down" />
          </div>
          <div class="arch-layer backend-layer">
            <h4>后端层</h4>
            <div class="arch-items">
              <span>NestJS</span>
              <span>PostgreSQL</span>
              <span>Redis</span>
              <span>JWT</span>
            </div>
          </div>
          <div class="arch-arrow">
            <i class="i-carbon-arrow-down" />
          </div>
          <div class="arch-layer deployment-layer">
            <h4>部署层</h4>
            <div class="arch-items">
              <span>Docker</span>
              <span>Cloudflare</span>
              <span>Electron</span>
              <span>PWA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Technology {
  name: string
  version: string
  description: string
  icon: string
}

interface TechCategory {
  id: string
  title: string
  description: string
  icon: string
  technologies: Technology[]
}

const techCategories: TechCategory[] = [
  {
    id: 'frontend',
    title: '前端技术',
    description: '现代化的前端开发框架和工具',
    icon: 'i-carbon-application-web',
    technologies: [
      {
        name: 'Vue 3',
        version: '3.5.16',
        description: '渐进式 JavaScript 框架',
        icon: 'i-carbon-logo-vue',
      },
      {
        name: 'TypeScript',
        version: '5.8.3',
        description: '类型安全的 JavaScript',
        icon: 'i-carbon-code',
      },
      {
        name: 'UnoCSS',
        version: 'Latest',
        description: '原子化 CSS 引擎',
        icon: 'i-carbon-color-palette',
      },
      {
        name: 'Vite',
        version: 'Latest',
        description: '下一代前端构建工具',
        icon: 'i-carbon-flash',
      },
    ],
  },
  {
    id: 'backend',
    title: '后端技术',
    description: '高性能的服务端技术栈',
    icon: 'i-carbon-api',
    technologies: [
      {
        name: 'NestJS',
        version: '10.x',
        description: '企业级 Node.js 框架',
        icon: 'i-carbon-network-3',
      },
      {
        name: 'PostgreSQL',
        version: '16.x',
        description: '高性能关系型数据库',
        icon: 'i-carbon-data-base',
      },
      {
        name: 'Redis',
        version: '7.x',
        description: '内存数据库和缓存',
        icon: 'i-carbon-data-base-alt',
      },
      {
        name: 'Prisma',
        version: 'Latest',
        description: '现代化数据库工具',
        icon: 'i-carbon-data-table',
      },
    ],
  },
  {
    id: 'deployment',
    title: '部署运维',
    description: '现代化的部署和运维解决方案',
    icon: 'i-carbon-cloud',
    technologies: [
      {
        name: 'Docker',
        version: 'Latest',
        description: '容器化部署',
        icon: 'i-carbon-container-registry',
      },
      {
        name: 'Cloudflare',
        version: 'Workers',
        description: '全球 CDN 和边缘计算',
        icon: 'i-carbon-cloud-foundry-1',
      },
      {
        name: 'Electron',
        version: 'Latest',
        description: '跨平台桌面应用',
        icon: 'i-carbon-application',
      },
      {
        name: 'PWA',
        version: 'Latest',
        description: '渐进式 Web 应用',
        icon: 'i-carbon-mobile',
      },
    ],
  },
]
</script>

<style scoped>
.tech-stack-section {
  @apply py-20 relative;
  background: linear-gradient(
    135deg,
    var(--bg-color) 0%,
    rgba(121, 180, 166, 0.03) 50%,
    var(--bg-color) 100%
  );
}

.tech-stack-container {
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

.tech-categories {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16;
}

.tech-category {
  @apply p-8 rounded-3xl transition-all-300;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tech-category:hover {
  transform: translateY(-4px);
}

.category-header {
  @apply text-center mb-8;
}

.category-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.category-title {
  @apply text-2xl font-bold text-text mb-3;
}

.category-description {
  @apply text-text-secondary;
}

.tech-items {
  @apply space-y-4;
}

.tech-item {
  @apply flex items-start gap-4 p-4 rounded-2xl transition-all-300;
  background: rgba(121, 180, 166, 0.03);
  border: 1px solid rgba(121, 180, 166, 0.1);
}

.tech-item:hover {
  background: rgba(121, 180, 166, 0.05);
  border-color: rgba(121, 180, 166, 0.2);
}

.tech-logo {
  @apply w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
}

.tech-info {
  @apply flex-1;
}

.tech-name {
  @apply font-bold text-text;
}

.tech-version {
  @apply text-sm text-primary font-medium;
}

.tech-desc {
  @apply text-sm text-text-secondary mt-1;
}

/* 架构图 */
.architecture-section {
  @apply mt-20;
}

.architecture-title {
  @apply text-3xl font-bold text-text text-center mb-12;
}

.architecture-diagram {
  @apply flex flex-col items-center gap-6;
}

.arch-layer {
  @apply p-8 rounded-3xl text-center min-w-80 transition-all-300;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.arch-layer:hover {
  transform: scale(1.02);
}

.arch-layer h4 {
  @apply text-xl font-bold text-text mb-4;
}

.arch-items {
  @apply flex flex-wrap justify-center gap-2;
}

.arch-items span {
  @apply px-3 py-1 rounded-full text-sm font-medium;
  background: rgba(121, 180, 166, 0.1);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.arch-arrow {
  @apply text-2xl text-primary;
}

.frontend-layer {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
}

.backend-layer {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(104, 162, 149, 0.03) 100%);
}

.deployment-layer {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(89, 144, 132, 0.03) 100%);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .tech-categories {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .architecture-diagram {
    @apply gap-4;
  }

  .arch-layer {
    @apply min-w-0 w-full;
  }
}

@media (max-width: 768px) {
  .tech-stack-section {
    @apply py-16;
  }

  .section-title {
    @apply text-3xl;
  }

  .section-description {
    @apply text-base;
  }

  .tech-categories {
    @apply grid-cols-1 gap-6;
  }

  .tech-category {
    @apply p-6;
  }

  .architecture-title {
    @apply text-2xl;
  }

  .arch-layer {
    @apply p-6;
  }
}
</style>
