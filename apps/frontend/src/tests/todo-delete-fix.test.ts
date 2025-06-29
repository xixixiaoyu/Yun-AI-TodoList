/**
 * 测试 Todo 删除问题修复
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTodos } from '@/composables/useTodos'
import { useTodoManagement } from '@/composables/useTodoManagement'
import type { CreateTodoDto, Todo } from '@shared/types'

// Mock 存储服务
const mockCreateTodo = vi.fn()
const mockUpdateTodo = vi.fn()
const mockDeleteTodo = vi.fn()

vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    getCurrentStorageService: () => ({
      createTodo: mockCreateTodo,
      updateTodo: mockUpdateTodo,
      deleteTodo: mockDeleteTodo,
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
  }),
}))

// Mock data migration
vi.mock('@/composables/useDataMigration', () => ({
  useDataMigration: () => ({
    migrateData: vi.fn(),
  }),
}))

describe('Todo Delete Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 todos 状态
    const { todos } = useTodos()
    todos.value = []
  })

  it('should delete todo successfully', async () => {
    // 配置 mock 返回成功结果
    mockDeleteTodo.mockResolvedValue({
      success: true,
    })

    const { todos, removeTodo } = useTodos()

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
  })

  it('should handle delete failure gracefully', async () => {
    // 配置 mock 返回失败结果
    mockDeleteTodo.mockResolvedValue({
      success: false,
      error: 'storage.todoNotFound',
    })

    const { todos, removeTodo } = useTodos()

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

    // 尝试删除 Todo
    const result = await removeTodo('test-id')

    expect(result).toBe(false)
    expect(todos.value).toHaveLength(1) // Todo 应该仍然存在
    expect(mockDeleteTodo).toHaveBeenCalledWith('test-id')
  })

  it('should maintain reactivity after delete', async () => {
    // 配置 mock 返回成功结果
    mockDeleteTodo.mockResolvedValue({
      success: true,
    })

    const { todos, removeTodo } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 添加多个 Todo
    const testTodos: Todo[] = [
      {
        id: 'test-id-1',
        title: 'Test Todo 1',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
      {
        id: 'test-id-2',
        title: 'Test Todo 2',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
      },
    ]

    todos.value = testTodos
    expect(todos.value).toHaveLength(2)
    expect(filteredTodos.value).toHaveLength(2)

    // 删除第一个 Todo
    const result = await removeTodo('test-id-1')

    // 等待响应式更新
    await nextTick()
    await nextTick()

    expect(result).toBe(true)
    expect(todos.value).toHaveLength(1)
    expect(filteredTodos.value).toHaveLength(1)
    expect(todos.value[0].id).toBe('test-id-2')
    expect(filteredTodos.value[0].id).toBe('test-id-2')
  })

  it('should allow adding new todo after delete', async () => {
    // 配置删除 mock
    mockDeleteTodo.mockResolvedValue({
      success: true,
    })

    // 配置添加 mock
    mockCreateTodo.mockResolvedValue({
      success: true,
      data: {
        id: 'new-test-id',
        title: 'New Test Todo',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    })

    const { todos, removeTodo, addTodo } = useTodos()

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
    const deleteResult = await removeTodo('test-id')
    expect(deleteResult).toBe(true)
    expect(todos.value).toHaveLength(0)

    // 等待响应式更新
    await nextTick()

    // 添加新的 Todo
    const createDto: CreateTodoDto = {
      title: 'New Test Todo',
    }

    const addResult = await addTodo(createDto)

    expect(addResult).toBeTruthy()
    expect(addResult?.title).toBe('New Test Todo')
    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].title).toBe('New Test Todo')
  })

  it('should handle non-existent todo deletion', async () => {
    // 配置 mock 返回失败结果
    mockDeleteTodo.mockResolvedValue({
      success: false,
      error: 'storage.todoNotFound',
    })

    const { todos, removeTodo } = useTodos()

    // 没有添加任何 Todo
    expect(todos.value).toHaveLength(0)

    // 尝试删除不存在的 Todo
    const result = await removeTodo('non-existent-id')

    expect(result).toBe(false)
    expect(todos.value).toHaveLength(0)
    expect(mockDeleteTodo).toHaveBeenCalledWith('non-existent-id')
  })
})
