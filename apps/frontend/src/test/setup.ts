/**
 * 测试环境全局设置
 * 用于配置测试环境中的全局 mock 和设置
 */

import { afterEach, vi } from 'vitest'
import * as Vue from 'vue'
import { createI18n } from 'vue-i18n'

// 全局注册 Vue API
Object.assign(global as Record<string, unknown>, Vue)

// 清理 DOM 和全局状态
afterEach(() => {
  // 清理 DOM
  document.body.innerHTML = ''

  // 清理全局状态
  vi.clearAllMocks()
})

// Mock Worker for tests
;(global as Record<string, unknown>).Worker = class MockWorker {
  constructor(public url: string | URL) {}

  onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => unknown) | null = null
  onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null

  postMessage(_message: unknown): void {
    // Mock implementation - do nothing
  }

  terminate(): void {
    // Mock implementation - do nothing
  }

  addEventListener(_type: string, _listener: EventListener): void {
    // Mock implementation - do nothing
  }

  removeEventListener(_type: string, _listener: EventListener): void {
    // Mock implementation - do nothing
  }

  dispatchEvent(_event: Event): boolean {
    return true
  }
}

// 创建测试用的 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: {
      configureApiKey: '请先配置 API Key',
      networkConnectionError: '网络连接错误',
      todoList: '待办事项',
      addTodo: '添加待办事项',
      completed: '已完成',
      active: '进行中',
      all: '全部',
      clear: '清除',
      search: '搜索',
      statistics: '统计',
      close: '关闭',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      save: '保存',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
    },
    en: {
      configureApiKey: 'Please configure API Key first',
      networkConnectionError: 'Network connection error',
      todoList: 'Todo List',
      addTodo: 'Add Todo',
      completed: 'Completed',
      active: 'Active',
      all: 'All',
      clear: 'Clear',
      search: 'Search',
      statistics: 'Statistics',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
    },
  },
})

// 全局 useI18n mock
;(global as Record<string, unknown>).useI18n = () => ({
  t: (key: string) => i18n.global.t(key),
  locale: i18n.global.locale,
})

// Mock vue-i18n 模块
const messages: Record<string, string> = {
  configureApiKey: '请先配置 API Key',
  networkConnectionError: '网络连接错误',
  todoList: '待办事项',
  addTodo: '添加待办事项',
  completed: '已完成',
  active: '进行中',
  all: '全部',
  clear: '清除',
  search: '搜索',
  statistics: '统计',
  close: '关闭',
  cancel: '取消',
  confirm: '确认',
  delete: '删除',
  edit: '编辑',
  save: '保存',
  loading: '加载中...',
  error: '错误',
  success: '成功',
  warning: '警告',
  info: '信息',
  newConversation: '新对话',
  productivityInsights: '生产力洞察',
  totalTasks: '总任务',
  completedTasks: '已完成',
  pendingTasks: '待完成',
  openCharts: '打开统计图表',
  toggleTheme: '切换主题',
  searchTodos: '搜索待办事项',
  pending: '待完成',
  completionRate: '完成率',
  completedTodos: '已完成任务',
  completionTrend: '完成趋势',
  task: '任务',
  tasks: '任务',
  locale: 'zh-CN',
  closeSearch: '关闭搜索',
  openSearch: '打开搜索',
  closeCharts: '关闭图表',
  aiAssistant: 'AI 助手',
  appTitle: '待办事项',
}

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    createI18n: vi.fn(() => ({
      global: {
        t: (key: string) => messages[key] || key,
        locale: { value: 'zh' },
      },
      install: vi.fn(),
    })),
    useI18n: () => ({
      t: (key: string) => messages[key] || key,
      locale: { value: 'zh' },
    }),
  }
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),

    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })) as () => CanvasGradient,
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })) as () => CanvasGradient,
    getLineDash: vi.fn(() => []),
    setLineDash: vi.fn(),
    lineDashOffset: 0,
  })),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  value: 800,
  writable: true,
})

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  value: 600,
  writable: true,
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
})

// Mock Sortable.js
vi.mock('sortablejs', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    option: vi.fn(),
    toArray: vi.fn(() => []),
  })),
}))

// Mock auth service
vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: { value: false },
    user: { value: null },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}))

