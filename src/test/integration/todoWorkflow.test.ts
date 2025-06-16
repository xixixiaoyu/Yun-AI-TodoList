import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

// Mock dependencies
vi.mock('@/services/deepseekService', () => ({
  getAIResponse: vi.fn(),
  streamAIResponse: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    showError: vi.fn(),
  })),
}))

const _i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      addTodo: '添加待办事项',
      todoAdded: '待办事项已添加',
      todoCompleted: '待办事项已完成',
      todoDeleted: '待办事项已删除',
    },
  },
})

describe('待办事项工作流集成测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('基本待办事项工作流', () => {
    it('应该完成完整的待办事项生命周期', () => {
      const { todos, addTodo, toggleTodo, removeTodo } = useTodos()

      // 1. 添加待办事项
      const success = addTodo('学习 Vue 3')
      expect(success).toBe(true)
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].text).toBe('学习 Vue 3')
      expect(todos.value[0].completed).toBe(false)

      // 2. 完成待办事项
      const todoId = todos.value[0].id
      toggleTodo(todoId)
      expect(todos.value[0].completed).toBe(true)

      // 3. 取消完成
      toggleTodo(todoId)
      expect(todos.value[0].completed).toBe(false)

      // 4. 删除待办事项
      removeTodo(todoId)
      expect(todos.value).toHaveLength(0)
    })

    it('应该处理多个待办事项', () => {
      const { todos, addTodo, addMultipleTodos } = useTodos()

      // 添加单个待办事项
      addTodo('任务 1')
      expect(todos.value).toHaveLength(1)

      // 批量添加待办事项
      const newTodos = [
        { text: '任务 2', tags: [] },
        { text: '任务 3', tags: [] },
        { text: '任务 4', tags: [] },
      ]
      const duplicates = addMultipleTodos(newTodos)

      expect(duplicates).toHaveLength(0)
      expect(todos.value).toHaveLength(4)
    })

    it('应该防止重复的待办事项', () => {
      const { todos, addTodo } = useTodos()

      // 添加第一个待办事项
      const success1 = addTodo('重复任务')
      expect(success1).toBe(true)
      expect(todos.value).toHaveLength(1)

      // 尝试添加重复的待办事项
      const success2 = addTodo('重复任务')
      expect(success2).toBe(false)
      expect(todos.value).toHaveLength(1)
    })
  })

  describe('待办事项筛选和搜索', () => {
    it('应该正确筛选待办事项', () => {
      const { todos, addTodo, toggleTodo } = useTodos()
      const { filter, filteredTodos } = useTodoManagement()

      // 添加测试数据
      addTodo('未完成任务 1')
      addTodo('未完成任务 2')
      addTodo('待完成任务')

      // 完成一个任务
      toggleTodo(todos.value[2].id)

      // 测试筛选
      filter.value = 'all'
      expect(filteredTodos.value).toHaveLength(3)

      filter.value = 'active'
      expect(filteredTodos.value).toHaveLength(2)

      filter.value = 'completed'
      expect(filteredTodos.value).toHaveLength(1)
    })

    it('应该正确搜索待办事项', () => {
      const { addTodo } = useTodos()
      const { searchQuery, filteredTodos } = useTodoManagement()

      // 添加测试数据
      addTodo('学习 Vue 3')
      addTodo('学习 React')
      addTodo('写文档')

      // 测试搜索
      searchQuery.value = 'Vue'
      expect(filteredTodos.value).toHaveLength(1)
      expect(filteredTodos.value[0].text).toContain('Vue')

      searchQuery.value = '学习'
      expect(filteredTodos.value).toHaveLength(2)

      searchQuery.value = ''
      expect(filteredTodos.value).toHaveLength(3)
    })
  })

  describe('AI 辅助功能', () => {
    it('应该生成和确认建议的待办事项', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockResolvedValue('1. 学习 TypeScript\n2. 编写单元测试\n3. 优化性能')

      const { todos } = useTodos()
      const { generateSuggestedTodos, confirmSuggestedTodos, suggestedTodos, showSuggestedTodos } =
        useTodoManagement()

      // 生成建议
      await generateSuggestedTodos()
      expect(suggestedTodos.value.length).toBeGreaterThan(0)
      expect(showSuggestedTodos.value).toBe(true)

      // 确认建议
      confirmSuggestedTodos()
      expect(todos.value.length).toBeGreaterThan(0)
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toHaveLength(0)
    })

    it('应该取消建议的待办事项', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockResolvedValue('1. 任务 1\n2. 任务 2')

      const { todos } = useTodos()
      const { generateSuggestedTodos, cancelSuggestedTodos, suggestedTodos, showSuggestedTodos } =
        useTodoManagement()

      // 生成建议
      await generateSuggestedTodos()
      expect(suggestedTodos.value.length).toBeGreaterThan(0)

      // 取消建议
      cancelSuggestedTodos()
      expect(todos.value).toHaveLength(0)
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toHaveLength(0)
    })
  })

  describe('数据持久化', () => {
    it('应该保存和加载待办事项', () => {
      const { todos, addTodo, loadTodos, saveTodos } = useTodos()

      // 添加待办事项
      addTodo('持久化测试')
      expect(todos.value).toHaveLength(1)

      // 保存数据
      saveTodos()

      // 清空并重新加载
      todos.value = []
      loadTodos()

      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].text).toBe('持久化测试')
    })

    it('应该处理无效的存储数据', () => {
      // 设置无效数据
      testEnv.localStorage.store.todos = 'invalid json'

      const { todos, loadTodos } = useTodos()
      loadTodos()

      // 应该回退到空数组
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
