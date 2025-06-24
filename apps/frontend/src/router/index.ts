import {
  createRouter,
  createWebHashHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'

// 路由懒加载配置 - 提升初始加载性能
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/TodoList.vue'),
      meta: {
        title: '待办事项',
        preload: true, // 标记为需要预加载的路由
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../components/Settings.vue'),
      meta: {
        title: '设置',
        preload: false, // 按需加载
      },
    },
    {
      path: '/test-input',
      name: 'test-input',
      component: () => import('../components/TodoInputTest.vue'),
      meta: {
        title: 'TodoInput 测试',
        preload: false,
      },
    },
  ],
})

router.beforeEach(
  (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    // 设置页面标题
    document.title = to.meta.title as string

    // 性能优化：预加载下一个可能访问的路由
    if (to.meta.preload && to.name === 'home') {
      // 在主页时预加载设置页面
      import('../components/Settings.vue').catch(() => {
        // 预加载失败时静默处理
      })
    }

    next()
  }
)

export default router
