import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTodoManagement } from '../useTodoManagement'
import { setupTestEnvironment } from '@/test/helpers'

// Mock dependencies
const mockUseTodos = vi.fn()
const mockUseErrorHandler = vi.fn()
const mockDeepseekService = vi.fn()

vi.mock('@/composables/useTodos', () => ({
  useTodos: mockUseTodos
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: mockUseErrorHandler
}))

vi.mock('@/services/deepseekService', () => ({
  getAIResponse: mockDeepseekService,
  streamAIResponse: mockDeepseekService
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}))

describe('useTodoManagement', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // Setup default mocks
    mockUseTodos.mockReturnValue({
      todos: { value: [] },
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn().mockReturnValue([])
    })

    mockUseErrorHandler.mockReturnValue({
      showError: vi.fn()
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
        isLoading
      } = useTodoManagement()

      expect(filter.value).toBe('all')
      expect(searchQuery.value).toBe('')
      expect(isGenerating.value).toBe(false)
      expect(isSorting.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
      expect(showSuggestedTodos.value).toBe(false)
      expect(duplicateError.value).toBe('')
      expect(isLoading.value).toBe(false)
    })

    it('应该正确处理添加待办事项', () => {
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: vi.fn().mockReturnValue(true),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn()
      })

      const { handleAddTodo } = useTodoManagement()
      const result = handleAddTodo('新的待办事项')

      expect(result).toBe(true)
    })

    it('应该正确处理切换待办事项状态', () => {
      mockUseTodos.mockReturnValue({
        todos: { value: [] },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn()
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
        addMultipleTodos: vi.fn()
      })

      const { removeTodo } = useTodoManagement()
      removeTodo(1)

      expect(mockUseTodos().removeTodo).toHaveBeenCalledWith(1)
    })
  })

  describe('AI 功能', () => {
    it('应该生成建议的待办事项', async () => {
      mockDeepseekService.mockResolvedValue('1. 学习 Vue\n2. 写测试\n3. 部署应用')

      const { generateSuggestedTodos, suggestedTodos, isGenerating } = useTodoManagement()

      const promise = generateSuggestedTodos()
      expect(isGenerating.value).toBe(true)

      await promise

      expect(isGenerating.value).toBe(false)
      expect(suggestedTodos.value.length).toBeGreaterThan(0)
    })

    it('应该处理 AI 生成失败', async () => {
      mockDeepseekService.mockRejectedValue(new Error('API 错误'))
      mockUseErrorHandler.mockReturnValue({
        showError: vi.fn()
      })

      const { generateSuggestedTodos, isGenerating } = useTodoManagement()

      await generateSuggestedTodos()

      expect(isGenerating.value).toBe(false)
      expect(mockUseErrorHandler().showError).toHaveBeenCalled()
    })

    it('应该排序活跃的待办事项', async () => {
      mockUseTodos.mockReturnValue({
        todos: {
          value: [
            { id: 1, text: '任务1', completed: false },
            { id: 2, text: '任务2', completed: false }
          ]
        },
        addTodo: vi.fn(),
        toggleTodo: vi.fn(),
        removeTodo: vi.fn(),
        addMultipleTodos: vi.fn(),
        updateTodosOrder: vi.fn()
      })

      mockDeepseekService.mockResolvedValue('排序后的任务列表')

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
        addMultipleTodos: vi.fn().mockReturnValue([])
      })

      const { suggestedTodos, showSuggestedTodos, confirmSuggestedTodos } = useTodoManagement()

      suggestedTodos.value = [
        { text: '测试任务1', tags: [] },
        { text: '测试任务2', tags: [] }
      ]
      showSuggestedTodos.value = true

      confirmSuggestedTodos()

      expect(mockUseTodos().addMultipleTodos).toHaveBeenCalledWith(suggestedTodos.value)
      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
    })

    it('应该取消建议的待办事项', () => {
      const { suggestedTodos, showSuggestedTodos, cancelSuggestedTodos } = useTodoManagement()

      suggestedTodos.value = [{ text: '测试任务', tags: [] }]
      showSuggestedTodos.value = true

      cancelSuggestedTodos()

      expect(showSuggestedTodos.value).toBe(false)
      expect(suggestedTodos.value).toEqual([])
    })

    it('应该更新建议的待办事项', () => {
      const { suggestedTodos, updateSuggestedTodo } = useTodoManagement()

      suggestedTodos.value = [
        { text: '原始任务', tags: [] },
        { text: '另一个任务', tags: [] }
      ]

      updateSuggestedTodo(0, '更新后的任务')

      expect(suggestedTodos.value[0].text).toBe('更新后的任务')
    })
  })
})
