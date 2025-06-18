import {
  createRouter,
  createWebHashHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'
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
