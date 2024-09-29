import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import 'highlight.js/styles/github.css'

declare module 'canvas-confetti'

createApp(App).use(router).use(i18n).mount('#app')
