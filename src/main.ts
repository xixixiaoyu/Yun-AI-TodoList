import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.ts'
import i18n from './i18n'
import 'highlight.js/styles/github.css'
import { registerSW } from 'virtual:pwa-register'

// 注册 Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // 当有新版本时提示用户
    if (confirm('新版本已经准备就绪，是否更新？')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用')
  },
})

createApp(App).use(router).use(i18n).mount('#app')
