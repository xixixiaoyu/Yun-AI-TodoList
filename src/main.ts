import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.ts'
import i18n from './i18n'
import 'highlight.js/styles/github.css'

// @ts-ignore
declare module 'canvas-confetti'

createApp(App).use(router).use(i18n).mount('#app')
