import 'highlight.js/styles/github-dark.css'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import { registerSW } from 'virtual:pwa-register'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n/index'
import router from './router/index.ts'
import './styles/enhancements.css'
import './styles/variables.css'
import { logger } from './utils/logger.ts'
import { initPWA } from './utils/pwa'

const updateSW = registerSW({
  onNeedRefresh() {
    // 显示更新提示
    const shouldUpdate = confirm('发现新版本！\n\n新版本包含功能改进和错误修复。\n是否立即更新？')
    if (shouldUpdate) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    logger.info('应用已准备好离线使用', undefined, 'PWA')
  },
  onRegisterError(error: Error) {
    logger.error('Service Worker 注册失败', error, 'PWA')
  },
})

// 初始化 PWA 功能
initPWA().catch((error) => {
  logger.error('PWA 初始化失败', error, 'PWA')
})

createApp(App).use(router).use(i18n).mount('#app')
