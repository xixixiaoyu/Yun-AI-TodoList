import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/deepseekService', () => ({
  getAIResponse: vi.fn(() => Promise.resolve('1. 学习新技能\n2. 锻炼身体\n3. 阅读书籍')),
  streamAIResponse: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    showError: vi.fn(),
  })),
}))

// 国际化配置（暂未使用）
// const i18n = createI18n({
//   legacy: false,
//   locale: 'zh',
//   messages: {
//     zh: {
//       addTodo: '添加待办事项',
//       todoAdded: '待办事项已添加',
//       todoCompleted: '待办事项已完成',
//       todoDeleted: '待办事项已删除',
//     },
//   },
// })

describe('待办事项工作流集成测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(async () => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
    localStorage.clear()
    const { todos, resetState } = useTodos()
    await resetState()
    todos.value = []
    await new Promise((resolve) => setTimeout(resolve, 100)) // 等待状态更新
  })

  afterEach(async () => {
    testEnv.cleanup()
    localStorage.clear()
    const { todos, resetState } = useTodos()
    await resetState()
    todos.value = []
    await new Promise((resolve) => setTimeout(resolve, 100)) // 等待状态更新
  })

  describe('基本待办事项工作流', () => {
    it('应该完成完整的待办事项生命周期', async () => {
      const { todos, addTodo, toggleTodo, removeTodo, initializeTodos } = useTodos()
      await initializeTodos()
      todos.value = []

      const success = await addTodo({ title: '学习 Vue 3' })
      expect(success).toBeTruthy()
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('学习 Vue 3')
      expect(todos.value[0].completed).toBe(false)

      const todoId = todos.value[0].id
      await toggleTodo(todoId)
      expect(todos.value[0].completed).toBe(true)

      await toggleTodo(todoId)
      expect(todos.value[0].completed).toBe(false)

      await removeTodo(todoId)
      expect(todos.value).toHaveLength(0)
    })

    it('应该处理多个待办事项', async () => {
      const { todos, addTodo, addMultipleTodos, initializeTodos } = useTodos()
      await initializeTodos()
      todos.value = []

      await addTodo({ title: '任务 1' })
      expect(todos.value).toHaveLength(1)

      const newTodos = [{ title: '任务 2' }, { title: '任务 3' }, { title: '任务 4' }]
      const duplicates = await addMultipleTodos(newTodos)

      expect(duplicates).toHaveLength(0)
      expect(todos.value).toHaveLength(4)
    })

    it('应该防止重复的待办事项', async () => {
      // 清理状态
      localStorage.clear()
      const { todos, addTodo, initializeTodos } = useTodos()
      await initializeTodos()
      todos.value = []

      const success1 = await addTodo({ title: '重复任务' })
      expect(success1).toBeTruthy()
      expect(todos.value).toHaveLength(1)

      const success2 = await addTodo({ title: '重复任务' })
      expect(success2).toBe(null)
      expect(todos.value).toHaveLength(1)
    })
  })

  describe('待办事项筛选和搜索', () => {
    it('应该正确筛选待办事项', async () => {
      // 使用同一个 composable 实例来确保状态共享
      const todoManagement = useTodoManagement()
      const { handleAddTodo, toggleTodo } = todoManagement
      const { filter, filteredTodos } = todoManagement

      // 获取 todos 引用
      const { todos, initializeTodos } = useTodos()

      // 初始化存储服务
      await initializeTodos()

      // 清空现有的 todos
      todos.value = []

      // 使用 handleAddTodo 而不是直接的 addTodo
      await handleAddTodo('未完成任务 1')
      await handleAddTodo('未完成任务 2')
      await handleAddTodo('待完成任务')

      // 确保有3个任务
      expect(todos.value).toHaveLength(3)

      // 完成第三个任务
      await toggleTodo(todos.value[2].id)

      // 等待响应式更新
      await new Promise((resolve) => setTimeout(resolve, 50))

      filter.value = 'all'
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(filteredTodos.value).toHaveLength(3)

      filter.value = 'active'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(filteredTodos.value).toHaveLength(2)

      filter.value = 'completed'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(filteredTodos.value).toHaveLength(1)
    })

    it('应该正确搜索待办事项', async () => {
      // 使用同一个 composable 实例来确保状态共享
      const todoManagement = useTodoManagement()
      const { handleAddTodo } = todoManagement
      const { searchQuery, filteredTodos, filter } = todoManagement

      // 获取 todos 引用
      const { todos, initializeTodos } = useTodos()

      // 初始化存储服务
      await initializeTodos()

      // 清空现有的 todos
      todos.value = []

      // 使用 handleAddTodo 而不是直接的 addTodo
      await handleAddTodo('学习 Vue 3')
      await handleAddTodo('学习 React')
      await handleAddTodo('写文档')

      // 确保有3个任务
      expect(todos.value).toHaveLength(3)

      // 设置为显示所有任务
      filter.value = 'all'
      await new Promise((resolve) => setTimeout(resolve, 50))

      searchQuery.value = 'Vue'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(filteredTodos.value).toHaveLength(1)
      expect(filteredTodos.value[0].title).toContain('Vue')

      searchQuery.value = '学习'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(filteredTodos.value).toHaveLength(2)

      searchQuery.value = ''
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(filteredTodos.value).toHaveLength(3)
    })
  })

  describe('AI 辅助功能', () => {
    it('应该生成和确认建议的待办事项', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockResolvedValue('1. 学习 TypeScript\n2. 编写单元测试\n3. 优化性能')

      const { todos, initializeTodos } = useTodos()
      const { generateSuggestedTodos, confirmSuggestedTodos, suggestedTodos, showSuggestedTodos } =
        useTodoManagement()

      // 初始化存储服务
      await initializeTodos()

      // 清空现有的 todos
      todos.value = []

      // 设置 API Key 以避免错误
      testEnv.localStorage.setItem('deepseek_api_key', 'test-key')

      const initialTodoCount = todos.value.length

      await generateSuggestedTodos()

      // 等待异步操作完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(suggestedTodos.value.length).toBeGreaterThan(0)
      expect(showSuggestedTodos.value).toBe(true)

      confirmSuggestedTodos()

      // 等待异步操作完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(todos.value.length).toBeGreaterThan(initialTodoCount)
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toHaveLength(0)
    })

    it('应该取消建议的待办事项', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockResolvedValue('1. 任务 1\n2. 任务 2')

      const { todos, initializeTodos } = useTodos()
      const { generateSuggestedTodos, cancelSuggestedTodos, suggestedTodos, showSuggestedTodos } =
        useTodoManagement()

      // 初始化存储服务
      await initializeTodos()

      // 清空现有的 todos
      todos.value = []

      const initialTodoCount = todos.value.length

      await generateSuggestedTodos()
      expect(suggestedTodos.value.length).toBeGreaterThan(0)

      cancelSuggestedTodos()
      expect(todos.value).toHaveLength(initialTodoCount)
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toHaveLength(0)
    })
  })

  describe('数据持久化', () => {
    it('应该保存和加载待办事项', async () => {
      const { todos, addTodo, loadTodos, saveTodos, initializeTodos } = useTodos()

      // 初始化存储服务
      await initializeTodos()

      // 清空现有的 todos
      todos.value = []

      await addTodo({ title: '持久化测试' })
      expect(todos.value).toHaveLength(1)

      await saveTodos()

      todos.value = []
      await loadTodos()

      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('持久化测试')
    })

    it('应该处理无效的存储数据', async () => {
      testEnv.localStorage.store.todos = 'invalid json'

      const { todos, loadTodos, initializeTodos } = useTodos()

      // 初始化存储服务
      await initializeTodos()

      await loadTodos()

      expect(todos.value).toEqual([])
    })
  })

  describe('错误处理', () => {
    it('应该处理 AI 服务错误', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockRejectedValue(new Error('API 错误'))

      const { generateSuggestedTodos, isGenerating } = useTodoManagement()

      await generateSuggestedTodos()

      expect(isGenerating.value).toBe(false)
    })
  })
})
