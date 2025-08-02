import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type { Todo, User, CreateTodoDto, UpdateTodoDto } from '@yun-ai-todolist/shared'

// Mock dependencies
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
}

vi.mock('axios', () => ({
  default: {
    create: () => mockAxios,
  },
}))

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  currentRoute: ref({ path: '/' }),
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('@/composables/useToast', () => ({
  useToast: () => mockToast,
}))

// 创建测试数据工厂
class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      emailVerified: true,
      avatarUrl: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        aiConfig: {
          enabled: true,
          autoAnalyze: false,
          priorityAnalysis: true,
          timeEstimation: true,
          subtaskSplitting: false,
          modelConfig: {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1000,
          },
        },
        searchConfig: {
          defaultLanguage: 'zh-CN',
          safeSearch: true,
          defaultResultCount: 10,
          engineConfig: {
            engine: 'google',
            region: 'cn',
          },
        },
        notifications: {
          desktop: true,
          email: false,
          dueReminder: true,
          reminderMinutes: 30,
        },
        storageConfig: {
          mode: 'hybrid',
          retryAttempts: 3,
          requestTimeout: 5000,
          autoSync: true,
          syncInterval: 5,
          offlineMode: true,
          conflictResolution: 'ask-user',
        },
      },
      ...overrides,
    }
  }

  static createTodo(overrides: Partial<Todo> = {}): Todo {
    return {
      id: `todo-${Date.now()}-${Math.random()}`,
      title: '测试待办事项',
      description: '这是一个测试描述',
      completed: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      order: 0,
      priority: 3,
      userId: 'user-123',
      dueDate: undefined,
      estimatedTime: undefined,
      aiAnalyzed: false,
      synced: true,
      lastSyncTime: '2024-01-01T00:00:00Z',
      ...overrides,
    }
  }

  static createTodoList(count: number): Todo[] {
    return Array.from({ length: count }, (_, index) =>
      this.createTodo({
        id: `todo-${index + 1}`,
        title: `任务 ${index + 1}`,
        order: index,
        completed: index % 3 === 0, // 每三个任务中有一个完成
      })
    )
  }
}

// 模拟应用状态管理
class MockAppState {
  private user = ref<User | null>(null)
  private todos = ref<Todo[]>([])
  private isOnline = ref(true)
  private isLoading = ref(false)
  private syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

  // 认证相关
  async login(email: string, password: string) {
    this.isLoading.value = true
    try {
      const response = await mockAxios.post('/api/auth/login', { email, password })
      this.user.value = response.data.user
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data
    } finally {
      this.isLoading.value = false
    }
  }

  async logout() {
    try {
      await mockAxios.post('/api/auth/logout')
    } finally {
      this.user.value = null
      this.todos.value = []
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('todos')
    }
  }

  // 待办事项管理
  async loadTodos() {
    this.isLoading.value = true
    try {
      if (this.isOnline.value) {
        const response = await mockAxios.get('/api/todos')
        this.todos.value = response.data
        // 同步到本地存储
        localStorage.setItem('todos', JSON.stringify(response.data))
      } else {
        // 离线模式，从本地存储加载
        const localTodos = localStorage.getItem('todos')
        this.todos.value = localTodos ? JSON.parse(localTodos) : []
      }
    } finally {
      this.isLoading.value = false
    }
  }

  async createTodo(todoData: CreateTodoDto) {
    // 验证数据
    if (!todoData.title || todoData.title.trim() === '') {
      throw new Error('标题不能为空')
    }

    const newTodo = TestDataFactory.createTodo({
      ...todoData,
      id: `todo-${Date.now()}`,
      userId: this.user.value?.id,
      synced: this.isOnline.value,
    })

    if (this.isOnline.value) {
      try {
        const response = await mockAxios.post('/api/todos', todoData)
        const serverTodo = { ...response.data, synced: true }
        this.todos.value.push(serverTodo)
        this.updateLocalStorage()
        return serverTodo
      } catch (error) {
        // 网络错误时进行乐观更新
        newTodo.synced = false
        this.todos.value.push(newTodo)
        this.updateLocalStorage()
        throw error
      }
    } else {
      // 离线模式，直接添加
      this.todos.value.push(newTodo)
      this.updateLocalStorage()
      return newTodo
    }
  }

