<template>
  <footer class="footer-section">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="brand-logo">
            <img src="/logo.png" alt="Yun AI TodoList" class="logo-image" />
            <h3 class="brand-name">Yun AI TodoList</h3>
          </div>
          <p class="brand-description">
            基于 AI 的现代化全栈待办事项应用，让任务管理变得更加智能高效。
          </p>
          <div class="social-links">
            <a
              href="https://github.com/yunmu-todolist/yun-ai-todolist"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
              title="GitHub"
            >
              <i class="i-carbon-logo-github" />
            </a>
            <a href="#" class="social-link" title="文档">
              <i class="i-carbon-document" />
            </a>
            <a href="#" class="social-link" title="反馈">
              <i class="i-carbon-email" />
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-info">
          <p class="copyright">
            © {{ currentYear }} Yun AI TodoList. 基于
            <a
              href="https://github.com/yunmu-todolist/yun-ai-todolist/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              class="license-link"
            >
              GPL-3.0
            </a>
            开源协议
          </p>
          <div class="tech-badges">
            <span class="tech-badge">Vue 3</span>
            <span class="tech-badge">TypeScript</span>
            <span class="tech-badge">NestJS</span>
            <span class="tech-badge">UnoCSS</span>
          </div>
        </div>

        <div class="footer-actions">
          <button class="back-to-top" @click="scrollToTop">
            <i class="i-carbon-chevron-up" />
            <span>回到顶部</span>
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 平滑滚动到锚点
const handleAnchorClick = (event: Event) => {
  const target = event.target as HTMLAnchorElement
  const href = target.getAttribute('href')

  if (href && href.startsWith('#')) {
    event.preventDefault()
    const element = document.querySelector(href.replace('#', '.') + '-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

onMounted(() => {
  // 为所有锚点链接添加平滑滚动
  const anchorLinks = document.querySelectorAll('a[href^="#"]')
  anchorLinks.forEach((link) => {
    link.addEventListener('click', handleAnchorClick)
  })

  onUnmounted(() => {
    anchorLinks.forEach((link) => {
      link.removeEventListener('click', handleAnchorClick)
    })
  })
})
</script>

<style scoped>
.footer-section {
  @apply py-16 relative;
  background: linear-gradient(135deg, var(--bg-color) 0%, rgba(121, 180, 166, 0.03) 100%);
  border-top: 1px solid rgba(121, 180, 166, 0.1);
}

.footer-container {
  @apply container-responsive;
  max-width: 1200px;
}

.footer-content {
  @apply grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12;
}

.footer-brand {
  @apply lg:col-span-2;
}

.brand-logo {
  @apply flex items-center gap-3 mb-4;
}

.logo-image {
  @apply w-10 h-10 rounded-xl;
}

.brand-name {
  @apply text-2xl font-bold text-text;
}

.brand-description {
  @apply text-text-secondary leading-relaxed mb-6;
}

.social-links {
  @apply flex gap-4;
}

.social-link {
  @apply w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all-300;
  background: rgba(121, 180, 166, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
  text-decoration: none;
}

.social-link:hover {
  background: rgba(121, 180, 166, 0.2);
  transform: translateY(-2px);
}

.footer-links {
  @apply lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8;
}

.link-group {
  @apply space-y-4;
}

.group-title {
  @apply text-lg font-bold text-text;
}

.link-list {
  @apply space-y-2;
}

.footer-link {
  @apply text-text-secondary transition-colors-300;
  text-decoration: none;
}

.footer-link:hover {
  color: #79b4a6;
}

.footer-bottom {
  @apply flex flex-col md:flex-row items-center justify-between gap-6 pt-8;
  border-top: 1px solid rgba(121, 180, 166, 0.1);
}

.footer-info {
  @apply flex flex-col md:flex-row items-center gap-4;
}

.copyright {
  @apply text-text-secondary text-sm;
}

.license-link {
  @apply text-primary;
  text-decoration: none;
}

.license-link:hover {
  text-decoration: underline;
}

.tech-badges {
  @apply flex flex-wrap gap-2;
}

.tech-badge {
  @apply px-2 py-1 rounded-md text-xs font-medium;
  background: rgba(121, 180, 166, 0.1);
  color: #79b4a6;
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.footer-actions {
  @apply flex items-center;
}

.back-to-top {
  @apply flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all-300;
  background: rgba(121, 180, 166, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(121, 180, 166, 0.2);
}

.back-to-top:hover {
  background: rgba(121, 180, 166, 0.2);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .footer-content {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .footer-brand {
    @apply col-span-full;
  }

  .footer-links {
    @apply col-span-full grid-cols-2 md:grid-cols-4;
  }
}

@media (max-width: 768px) {
  .footer-section {
    @apply py-12;
  }

  .footer-content {
    @apply grid-cols-1 gap-8;
  }

  .footer-links {
    @apply grid-cols-2 gap-6;
  }

  .footer-bottom {
    @apply flex-col gap-4 pt-6;
  }

  .footer-info {
    @apply flex-col gap-3 text-center;
  }

  .tech-badges {
    @apply justify-center;
  }
}

@media (max-width: 640px) {
  .footer-links {
    @apply grid-cols-1 gap-6;
  }

  .brand-logo {
    @apply justify-center;
  }

  .brand-description {
    @apply text-center;
  }

  .social-links {
    @apply justify-center;
  }
}
</style>
