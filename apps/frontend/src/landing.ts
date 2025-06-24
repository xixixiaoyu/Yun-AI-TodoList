// 宣传页面专用入口文件
import 'virtual:uno.css'
import { createApp } from 'vue'
import Landing from './views/Landing.vue'

// 创建 Vue 应用
const app = createApp(Landing)

// 挂载应用
app.mount('#app')

// 导出应用实例（用于测试）
export default app
