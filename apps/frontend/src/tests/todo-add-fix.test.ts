/**
 * 测试 Todo 添加后标题显示为空的问题修复
 */

import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import type { CreateTodoDto, Todo } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

// Mock 存储服务
const mockCreateTodo = vi.fn()
const mockUpdateTodo = vi.fn()

vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    getCurrentStorageService: () => ({
      createTodo: mockCreateTodo,
      updateTodo: mockUpdateTodo,
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

describe('Todo Add Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 todos 状态
    const { todos } = useTodos()
    todos.value = []
  })

  it('should add todo with valid title', async () => {
    // 配置 mock 返回正确的数据
    mockCreateTodo.mockResolvedValue({
      success: true,
      data: {
        id: 'test-id',
        title: 'Test Todo Title',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    })

    const { addTodo, todos } = useTodos()

    const createDto: CreateTodoDto = {
      title: 'Test Todo Title',
    }

    const result = await addTodo(createDto)

    expect(result).toBeTruthy()
    expect(result?.title).toBe('Test Todo Title')
    expect(result?.title).not.toBe('')
    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].title).toBe('Test Todo Title')
  })

  it('should not add todo with empty title', async () => {
    // 配置 mock 返回失败结果
    mockCreateTodo.mockResolvedValue({
      success: false,
      error: 'storage.todoTitleEmpty',
    })

    const { addTodo, todos } = useTodos()

    const createDto: CreateTodoDto = {
      title: '',
    }

    const result = await addTodo(createDto)

    expect(result).toBeNull()
    expect(todos.value).toHaveLength(0)
  })

  it('should filter out todos with empty titles in filteredTodos', async () => {
    const { todos } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 手动添加一个有效的 Todo 和一个无效的 Todo
    const validTodo: Todo = {
      id: 'valid-id',
      title: 'Valid Todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }

    const invalidTodo: Todo = {
      id: 'invalid-id',
      title: '', // 空标题
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
    }

    todos.value = [validTodo, invalidTodo]

    await nextTick()

    // filteredTodos 应该只包含有效的 Todo
    expect(filteredTodos.value).toHaveLength(1)
    expect(filteredTodos.value[0].title).toBe('Valid Todo')
  })

  it('should handle todos with undefined title gracefully', async () => {
    const { todos } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 创建一个 title 为 undefined 的 Todo（模拟数据损坏情况）
    const corruptedTodo = {
      id: 'corrupted-id',
      title: undefined as any,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }

    const validTodo: Todo = {
      id: 'valid-id',
      title: 'Valid Todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
    }

    todos.value = [corruptedTodo, validTodo]

    await nextTick()

    // filteredTodos 应该只包含有效的 Todo，过滤掉损坏的数据
    expect(filteredTodos.value).toHaveLength(1)
    expect(filteredTodos.value[0].title).toBe('Valid Todo')
  })

  it('should maintain reactivity after adding todo', async () => {
    // 配置 mock 返回正确的数据
    mockCreateTodo.mockResolvedValue({
      success: true,
      data: {
        id: 'reactive-test-id',
        title: 'Reactive Test Todo',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    })

    const { addTodo, todos } = useTodos()
    const { filteredTodos } = useTodoManagement()

    expect(todos.value).toHaveLength(0)
    expect(filteredTodos.value).toHaveLength(0)

    const createDto: CreateTodoDto = {
      title: 'Reactive Test Todo',
    }

    const result = await addTodo(createDto)

    // 等待响应式更新
    await nextTick()
    await nextTick()

    expect(result).toBeTruthy()
    expect(todos.value).toHaveLength(1)
    expect(filteredTodos.value).toHaveLength(1)
    expect(filteredTodos.value[0].title).toBe('Reactive Test Todo')
  })
})
