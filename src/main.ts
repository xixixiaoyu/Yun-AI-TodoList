import 'highlight.js/styles/github.css'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n/index'
import router from './router/index.ts'
import './style.css'
import { logger } from './utils/logger.ts'

// 注册 Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // 当有新版本时提示用户
    if (confirm('新版本已经准备就绪，是否更新？')) {
      updateSW()
    }
  },
  onOfflineReady() {
    logger.info('应用已准备好离线使用', undefined, 'PWA')
  }
})

createApp(App).use(router).use(i18n).mount('#app')
