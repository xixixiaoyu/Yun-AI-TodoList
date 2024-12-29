import { createRouter, createWebHashHistory } from 'vue-router'
import TodoList from '../components/TodoList.vue'
import AIChatDialog from '../components/AIChatDialog.vue'
import Settings from '../components/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TodoList,
      meta: { title: '待办事项' },
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: AIChatDialog,
      meta: { title: 'AI 助手' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { title: '设置' },
    },
  ],
})

router.beforeEach((to: any, from: any, next: any) => {
  document.title = to.meta.title as string
  next()
})

export default router