// Mock useStorageMode
vi.mock('@/composables/useStorageMode', () => {
  // 使用全局变量来确保每次测试都能重置
  let globalNextId = 1
  const globalTodos: any[] = []

  const mockStorageService = {
    async createTodo(dto: any) {
      // 检查标题是否为空
      if (!dto.title || dto.title.trim() === '') {
        return { success: false, error: 'storage.todoTitleEmpty' }
      }

      // 检查重复标题（只检查未完成的待办事项）
      const duplicateExists = globalTodos.some(
        (t: any) => !t.completed && t.title.toLowerCase() === dto.title.toLowerCase()
      )
      if (duplicateExists) {
        return { success: false, error: 'storage.todoAlreadyExists' }
      }

      // 检查是否模拟存储错误（通过检查 localStorage.setItem 是否被 mock 为抛出错误）
      try {
        // 尝试调用 localStorage.setItem 来检测是否被 mock 为抛出错误
        const testKey = `test-${Date.now()}-${Math.random()}`
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
      } catch {
        // 如果 localStorage 抛出错误，返回失败结果
        return { success: false, error: 'Storage quota exceeded' }
      }

      const newTodo = {
        id: `todo-${globalNextId++}`,
        title: dto.title,
        completed: false,
        order: globalTodos.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...dto,
      }
      globalTodos.push(newTodo)
      return { success: true, data: newTodo }
    },
    async createTodos(dtos: any[]) {
      const createdTodos = dtos.map((dto: any) => {
        const newTodo = {
          id: `todo-${globalNextId++}`,
          title: dto.title,
          completed: false,
          order: globalTodos.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...dto,
        }
        globalTodos.push(newTodo)
        return newTodo
      })
      return { success: true, data: createdTodos, successCount: createdTodos.length }
    },
    async updateTodo(id: string, data: any) {
      const index = globalTodos.findIndex((t: any) => t.id === id)
      if (index !== -1) {
        globalTodos[index] = { ...globalTodos[index], ...data, updatedAt: new Date().toISOString() }
        return { success: true, data: globalTodos[index] }
      }
      return { success: false, error: 'Todo not found' }
    },
    async deleteTodo(id: string) {
      const index = globalTodos.findIndex((t: any) => t.id === id)
      if (index !== -1) {
        globalTodos.splice(index, 1)
        return { success: true }
      }
      return { success: false, error: 'Todo not found' }
    },
    async getTodos() {
      return { success: true, data: [...globalTodos] }
    },
    async reorderTodos(todoIds: string[]) {
      const reorderedTodos = todoIds
        .map((id, index) => {
          const todo = globalTodos.find((t: any) => t.id === id)
          if (todo) {
            return { ...todo, order: index }
          }
          return null
        })
        .filter(Boolean)
      globalTodos.splice(0, globalTodos.length, ...reorderedTodos)
      return { success: true, data: globalTodos }
    },
    async saveTodos(todoList: any[]) {
      globalTodos.splice(0, globalTodos.length, ...todoList)
      return { success: true }
    },
  }

  const mockCurrentMode = { value: 'local' }
  const mockConfig = { value: { mode: 'local' } }

  const mockUseStorageMode = () => ({
    currentMode: mockCurrentMode,
    config: mockConfig,
    syncStatus: { value: { syncInProgress: false, pendingChanges: 0, conflictsCount: 0 } },
    isInitialized: { value: true },
    canUseRemoteStorage: { value: false },
    isOnlineMode: { value: false },
    isOfflineMode: { value: true },
    initializeStorage: vi.fn(),
    initializeStorageMode: vi.fn().mockResolvedValue(true),
    switchStorageMode: vi.fn().mockImplementation(async (mode: string) => {
      mockCurrentMode.value = mode
      mockConfig.value.mode = mode
      return true
    }),
    syncData: vi.fn(),
    clearStorage: vi.fn(() => {
      globalTodos.splice(0, globalTodos.length)
      globalNextId = 1
    }),
    getCurrentStorageService: () => mockStorageService,
  })

  // 导出重置函数
  const resetMockState = () => {
    globalTodos.splice(0, globalTodos.length)
    globalNextId = 1
  }

  return {
    useStorageMode: mockUseStorageMode,
    getCurrentStorageService: () => mockStorageService,
    resetMockState,
  }
})