  async updateTodo(id: string, updates: UpdateTodoDto) {
    const todoIndex = this.todos.value.findIndex((t) => t.id === id)
    if (todoIndex === -1) throw new Error('Todo not found')

    // 乐观更新
    const originalTodo = { ...this.todos.value[todoIndex] }
    this.todos.value[todoIndex] = {
      ...originalTodo,
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: this.isOnline.value,
    }
    this.updateLocalStorage()

    if (this.isOnline.value) {
      try {
        const response = await mockAxios.put(`/api/todos/${id}`, updates)
        this.todos.value[todoIndex] = { ...response.data, synced: true }
        this.updateLocalStorage()
      } catch (error) {
        // 回滚并标记为未同步
        this.todos.value[todoIndex] = { ...originalTodo, synced: false }
        this.updateLocalStorage()
        throw error
      }
    }

    return this.todos.value[todoIndex]
  }

  async deleteTodo(id: string) {
    const todoIndex = this.todos.value.findIndex((t) => t.id === id)
    if (todoIndex === -1) throw new Error('Todo not found')

    // 乐观删除
    const deletedTodo = this.todos.value.splice(todoIndex, 1)[0]
    this.updateLocalStorage()

    if (this.isOnline.value) {
      try {
        await mockAxios.delete(`/api/todos/${id}`)
      } catch (error) {
        // 回滚删除
        this.todos.value.splice(todoIndex, 0, deletedTodo)
        this.updateLocalStorage()
        throw error
      }
    } else {
      // 离线模式，标记为待删除
      deletedTodo.syncError = 'pending_delete'
      this.todos.value.push(deletedTodo)
      this.updateLocalStorage()
    }
  }

  // 数据同步
  async syncData() {
    if (!this.isOnline.value || !this.user.value) return

    this.syncStatus.value = 'syncing'
    try {
      // 处理待删除的项目（无论是否已同步）
      const pendingDeleteTodos = this.todos.value.filter((t) => t.syncError === 'pending_delete')
      for (const todo of pendingDeleteTodos) {
        await mockAxios.delete(`/api/todos/${todo.id}`)
        this.todos.value = this.todos.value.filter((t) => t.id !== todo.id)
      }

      // 处理其他未同步的项目
      const unsyncedTodos = this.todos.value.filter((t) => !t.synced && !t.syncError)
      for (const todo of unsyncedTodos) {
        await mockAxios.put(`/api/todos/${todo.id}`, todo)
        const index = this.todos.value.findIndex((t) => t.id === todo.id)
        if (index !== -1) {
          this.todos.value[index] = { ...todo, synced: true }
        }
      }

      this.updateLocalStorage()
      this.syncStatus.value = 'idle'
    } catch (error) {
      this.syncStatus.value = 'error'
      throw error
    }
  }

  // 网络状态管理
  setOnlineStatus(online: boolean) {
    this.isOnline.value = online
    if (online && this.user.value) {
      // 重新上线时自动同步
      this.syncData().catch(console.error)
    }
  }

  // 重置状态
  reset() {
    this.user.value = null
    this.todos.value = []
    this.isOnline.value = true
    this.isLoading.value = false
    this.syncStatus.value = 'idle'
    // 清理 localStorage mock
    mockLocalStorage.clear()
  }

  private updateLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(this.todos.value))
  }

  // Getters
  getUser() {
    return this.user
  }
  getTodos() {
    return this.todos
  }
  getIsOnline() {
    return this.isOnline
  }
  getIsLoading() {
    return this.isLoading
  }
  getSyncStatus() {
    return this.syncStatus
  }
}

