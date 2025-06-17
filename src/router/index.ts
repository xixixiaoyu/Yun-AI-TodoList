import {
  createRouter,
  createWebHashHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'
import AIChatDialog from '../components/AIChatDialog.vue'
import Settings from '../components/Settings.vue'
import TodoList from '../components/TodoList.vue'

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

router.beforeEach(
  (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    document.title = to.meta.title as string
    next()
  }
)

export default router
