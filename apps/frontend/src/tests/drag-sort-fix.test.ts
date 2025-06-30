/**
 * 拖拽排序功能修复测试
 * 验证拖拽后 Todo 的 order 字段是否正确保存到数据库
 */

import type { Todo } from '@shared/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

// Mock 数据
const mockTodos = ref<Todo[]>([])
let mockStorageService: any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock storage service
beforeEach(() => {
  mockStorageService = {
    reorderTodos: vi.fn().mockResolvedValue({ success: true }),
    createTodo: vi.fn(),
    getTodos: vi.fn().mockResolvedValue({ success: true, data: [] }),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    saveTodos: vi.fn().mockResolvedValue({ success: true }),
  }
})

// Mock useStorageMode
vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    getCurrentStorageService: () => mockStorageService,
    initializeStorageMode: vi.fn().mockResolvedValue(undefined),
    isInitialized: ref(true),
    currentMode: ref('local'),
    config: ref({
      mode: 'local',
      autoSync: true,
      syncInterval: 5,
      offlineMode: true,
      conflictResolution: 'merge',
    }),
  }),
}))

describe('拖拽排序功能修复测试', () => {
  let useTodos: any

  beforeEach(async () => {
    // 重置 mock 状态
    mockTodos.value = []
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('[]')

    // 动态导入 useTodos
    const { useTodos: importedUseTodos } = await import('../composables/useTodos')
    useTodos = importedUseTodos()
  })

  afterEach(() => {
    mockTodos.value = []
    vi.clearAllMocks()
  })

  it('应该正确调用存储服务的 reorderTodos 方法', async () => {
    // 创建测试数据
    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-2',
        title: 'Todo 2',
        completed: false,
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-3',
        title: 'Todo 3',
        completed: false,
        order: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    // 设置初始状态
    useTodos.todos.value = testTodos

    // 模拟拖拽重排序：将第三个 Todo 移到第一位
    const reorderedTodos: Todo[] = [
      { ...testTodos[2], order: 0 }, // todo-3 移到第一位
      { ...testTodos[0], order: 1 }, // todo-1 移到第二位
      { ...testTodos[1], order: 2 }, // todo-2 移到第三位
    ]

    // 调用拖拽排序函数
    const result = await useTodos.updateTodosOrderByArray(reorderedTodos)

    // 验证结果
    expect(result).toBe(true)

    // 验证存储服务被正确调用
    expect(mockStorageService.reorderTodos).toHaveBeenCalledWith([
      { id: 'todo-3', order: 0 },
      { id: 'todo-1', order: 1 },
      { id: 'todo-2', order: 2 },
    ])

    // 验证调用次数
    expect(mockStorageService.reorderTodos).toHaveBeenCalledTimes(1)
  })

  it('应该正确处理数据格式转换', async () => {
    const testTodos: Todo[] = [
      {
        id: 'todo-a',
        title: 'Todo A',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-b',
        title: 'Todo B',
        completed: false,
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    useTodos.todos.value = testTodos

    // 模拟拖拽重排序
    const reorderedTodos: Todo[] = [
      { ...testTodos[1], order: 0 }, // todo-b 移到第一位
      { ...testTodos[0], order: 1 }, // todo-a 移到第二位
    ]

    await useTodos.updateTodosOrderByArray(reorderedTodos)

    // 验证传递给存储服务的数据格式
    const expectedReorders = [
      { id: 'todo-b', order: 0 },
      { id: 'todo-a', order: 1 },
    ]

    expect(mockStorageService.reorderTodos).toHaveBeenCalledWith(expectedReorders)
  })

  it('应该在存储服务失败时返回 false', async () => {
    // 模拟存储服务失败
    mockStorageService.reorderTodos.mockResolvedValue({ success: false, error: 'Storage error' })

    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    useTodos.todos.value = testTodos

    const result = await useTodos.updateTodosOrderByArray(testTodos)

    expect(result).toBe(false)
  })

  it('应该验证 Todo 数组的完整性', async () => {
    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-2',
        title: 'Todo 2',
        completed: false,
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    useTodos.todos.value = testTodos

    // 测试长度不匹配的情况
    const invalidTodos = [testTodos[0]] // 只有一个 Todo，长度不匹配

    const result = await useTodos.updateTodosOrderByArray(invalidTodos)

    expect(result).toBe(false)
    expect(mockStorageService.reorderTodos).not.toHaveBeenCalled()
  })

  it('应该验证 Todo ID 的一致性', async () => {
    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-2',
        title: 'Todo 2',
        completed: false,
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    useTodos.todos.value = testTodos

    // 测试 ID 不匹配的情况
    const invalidTodos: Todo[] = [
      { ...testTodos[0] },
      { ...testTodos[1], id: 'todo-3' }, // 不同的 ID
    ]

    const result = await useTodos.updateTodosOrderByArray(invalidTodos)

    expect(result).toBe(false)
    expect(mockStorageService.reorderTodos).not.toHaveBeenCalled()
  })

  it('应该更新本地 todos 状态', async () => {
    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        order: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'todo-2',
        title: 'Todo 2',
        completed: false,
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ]

    useTodos.todos.value = testTodos

    // 模拟拖拽重排序
    const reorderedTodos: Todo[] = [
      { ...testTodos[1], order: 0 },
      { ...testTodos[0], order: 1 },
    ]

    await useTodos.updateTodosOrderByArray(reorderedTodos)

    await nextTick()

    // 验证本地状态已更新
    expect(useTodos.todos.value[0].id).toBe('todo-2')
    expect(useTodos.todos.value[0].order).toBe(0)
    expect(useTodos.todos.value[1].id).toBe('todo-1')
    expect(useTodos.todos.value[1].order).toBe(1)
  })
})