describe('用户工作流程集成测试', () => {
  let appState: MockAppState
  let testUser: User
  let testTodos: Todo[]

  // 通用的测试初始化函数
  const initializeTest = () => {
    vi.clearAllMocks()
    appState = new MockAppState()
    appState.reset() // 重置应用状态
    mockLocalStorage.getItem.mockReturnValue(null)
    // 确保每个测试都有干净的状态
    appState.setOnlineStatus(true)
    // 为每个测试创建独立的测试数据
    testUser = TestDataFactory.createUser()
    testTodos = TestDataFactory.createTodoList(5)
  }

  // 测试辅助函数：更可靠的 Todo 查找和比较（已注释，未使用）
  // const findTodoByTitle = (title: string): Todo | undefined => {
  //   return appState.getTodos().value.find(todo => todo.title === title)
  // }

  // Helper functions for todo validation (commented out as they are unused)
  // const expectTodoExists = (title: string, shouldExist: boolean = true) => {
  //   const todo = findTodoByTitle(title)
  //   if (shouldExist) {
  //     expect(todo).toBeDefined()
  //     expect(todo?.title).toBe(title)
  //   } else {
  //     expect(todo).toBeUndefined()
  //   }
  //   return todo
  // }

  // const expectTodoProperties = (title: string, expectedProps: Partial<Todo>) => {
  //   const todo = findTodoByTitle(title)
  //   expect(todo).toBeDefined()
  //   Object.entries(expectedProps).forEach(([key, value]) => {
  //     expect(todo?.[key as keyof Todo]).toBe(value)
  //   })
  //   return todo
  // }

  beforeEach(() => {
    initializeTest()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('完整用户会话流程', () => {
    it('应该支持完整的登录-使用-登出流程', async () => {
      // 1. 用户登录
      mockAxios.post.mockResolvedValueOnce({
        data: { user: testUser, token: 'mock-token' },
      })

      await appState.login('test@example.com', 'password123')
      expect(appState.getUser().value).toEqual(testUser)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token')

      // 2. 加载待办事项
      mockAxios.get.mockResolvedValueOnce({ data: testTodos })
      await appState.loadTodos()
      expect(appState.getTodos().value).toEqual(testTodos)

      // 3. 创建新的待办事项
      const newTodoData: CreateTodoDto = {
        title: '新任务',
        description: '新任务描述',
        priority: 4,
      }

      mockAxios.post.mockResolvedValueOnce({
        data: TestDataFactory.createTodo({ ...newTodoData, id: 'new-todo-id' }),
      })

      await appState.createTodo(newTodoData)
      expect(appState.getTodos().value).toHaveLength(6)
      expect(appState.getTodos().value[5].title).toBe('新任务')

      // 4. 更新待办事项
      const updateData: UpdateTodoDto = { completed: true }
      mockAxios.put.mockResolvedValueOnce({
        data: { ...testTodos[0], ...updateData, synced: true },
      })

      await appState.updateTodo(testTodos[0].id, updateData)
      const updatedTodo = appState.getTodos().value.find((t) => t.id === testTodos[0].id)
      expect(updatedTodo?.completed).toBe(true)

      // 5. 删除待办事项
      const todoToDeleteId = testTodos[1].id
      mockAxios.delete.mockResolvedValueOnce({})
      await appState.deleteTodo(todoToDeleteId)
      expect(appState.getTodos().value.find((t) => t.id === todoToDeleteId)).toBeUndefined()

      // 6. 用户登出
      mockAxios.post.mockResolvedValueOnce({})
      await appState.logout()
      expect(appState.getUser().value).toBeNull()
      expect(appState.getTodos().value).toHaveLength(0)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('离线模式和数据同步', () => {
    // 辅助函数：设置已登录状态并加载数据
    const setupLoggedInState = async () => {
      // 设置已登录状态
      mockAxios.post.mockResolvedValueOnce({
        data: { user: testUser, token: 'mock-token' },
      })
      await appState.login('test@example.com', 'password123')

      mockAxios.get.mockResolvedValueOnce({ data: testTodos })
      await appState.loadTodos()
    }

    it('应该在离线时使用本地存储', async () => {
      await setupLoggedInState()

      // 模拟离线
      appState.setOnlineStatus(false)

      // 从本地存储加载数据
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testTodos))
      await appState.loadTodos()

      expect(mockAxios.get).toHaveBeenCalledTimes(1) // 只在在线时调用
      expect(appState.getTodos().value).toEqual(testTodos)
    })

    it('应该在离线时进行乐观更新', async () => {
      await setupLoggedInState()

      // 记录初始待办事项数量
      const initialCount = appState.getTodos().value.length

      appState.setOnlineStatus(false)

      const newTodoData: CreateTodoDto = {
        title: '离线任务',
        description: '离线创建的任务',
      }

      const newTodo = await appState.createTodo(newTodoData)

      expect(newTodo.synced).toBe(false)
      expect(appState.getTodos().value).toHaveLength(initialCount + 1)

      // 检查新创建的 todo 是否在列表中
      const createdTodo = appState.getTodos().value.find((t) => t.title === '离线任务')
      expect(createdTodo).toBeDefined()
      expect(createdTodo?.synced).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('应该在重新上线时同步数据', async () => {
      await setupLoggedInState()

      // 离线创建任务
      appState.setOnlineStatus(false)
      const offlineTodo = await appState.createTodo({ title: '离线任务' })

      // 重新上线
      appState.setOnlineStatus(true)

      // 模拟同步成功
      mockAxios.put.mockResolvedValueOnce({
        data: { ...offlineTodo, synced: true },
      })

      await appState.syncData()

      const syncedTodo = appState.getTodos().value.find((t) => t.id === offlineTodo.id)
      expect(syncedTodo?.synced).toBe(true)
    })

    it('应该处理同步冲突', async () => {
      await setupLoggedInState()

      const todoId = testTodos[0].id

      // 离线更新
      appState.setOnlineStatus(false)
      await appState.updateTodo(todoId, { title: '离线更新的标题' })

      // 重新上线，模拟服务器冲突
      appState.setOnlineStatus(true)
      mockAxios.put.mockRejectedValueOnce({
        response: { status: 409, data: { message: '数据冲突' } },
      })

      await expect(appState.syncData()).rejects.toThrow()
      expect(appState.getSyncStatus().value).toBe('error')
    })

    it('应该处理离线删除操作', async () => {
      await setupLoggedInState()

      const todoToDelete = testTodos[0]

      // 离线删除
      appState.setOnlineStatus(false)
      await appState.deleteTodo(todoToDelete.id)

      // 检查是否标记为待删除
      const markedTodo = appState.getTodos().value.find((t) => t.id === todoToDelete.id)
      expect(markedTodo?.syncError).toBe('pending_delete')

      // 重新上线并同步
      appState.setOnlineStatus(true)
      mockAxios.delete.mockResolvedValueOnce({})

      await appState.syncData()

      // 确认已从本地删除
      expect(appState.getTodos().value.find((t) => t.id === todoToDelete.id)).toBeUndefined()
    })
  })

  describe('错误处理和恢复', () => {
    // 辅助函数：执行登录操作
    const performLogin = async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { user: testUser, token: 'mock-token' },
      })
      await appState.login('test@example.com', 'password123')
    }

    it('应该处理网络错误并回滚操作', async () => {
      await performLogin()

      mockAxios.get.mockResolvedValueOnce({ data: testTodos })
      await appState.loadTodos()

      const originalTodo = testTodos[0]
      const updateData: UpdateTodoDto = { title: '更新失败的标题' }

      // 模拟网络错误
      mockAxios.put.mockRejectedValueOnce(new Error('Network error'))

      await expect(appState.updateTodo(originalTodo.id, updateData)).rejects.toThrow()

      // 检查是否回滚到原始状态
      const todo = appState.getTodos().value.find((t) => t.id === originalTodo.id)
      expect(todo?.title).toBe(originalTodo.title)
      expect(todo?.synced).toBe(false)
    })

    it('应该处理服务器验证错误', async () => {
      await performLogin()

      const invalidTodoData: CreateTodoDto = {
        title: '', // 无效的空标题
      }

      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: '标题不能为空' },
        },
      })

      await expect(appState.createTodo(invalidTodoData)).rejects.toThrow()

      // 确认没有添加无效的待办事项
      expect(appState.getTodos().value.find((t) => t.title === '')).toBeUndefined()
    })

    it('应该处理认证过期', async () => {
      await performLogin()

      mockAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Token expired' } },
      })

      await expect(appState.loadTodos()).rejects.toThrow()

      // 在实际应用中，这里应该触发重新登录流程
      expect(mockAxios.get).toHaveBeenCalledWith('/api/todos')
    })
  })

  describe('性能和并发处理', () => {
    // 辅助函数：执行登录并加载数据
    const performLoginAndLoadData = async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { user: testUser, token: 'mock-token' },
      })
      await appState.login('test@example.com', 'password123')

      mockAxios.get.mockResolvedValueOnce({ data: testTodos })
      await appState.loadTodos()
    }

    it('应该正确处理并发的待办事项操作', async () => {
      await performLoginAndLoadData()

      // 清空现有数据
      appState.getTodos().value = []

      const todo1Data: CreateTodoDto = { title: '并发任务1' }
      const todo2Data: CreateTodoDto = { title: '并发任务2' }
      const todo3Data: CreateTodoDto = { title: '并发任务3' }

      mockAxios.post.mockImplementation((url, data) => {
        return Promise.resolve({
          data: TestDataFactory.createTodo({ ...data, id: `concurrent-${data.title}` }),
        })
      })

      // 并发创建多个待办事项
      const promises = [
        appState.createTodo(todo1Data),
        appState.createTodo(todo2Data),
        appState.createTodo(todo3Data),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(appState.getTodos().value).toHaveLength(3) // 新增3个

      // 确认所有任务都正确创建
      const titles = appState.getTodos().value.map((t) => t.title)
      expect(titles).toContain('并发任务1')
      expect(titles).toContain('并发任务2')
      expect(titles).toContain('并发任务3')
    })

    it('应该正确处理大量数据的加载', async () => {
      const largeTodoList = TestDataFactory.createTodoList(1000)

      mockAxios.get.mockResolvedValueOnce({ data: largeTodoList })

      const startTime = Date.now()
      await appState.loadTodos()
      const endTime = Date.now()

      expect(appState.getTodos().value).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // 应该在1秒内完成
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(largeTodoList))
    })
  })

  describe('数据一致性验证', () => {
    it('应该确保本地存储和内存状态的一致性', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { user: testUser, token: 'mock-token' },
      })
      await appState.login('test@example.com', 'password123')

      mockAxios.get.mockResolvedValueOnce({ data: testTodos })
      await appState.loadTodos()

      // 创建新任务
      const newTodoData: CreateTodoDto = { title: '一致性测试任务' }
      mockAxios.post.mockResolvedValueOnce({
        data: TestDataFactory.createTodo({ ...newTodoData, id: 'consistency-test' }),
      })

      await appState.createTodo(newTodoData)

      // 验证本地存储和内存状态一致
      const memoryTodos = appState.getTodos().value
      const lastSetItemCall = mockLocalStorage.setItem.mock.calls
        .filter((call) => call[0] === 'todos')
        .pop()

      expect(lastSetItemCall).toBeDefined()
      const storedTodos = JSON.parse((lastSetItemCall as [string, string])[1])
      expect(storedTodos).toEqual(memoryTodos)
    })

    it('应该在应用重启后恢复正确的状态', async () => {
      // 模拟应用重启前的状态
      const persistedTodos = TestDataFactory.createTodoList(3)

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'todos') return JSON.stringify(persistedTodos)
        if (key === 'auth_token') return 'persisted-token'
        return null
      })

      // 模拟应用重启后的状态恢复
      const newAppState = new MockAppState()

      // 模拟离线加载
      newAppState.setOnlineStatus(false)
      await newAppState.loadTodos()

      expect(newAppState.getTodos().value).toEqual(persistedTodos)
    })
  })
})
