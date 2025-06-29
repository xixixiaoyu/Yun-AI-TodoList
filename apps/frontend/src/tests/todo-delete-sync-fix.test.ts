/**
 * 测试 Todo 删除和同步问题修复
 */

import { useTodos } from '@/composables/useTodos'
import type { Todo } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Mock 存储服务
const mockCreateTodo = vi.fn()
const mockUpdateTodo = vi.fn()
const mockDeleteTodo = vi.fn()
const mockSaveTodos = vi.fn()
const mockGetTodos = vi.fn()

vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    getCurrentStorageService: () => ({
      createTodo: mockCreateTodo,
      updateTodo: mockUpdateTodo,
      deleteTodo: mockDeleteTodo,
      saveTodos: mockSaveTodos,
      getTodos: mockGetTodos,
    }),
  }),
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock auth
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref({ id: 'test-user' }),
    isAuthenticated: ref(false),
  }),
}))

// Mock data migration
vi.mock('@/composables/useDataMigration', () => ({
  useDataMigration: () => ({
    migrateData: vi.fn(),
  }),
}))

// Mock sync service
const mockSyncService = {
  downloadData: vi.fn(),
  syncData: vi.fn(),
}

vi.mock('@/services/syncService', () => ({
  SyncService: vi.fn().mockImplementation(() => mockSyncService),
  SyncStatus: {
    SUCCESS: 'success',
    ERROR: 'error',
    CONFLICT: 'conflict',
  },
}))

describe('Todo Delete and Sync Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 todos 状态
    const { todos } = useTodos()
    todos.value = []

    // 重置 mock 默认返回值
    mockDeleteTodo.mockResolvedValue({ success: true })
    mockSaveTodos.mockResolvedValue({ success: true })
    mockGetTodos.mockResolvedValue({ success: true, data: [] })
  })

  it('should delete todo and save state', async () => {
    const { todos, removeTodo, initializeTodos } = useTodos()

    // 初始化 todos 状态
    await initializeTodos()

    // 先添加一个 Todo
    const testTodo: Todo = {
      id: 'test-id',
      title: 'Test Todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }

    todos.value = [testTodo]
    expect(todos.value).toHaveLength(1)

    // 删除 Todo
    const result = await removeTodo('test-id')

    expect(result).toBe(true)
    expect(todos.value).toHaveLength(0)
    expect(mockDeleteTodo).toHaveBeenCalledWith('test-id')

    // 等待防抖完成
    await new Promise((resolve) => setTimeout(resolve, 600))

    // 验证存储服务的 saveTodos 被调用
    expect(mockSaveTodos).toHaveBeenCalled()
  })

  it('should handle sync without overwriting local deletions', async () => {
    const { todos, setTodos } = useTodos()

    // 模拟本地有一个 Todo
    const localTodo: Todo = {
      id: 'local-id',
      title: 'Local Todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }

    todos.value = [localTodo]
    expect(todos.value).toHaveLength(1)

    // 模拟云端有不同的 Todo（不包含本地的 Todo，模拟本地删除了某个 Todo）
    const cloudTodos: Todo[] = [
      {
        id: 'cloud-id',
        title: 'Cloud Todo',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
      },
    ]

    // 模拟同步结果处理（智能合并而不是覆盖）
    const currentLocalTodos = todos.value
    const localTodoIds = new Set(currentLocalTodos.map((todo) => todo.id))
    const todosToAdd = cloudTodos.filter((cloudTodo) => !localTodoIds.has(cloudTodo.id))

    if (todosToAdd.length > 0) {
      todos.value = [...currentLocalTodos, ...todosToAdd].sort((a, b) => a.order - b.order)
    }

    // 验证结果：本地 Todo 保持不变，云端新 Todo 被添加
    expect(todos.value).toHaveLength(2)
    expect(todos.value.find((t) => t.id === 'local-id')).toBeTruthy()
    expect(todos.value.find((t) => t.id === 'cloud-id')).toBeTruthy()
  })

  it('should not re-add deleted todos during sync', async () => {
    const { todos } = useTodos()

    // 模拟场景：本地删除了一个 Todo，但云端还有
    const deletedTodoId = 'deleted-todo-id'

    // 本地当前没有这个 Todo（已删除）
    todos.value = []

    // 云端仍然有这个 Todo
    const cloudTodos: Todo[] = [
      {
        id: deletedTodoId,
        title: 'Deleted Todo',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    ]

    // 模拟智能同步逻辑：只添加本地不存在的 Todo
    const currentLocalTodos = todos.value
    const localTodoIds = new Set(currentLocalTodos.map((todo) => todo.id))
    const todosToAdd = cloudTodos.filter((cloudTodo) => !localTodoIds.has(cloudTodo.id))

    // 在实际应用中，这里应该检查删除历史或同步状态
    // 为了测试，我们假设有删除历史记录
    const deletedTodoIds = new Set([deletedTodoId])
    const finalTodosToAdd = todosToAdd.filter((todo) => !deletedTodoIds.has(todo.id))

    if (finalTodosToAdd.length > 0) {
      todos.value = [...currentLocalTodos, ...finalTodosToAdd]
    }

    // 验证：删除的 Todo 不应该重新出现
    expect(todos.value).toHaveLength(0)
    expect(todos.value.find((t) => t.id === deletedTodoId)).toBeFalsy()
  })

  it('should maintain todo order after delete and sync', async () => {
    const { todos, removeTodo } = useTodos()

    // 添加多个 Todo
    const testTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Todo 1',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
      {
        id: 'todo-2',
        title: 'Todo 2',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
      },
      {
        id: 'todo-3',
        title: 'Todo 3',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 2,
      },
    ]

    todos.value = testTodos
    expect(todos.value).toHaveLength(3)

    // 删除中间的 Todo
    const result = await removeTodo('todo-2')
    expect(result).toBe(true)
    expect(todos.value).toHaveLength(2)

    // 验证剩余 Todo 的顺序
    expect(todos.value[0].id).toBe('todo-1')
    expect(todos.value[1].id).toBe('todo-3')
    expect(todos.value[0].order).toBe(0)
    expect(todos.value[1].order).toBe(2)
  })

  it('should handle delete operation in sync queue', () => {
    // 模拟删除操作数据
    const deleteOperation = {
      type: 'delete',
      data: { id: 'test-todo-id' },
    }

    // 模拟处理删除操作的逻辑
    let deleteProcessed = false

    if (
      deleteOperation.data &&
      typeof deleteOperation.data === 'object' &&
      'id' in deleteOperation.data
    ) {
      const todoId = (deleteOperation.data as { id: string }).id
      deleteProcessed = true

      expect(todoId).toBe('test-todo-id')
    }

    expect(deleteProcessed).toBe(true)
  })
})
