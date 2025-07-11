<template>
  <section class="download-section">
    <div class="download-container">
      <div class="section-header">
        <h2 class="section-title">立即开始使用</h2>
        <p class="section-description">选择适合您的方式，开始高效的任务管理之旅</p>
        <div class="section-divider">
          <div class="divider-line"></div>
          <div class="divider-icon">
            <i class="i-carbon-chevron-down" />
          </div>
          <div class="divider-line"></div>
        </div>
      </div>

      <div class="download-options">
        <div class="options-background"></div>
        <div class="download-card primary-card">
          <div class="card-header">
            <div class="card-icon">
              <i class="i-carbon-launch" />
            </div>
            <h3 class="card-title">在线体验</h3>
            <p class="card-description">无需安装，立即在浏览器中体验完整功能</p>
          </div>
          <div class="card-features">
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>即开即用</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>全功能体验</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>数据本地存储</span>
            </div>
          </div>
          <button class="download-btn primary-btn" @click="openDemo">
            <i class="i-carbon-play" />
            立即体验
          </button>
        </div>

        <div class="download-card">
          <div class="card-header">
            <div class="card-icon">
              <i class="i-carbon-logo-github" />
            </div>
            <h3 class="card-title">开源代码</h3>
            <p class="card-description">查看源代码，参与开发，或自行部署</p>
          </div>
          <div class="card-features">
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>完全开源</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>详细文档</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>社区支持</span>
            </div>
          </div>
          <a
            href="https://github.com/yunmu-todolist/yun-ai-todolist"
            target="_blank"
            rel="noopener noreferrer"
            class="download-btn secondary-btn"
          >
            <i class="i-carbon-logo-github" />
            查看源码
          </a>
        </div>

        <div class="download-card">
          <div class="card-header">
            <div class="card-icon">
              <i class="i-carbon-application" />
            </div>
            <h3 class="card-title">桌面应用</h3>
            <p class="card-description">下载 Electron 桌面版，获得原生应用体验</p>
          </div>
          <div class="card-features">
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>跨平台支持</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>离线使用</span>
            </div>
            <div class="feature-item">
              <i class="i-carbon-checkmark" />
              <span>系统集成</span>
            </div>
          </div>
          <button class="download-btn secondary-btn" @click="showDownloadModal">
            <i class="i-carbon-download" />
            下载应用
          </button>
        </div>
      </div>

      <!-- 部署指南 -->
      <div class="deployment-guide">
        <h3 class="guide-title">部署指南</h3>
        <div class="guide-grid">
          <div class="guide-item">
            <div class="guide-icon">
              <i class="i-carbon-container-registry" />
            </div>
            <h4>Docker 部署</h4>
            <p>使用 Docker Compose 一键部署完整应用</p>
            <code class="guide-code">docker-compose up -d</code>
          </div>
          <div class="guide-item">
            <div class="guide-icon">
              <i class="i-carbon-cloud-foundry-1" />
            </div>
            <h4>Cloudflare 部署</h4>
            <p>部署到 Cloudflare Workers 获得全球加速</p>
            <code class="guide-code">pnpm deploy:cf:prod</code>
          </div>
          <div class="guide-item">
            <div class="guide-icon">
              <i class="i-carbon-development" />
            </div>
            <h4>本地开发</h4>
            <p>克隆仓库，启动开发环境</p>
            <code class="guide-code">pnpm dev</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 下载模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">下载桌面应用</h3>
          <button class="modal-close" @click="closeModal">
            <i class="i-carbon-close" />
          </button>
        </div>
        <div class="modal-content">
          <p class="modal-description">桌面应用正在开发中，您可以通过以下方式获取最新版本：</p>
          <div class="download-links">
            <a
              href="https://github.com/yunmu-todolist/yun-ai-todolist/releases"
              target="_blank"
              rel="noopener noreferrer"
              class="download-link"
            >
              <i class="i-carbon-logo-github" />
              <div>
                <strong>GitHub Releases</strong>
                <span>查看所有版本</span>
              </div>
            </a>
            <div class="download-link disabled">
              <i class="i-carbon-application" />
              <div>
                <strong>自动构建</strong>
                <span>即将推出</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const showModal = ref(false)

const openDemo = () => {
  // 这里可以跳转到实际的演示页面
  window.open('/', '_blank')
}

const showDownloadModal = () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
}

// 键盘事件处理
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showModal.value) {
      closeModal()
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
.download-section {
  @apply py-20 relative;
  background: linear-gradient(
    135deg,
    rgba(121, 180, 166, 0.05) 0%,
    var(--bg-color) 50%,
    rgba(121, 180, 166, 0.05) 100%
  );
}

.download-container {
  @apply container-responsive;
  max-width: 1200px;
}

.section-header {
  @apply text-center mb-20 relative;
  padding-bottom: 2rem;
}

.section-title {
  @apply text-4xl lg:text-5xl font-bold text-text mb-8;
  background: linear-gradient(135deg, var(--text-color) 0%, #79b4a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  @apply text-xl lg:text-2xl font-medium max-w-4xl mx-auto leading-relaxed mb-8;
  color: var(--text-color);
  opacity: 0.9;
}

.section-divider {
  @apply flex items-center justify-center gap-4 mt-8;
}

.divider-line {
  @apply h-px flex-1 max-w-20;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(121, 180, 166, 0.3) 50%,
    transparent 100%
  );
}

.divider-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-lg;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
  animation: bounce 2s infinite;
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
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}

