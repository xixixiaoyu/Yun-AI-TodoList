import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/composables/useTodos', () => ({
  useTodos: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(),
}))

vi.mock('@/services/deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
  createI18n: vi.fn(() => ({
    global: {
      t: (key: string) => key,
    },
  })),
}))

import { useTodoManagement } from '../useTodoManagement'

describe('useTodoManagement', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>
  let mockUseTodos: any
  let mockUseErrorHandler: any
  let mockGetAIResponse: any

  beforeEach(async () => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    const { useTodos } = await import('@/composables/useTodos')
    const { useErrorHandler } = await import('@/composables/useErrorHandler')
    const { getAIResponse } = await import('@/services/deepseekService')

    mockUseTodos = useTodos as any
    mockUseErrorHandler = useErrorHandler as any
    mockGetAIResponse = getAIResponse as any

    mockUseTodos.mockReturnValue({
      todos: { value: [] },
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn().mockReturnValue([]),
    })

    mockUseErrorHandler.mockReturnValue({
      showError: vi.fn(),
      error: { value: '' },
    })
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('基础功能', () => {
    it('应该初始化默认状态', () => {
      const {
        filter,
        searchQuery,
        isGenerating,
        isSorting,
        suggestedTodos,
        showSuggestedTodos,
        duplicateError,
        isLoading,
      } = useTodoManagement()

      expect(filter.value).toBe('active')
      expect(searchQuery.value).toBe('')
      expect(isGenerating.value).toBe(false)
      expect(isSorting.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
      expect(showSuggestedTodos.value).toBe(false)
      expect(duplicateError.value).toBe('')
      expect(isLoading.value).toBe(false)
    })

    it('应该正确处理添加待办事项', () => {
      const mockAddTodo = vi.fn().mockReturnValue(true)
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: mockAddTodo,
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn(),
      })

      const { handleAddTodo } = useTodoManagement()
      handleAddTodo('新的待办事项')

      expect(mockAddTodo).toHaveBeenCalledWith({ title: '新的待办事项' })
    })

    it('应该正确处理切换待办事项状态', () => {
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn(),
      })

      const { toggleTodo } = useTodoManagement()
      toggleTodo(1)

      expect(mockUseTodos().toggleTodo).toHaveBeenCalledWith(1)
    })

    it('应该正确处理删除待办事项', () => {
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn(),
      })

      const { removeTodo } = useTodoManagement()
      removeTodo(1)

      expect(mockUseTodos().removeTodo).toHaveBeenCalledWith(1)
    })
  })

  describe('AI 功能', () => {
    it('应该生成建议的待办事项', async () => {
      mockGetAIResponse.mockResolvedValue(
        '1. 学习 Vue 3\n2. 编写单元测试\n3. 部署应用\n4. 代码重构\n5. 文档更新'
      )

      const { generateSuggestedTodosWithDomain, suggestedTodos, isGenerating } = useTodoManagement()

      const promise = generateSuggestedTodosWithDomain('work')
      expect(isGenerating.value).toBe(true)

      await promise

      expect(isGenerating.value).toBe(false)
      expect(suggestedTodos.value.length).toBe(5)
      expect(suggestedTodos.value[0]).toBe('学习 Vue 3')
      expect(suggestedTodos.value[1]).toBe('编写单元测试')
    })

    it('应该处理逗号分隔的建议格式', async () => {
      mockGetAIResponse.mockResolvedValue('学习 Vue,写测试,部署应用')

      const { generateSuggestedTodosWithDomain, suggestedTodos } = useTodoManagement()

      await generateSuggestedTodosWithDomain('study')

      expect(suggestedTodos.value.length).toBe(3)
      expect(suggestedTodos.value[0]).toBe('学习 Vue')
      expect(suggestedTodos.value[1]).toBe('写测试')
    })

    it('应该处理 AI 生成失败', async () => {
      mockGetAIResponse.mockRejectedValue(new Error('API 错误'))
      const mockShowError = vi.fn()
      mockUseErrorHandler.mockReturnValue({
        showError: mockShowError,
      })

      const { generateSuggestedTodosWithDomain, isGenerating } = useTodoManagement()

      await generateSuggestedTodosWithDomain('work')

      expect(isGenerating.value).toBe(false)
      expect(mockShowError).toHaveBeenCalled()
    })

    it('应该排序活跃的待办事项', async () => {
      // Mock localStorage to have API key
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue('test-api-key'),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      })

      mockUseTodos.mockReturnValue({
        todos: {
          value: [
            { id: 1, text: '任务1', completed: false, order: 0 },
            { id: 2, text: '任务2', completed: false, order: 1 },
          ],
        },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn(),
        saveTodos: vi.fn(),
      })

      mockGetAIResponse.mockResolvedValue('2,1')

      const { sortActiveTodosWithAI, isSorting } = useTodoManagement()

      const promise = sortActiveTodosWithAI()
      expect(isSorting.value).toBe(true)

      await promise

      expect(isSorting.value).toBe(false)
    })
  })

  describe('建议待办事项管理', () => {
    it('应该确认建议的待办事项', () => {
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn().mockReturnValue([]),
      })

      const { suggestedTodos, showSuggestedTodos, confirmSuggestedTodos } = useTodoManagement()

      suggestedTodos.value = ['测试任务1', '测试任务2']
      showSuggestedTodos.value = true

      confirmSuggestedTodos()

      expect(mockUseTodos().addMultipleTodos).toHaveBeenCalledWith([
        { title: '测试任务1' },
        { title: '测试任务2' },
      ])
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
    })

    it('应该取消建议的待办事项', () => {
      const { suggestedTodos, showSuggestedTodos, cancelSuggestedTodos } = useTodoManagement()

      suggestedTodos.value = ['测试任务']
      showSuggestedTodos.value = true

      cancelSuggestedTodos()

      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
    })

    it('应该更新建议的待办事项', () => {
      const { suggestedTodos, updateSuggestedTodo } = useTodoManagement()

      suggestedTodos.value = ['原始任务', '另一个任务']

      updateSuggestedTodo(0, '更新后的任务')

      expect(suggestedTodos.value[0]).toBe('更新后的任务')
    })
  })
})