// Mock @/composables/useNotifications
vi.mock('@/composables/useNotifications', () => {
  const mockNotifications = ref([] as any[])
  const mockTimers = new Map<string, any>()

  const mockUseNotifications = () => ({
    notifications: readonly(mockNotifications),
    config: readonly({ maxNotifications: 5, defaultDuration: 4000, position: 'top-right' }),

    addNotification: vi.fn((notification: any) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const newNotification = {
        id,
        timestamp: new Date(),
        duration: notification.duration || 4000,
        ...notification,
      }
      mockNotifications.value.unshift(newNotification)

      // 模拟自动移除
      if (!newNotification.persistent && newNotification.duration > 0) {
        const timerId = setTimeout(() => {
          const index = mockNotifications.value.findIndex((n: any) => n.id === id)
          if (index > -1) {
            mockNotifications.value.splice(index, 1)
            mockTimers.delete(id)
          }
        }, newNotification.duration)
        mockTimers.set(id, timerId)
      }

      return id
    }),

    removeNotification: vi.fn((id: string) => {
      const index = mockNotifications.value.findIndex((n: any) => n.id === id)
      if (index > -1) {
        mockNotifications.value.splice(index, 1)
        const timerId = mockTimers.get(id)
        if (timerId) {
          clearTimeout(timerId)
          mockTimers.delete(id)
        }
      }
    }),

    clearNotifications: vi.fn(() => {
      mockTimers.forEach((timerId: any) => clearTimeout(timerId))
      mockTimers.clear()
      mockNotifications.value = []
    }),

    success: vi.fn((title: string, message: string, options: any = {}) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const notification = {
        id,
        type: 'success',
        title,
        message,
        duration: options.duration || 3000,
        timestamp: new Date(),
        ...options,
      }

      // 检查重复通知
      const isDuplicate = mockNotifications.value.some(
        (n: any) => n.title === title && n.message === message && n.type === 'success'
      )
      if (isDuplicate) {
        return ''
      }

      mockNotifications.value.unshift(notification)

      if (!notification.persistent && notification.duration > 0) {
        const timerId = setTimeout(() => {
          const index = mockNotifications.value.findIndex((n: any) => n.id === id)
          if (index > -1) {
            mockNotifications.value.splice(index, 1)
            mockTimers.delete(id)
          }
        }, notification.duration)
        mockTimers.set(id, timerId)
      }

      return id
    }),

    error: vi.fn((title: string, message: string, options: any = {}) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const notification = {
        id,
        type: 'error',
        title,
        message,
        duration: options.duration || 8000,
        timestamp: new Date(),
        ...options,
      }
      mockNotifications.value.unshift(notification)
      return id
    }),

    warning: vi.fn((title: string, message: string, options: any = {}) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const notification = {
        id,
        type: 'warning',
        title,
        message,
        duration: options.duration || 6000,
        timestamp: new Date(),
        ...options,
      }
      mockNotifications.value.unshift(notification)
      return id
    }),

    info: vi.fn((title: string, message: string, options: any = {}) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const notification = {
        id,
        type: 'info',
        title,
        message,
        duration: options.duration || 4000,
        timestamp: new Date(),
        ...options,
      }
      mockNotifications.value.unshift(notification)
      return id
    }),

    getDebugInfo: vi.fn(() => ({
      notifications: mockNotifications.value.map((n: any) => ({
        id: n.id.slice(-8),
        title: n.title,
        type: n.type,
        duration: n.duration,
        persistent: n.persistent,
        timestamp: n.timestamp,
        age: Date.now() - n.timestamp.getTime(),
      })),
      activeTimers: Array.from(mockTimers.entries()).map(([id, timerId]) => ({
        notificationId: id.slice(-8),
        timerId,
      })),
      recentNotificationsCache: [],
      config: { maxNotifications: 5, defaultDuration: 4000, position: 'top-right' },
      stats: {
        totalNotifications: mockNotifications.value.length,
        activeTimers: mockTimers.size,
        cacheEntries: 0,
      },
    })),

    updateConfig: vi.fn(),
    loading: vi.fn(),
    authError: vi.fn(),
    syncSuccess: vi.fn(),
    syncError: vi.fn(),
    networkOffline: vi.fn(),
    networkOnline: vi.fn(),
  })

  return {
    useNotifications: mockUseNotifications,
  }
})

// Mock DOM methods for testing
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  })),
  writable: true,
})