.download-options {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative;
  padding: 2rem;
  border-radius: 2rem;
  background: linear-gradient(
    135deg,
    rgba(121, 180, 166, 0.02) 0%,
    transparent 50%,
    rgba(121, 180, 166, 0.02) 100%
  );
}

.options-background {
  @apply absolute inset-0 rounded-2xl;
  background: radial-gradient(ellipse at center, rgba(121, 180, 166, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.download-card {
  @apply p-8 rounded-3xl transition-all-300 text-center flex flex-col relative;
  min-height: 420px;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.download-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.primary-card {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.08) 100%);
  border: 1px solid rgba(121, 180, 166, 0.2);
  position: relative;
  overflow: hidden;
}

.primary-card:hover {
  transform: translateY(-10px);
  border-color: rgba(121, 180, 166, 0.3);
}

.card-header {
  @apply mb-6 flex-shrink-0;
}

.card-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.card-title {
  @apply text-2xl font-bold text-text mb-3;
}

.card-description {
  @apply text-text-secondary leading-relaxed;
}

.card-features {
  @apply space-y-3 mb-8 flex-grow;
}

.feature-item {
  @apply flex items-center justify-center gap-2 text-sm text-text-secondary;
}

.feature-item i {
  @apply text-primary;
}

.download-btn {
  @apply w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium transition-all-300 mt-auto;
  min-height: 56px;
}

.primary-btn {
  @apply text-white;
  background: linear-gradient(135deg, #79b4a6 0%, #68a295 100%);
  box-shadow: 0 4px 16px rgba(121, 180, 166, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(121, 180, 166, 0.4);
}

.secondary-btn {
  @apply text-white;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.8) 0%, rgba(104, 162, 149, 0.8) 100%);
  border: 1px solid rgba(121, 180, 166, 0.3);
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(121, 180, 166, 0.2);
}

.secondary-btn:hover {
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.9) 0%, rgba(104, 162, 149, 0.9) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(121, 180, 166, 0.3);
}

/* 部署指南 */
.deployment-guide {
  @apply mt-20;
}

.guide-title {
  @apply text-3xl font-bold text-text text-center mb-12;
}

.guide-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8;
}

.guide-item {
  @apply p-6 rounded-2xl text-center;
  background: rgba(121, 180, 166, 0.03);
  border: 1px solid rgba(121, 180, 166, 0.1);
}

.guide-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl;
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(121, 180, 166, 0.05) 100%);
  color: #79b4a6;
}

.guide-item h4 {
  @apply text-lg font-bold text-text mb-2;
}

.guide-item p {
  @apply text-text-secondary mb-4;
}

.guide-code {
  @apply block px-4 py-2 rounded-lg text-sm font-mono;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
  backdrop-filter: blur(10px);
}

.modal-container {
  @apply bg-card rounded-3xl max-w-md w-full overflow-hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-opacity-10;
  border-color: var(--text-color);
}

.modal-title {
  @apply text-xl font-bold text-text;
}

.modal-close {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all-300;
  background: rgba(0, 0, 0, 0.05);
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-content {
  @apply p-6;
}

.modal-description {
  @apply text-text-secondary mb-6;
}

.download-links {
  @apply space-y-3;
}

.download-link {
  @apply flex items-center gap-4 p-4 rounded-2xl transition-all-300;
  background: rgba(121, 180, 166, 0.05);
  border: 1px solid rgba(121, 180, 166, 0.1);
  text-decoration: none;
  color: var(--text-color);
}

.download-link:hover:not(.disabled) {
  background: rgba(121, 180, 166, 0.1);
}

.download-link.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.download-link i {
  @apply text-2xl text-primary;
}

.download-link strong {
  @apply block font-bold;
}

.download-link span {
  @apply text-sm text-text-secondary;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-section {
    @apply py-16;
  }

  .section-header {
    @apply mb-16;
    padding-bottom: 1.5rem;
  }

  .section-title {
    @apply text-3xl mb-6;
  }

  .section-description {
    @apply text-lg mb-6;
  }

  .section-divider {
    @apply mt-6;
  }

  .divider-line {
    @apply max-w-16;
  }

  .divider-icon {
    @apply w-6 h-6 text-base;
  }

  .download-options {
    @apply grid-cols-1 gap-6;
    padding: 1.5rem;
  }

  .download-card {
    @apply p-6;
    min-height: 380px;
  }

  .card-icon {
    @apply w-14 h-14 text-xl;
  }

  .card-title {
    @apply text-xl;
  }

  .download-btn {
    @apply py-3 text-sm;
    min-height: 48px;
  }

  .guide-grid {
    @apply grid-cols-1 gap-6;
  }

  .guide-title {
    @apply text-2xl;
  }
}
</style>
