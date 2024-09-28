import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import 'highlight.js/styles/github.css'

createApp(App).use(router).mount('#app')
