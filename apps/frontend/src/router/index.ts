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
      path: '/landing',
      name: 'landing',
      component: () => import('../views/Landing.vue'),
      meta: {
        title: 'Yun AI TodoList - 智能待办事项管理应用',
        preload: false, // 按需加载
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
      path: '/login',
      name: 'login',
      component: () => import('../components/auth/Login.vue'),
      meta: {
        title: '登录 - Yun AI TodoList',
        preload: false,
        requiresGuest: true, // 只有未登录用户可以访问
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../components/auth/Register.vue'),
      meta: {
        title: '注册 - Yun AI TodoList',
        preload: false,
        requiresGuest: true, // 只有未登录用户可以访问
      },
    },
  ],
})

router.beforeEach(
  async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    // 设置页面标题
    document.title = to.meta.title as string

    // 延迟导入认证模块以避免循环依赖
    let isAuthenticated = false
    try {
      const { useAuth } = await import('../composables/useAuth')
      const auth = useAuth()
      isAuthenticated = auth.isAuthenticated.value
    } catch (error) {
      console.warn('Failed to load auth module:', error)
    }

    // 检查需要访客权限的路由（登录、注册页面）
    if (to.meta.requiresGuest && isAuthenticated) {
      // 已登录用户访问登录/注册页面，重定向到首页
      next({ name: 'home' })
      return
    }

    // 检查需要认证的路由（暂时没有，但为将来扩展预留）
    if (to.meta.requiresAuth && !isAuthenticated) {
      // 未登录用户访问需要认证的页面，重定向到登录页
      next({
        name: 'login',
        query: { redirect: to.fullPath }, // 保存原始目标路径
      })
      return
    }

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
