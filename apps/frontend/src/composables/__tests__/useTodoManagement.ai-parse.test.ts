import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAIResponse } from '../../services/deepseekService'
import { useErrorHandler } from '../useErrorHandler'
import { useTodoManagement } from '../useTodoManagement'
import { useTodos } from '../useTodos'

// Mock依赖
vi.mock('../useTodos', () => ({
  useTodos: vi.fn(),
}))

vi.mock('../useErrorHandler', () => ({
  useErrorHandler: vi.fn(),
}))

vi.mock('../../services/deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, fallback: string) => fallback || key,
    }),
    createI18n: vi.fn(() => ({
      global: {
        t: (key: string) => key,
      },
    })),
  }
})

describe('useTodoManagement - AI Response Parsing', () => {
  let mockUseTodos: any
  let mockUseErrorHandler: any
  let mockGetAIResponse: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTodos = useTodos as any
    mockUseErrorHandler = useErrorHandler as any
    mockGetAIResponse = getAIResponse as any
  })

  it('应该正确解析标准格式的 AI 响应', async () => {
    // Mock localStorage 以提供 API key
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'deepseek_api_key') return 'test-api-key'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // 创建测试用的待办事项
    const testTodos = [
      {
        id: '1',
        title: '任务1',
        completed: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '任务2',
        completed: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: '任务3',
        completed: false,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Mock useTodos 返回测试数据
    const todosRef = { value: [...testTodos] }
    const mockUpdateTodosOrder = vi.fn().mockResolvedValue(true)

    mockUseTodos.mockReturnValue({
      todos: todosRef,
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn(),
      updateTodo: vi.fn(),
      updateTodoAIAnalysis: vi.fn(),
      batchUpdateTodos: vi.fn(),
      saveTodos: vi.fn().mockResolvedValue(true),
      updateTodosOrder: mockUpdateTodosOrder,
    })

    // Mock错误处理
    const mockShowSuccess = vi.fn()
    mockUseErrorHandler.mockReturnValue({
      showError: vi.fn(),
      showSuccess: mockShowSuccess,
      error: { value: '' },
    })

    // Mock AI 响应，返回标准格式：3,1,2
    mockGetAIResponse.mockResolvedValue('3,1,2')

    // 调用排序函数
    const { sortActiveTodosWithAI } = useTodoManagement()
    await sortActiveTodosWithAI()

    // 验证成功消息被显示
    expect(mockShowSuccess).toHaveBeenCalledWith('AI 优先级排序完成！')
  })

  it('应该正确解析包含额外文本的 AI 响应', async () => {
    // Mock localStorage 以提供 API key
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'deepseek_api_key') return 'test-api-key'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // 创建测试用的待办事项
    const testTodos = [
      {
        id: '1',
        title: '任务1',
        completed: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '任务2',
        completed: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Mock useTodos 返回测试数据
    const todosRef = { value: [...testTodos] }
    const mockUpdateTodosOrder = vi.fn().mockResolvedValue(true)

    mockUseTodos.mockReturnValue({
      todos: todosRef,
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn(),
      updateTodo: vi.fn(),
      updateTodoAIAnalysis: vi.fn(),
      batchUpdateTodos: vi.fn(),
      saveTodos: vi.fn().mockResolvedValue(true),
      updateTodosOrder: mockUpdateTodosOrder,
    })

    // Mock错误处理
    const mockShowSuccess = vi.fn()
    mockUseErrorHandler.mockReturnValue({
      showError: vi.fn(),
      showSuccess: mockShowSuccess,
      error: { value: '' },
    })

    // Mock AI 响应，返回包含额外文本的格式
    mockGetAIResponse.mockResolvedValue('这是排序结果：2,1')

    // 调用排序函数
    const { sortActiveTodosWithAI } = useTodoManagement()
    await sortActiveTodosWithAI()

    // 验证成功消息被显示
    expect(mockShowSuccess).toHaveBeenCalledWith('AI 优先级排序完成！')
  })

  it('应该正确解析使用中文逗号的 AI 响应', async () => {
    // Mock localStorage 以提供 API key
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'deepseek_api_key') return 'test-api-key'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // 创建测试用的待办事项
    const testTodos = [
      {
        id: '1',
        title: '任务1',
        completed: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '任务2',
        completed: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: '任务3',
        completed: false,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Mock useTodos 返回测试数据
    const todosRef = { value: [...testTodos] }
    const mockUpdateTodosOrder = vi.fn().mockResolvedValue(true)

    mockUseTodos.mockReturnValue({
      todos: todosRef,
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn(),
      updateTodo: vi.fn(),
      updateTodoAIAnalysis: vi.fn(),
      batchUpdateTodos: vi.fn(),
      saveTodos: vi.fn().mockResolvedValue(true),
      updateTodosOrder: mockUpdateTodosOrder,
    })

    // Mock错误处理
    const mockShowSuccess = vi.fn()
    mockUseErrorHandler.mockReturnValue({
      showError: vi.fn(),
      showSuccess: mockShowSuccess,
      error: { value: '' },
    })

    // Mock AI 响应，返回使用中文逗号的格式
    mockGetAIResponse.mockResolvedValue('3，1，2')

    // 调用排序函数
    const { sortActiveTodosWithAI } = useTodoManagement()
    await sortActiveTodosWithAI()

    // 验证成功消息被显示
    expect(mockShowSuccess).toHaveBeenCalledWith('AI 优先级排序完成！')
  })

  it('应该在 AI 响应格式不正确时显示错误', async () => {
    // Mock localStorage 以提供 API key
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'deepseek_api_key') return 'test-api-key'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // 创建测试用的待办事项
    const testTodos = [
      {
        id: '1',
        title: '任务1',
        completed: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '任务2',
        completed: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Mock useTodos 返回测试数据
    const todosRef = { value: [...testTodos] }
    mockUseTodos.mockReturnValue({
      todos: todosRef,
      addTodo: vi.fn(),
      toggleTodo: vi.fn(),
      removeTodo: vi.fn(),
      addMultipleTodos: vi.fn(),
      updateTodo: vi.fn(),
      updateTodoAIAnalysis: vi.fn(),
      batchUpdateTodos: vi.fn(),
      saveTodos: vi.fn(),
      updateTodosOrder: vi.fn().mockResolvedValue(true),
    })

    // Mock错误处理
    const mockShowError = vi.fn()
    mockUseErrorHandler.mockReturnValue({
      showError: mockShowError,
      showSuccess: vi.fn(),
      error: { value: '' },
    })

    // Mock AI 响应，返回无效的排序结果
    mockGetAIResponse.mockResolvedValue('无效的响应')

    // 调用排序函数
    const { sortActiveTodosWithAI } = useTodoManagement()
    await sortActiveTodosWithAI()

    // 验证显示了正确的错误消息
    expect(mockShowError).toHaveBeenCalledWith('AI 排序解析失败，请重试')
  })
})
