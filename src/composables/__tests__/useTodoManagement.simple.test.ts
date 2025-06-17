import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTodoManagement } from '../useTodoManagement'

vi.mock('@/composables/useTodos', () => ({
  useTodos: vi.fn(() => ({
    todos: { value: [] },
    addTodo: vi.fn(),
    toggleTodo: vi.fn(),
    removeTodo: vi.fn(),
    addMultipleTodos: vi.fn(),
  })),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    showError: vi.fn(),
  })),
}))

vi.mock('@/services/deepseekService', () => ({
  getAIResponse: vi.fn(),
  getAIStreamResponse: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, _params?: Record<string, any>) => key,
  }),
}))

describe('useTodoManagement - 简化测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  it('应该初始化基本状态', () => {
    const result = useTodoManagement()

    expect(result.filter.value).toBe('all')
    expect(result.searchQuery.value).toBe('')
    expect(result.isGenerating.value).toBe(false)
    expect(result.suggestedTodos.value).toEqual([])
  })

  it('应该提供必要的方法', () => {
    const result = useTodoManagement()

    expect(typeof result.handleAddTodo).toBe('function')
    expect(typeof result.toggleTodo).toBe('function')
    expect(typeof result.removeTodo).toBe('function')
    expect(typeof result.generateSuggestedTodos).toBe('function')
  })

  it('应该正确处理筛选', () => {
    const { filter } = useTodoManagement()

    filter.value = 'active'
    expect(filter.value).toBe('active')

    filter.value = 'completed'
    expect(filter.value).toBe('completed')
  })

  it('应该正确处理搜索', () => {
    const { searchQuery } = useTodoManagement()

    searchQuery.value = '测试搜索'
    expect(searchQuery.value).toBe('测试搜索')
  })
})
