/**
 * 测试 Todo 添加后标题显示为空的问题修复
 */

import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import type { CreateTodoDto, Todo } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// 使用全局 mock，不需要重复定义

describe('Todo Add Fix', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // 重置 todos 状态
    const { resetState } = useTodos()
    await resetState()
  })

  it('should add todo with valid title', async () => {
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
    const { addTodo, todos } = useTodos()

    const createDto: CreateTodoDto = {
      title: '',
    }

    const result = await addTodo(createDto)

    expect(result).toBeNull()
    expect(todos.value).toHaveLength(0)
  })

  it('should filter out todos with empty titles in filteredTodos', async () => {
    const { todos, addTodo } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 确保初始状态为空
    expect(todos.value).toHaveLength(0)
    expect(filteredTodos.value).toHaveLength(0)

    // 先添加一个有效的 Todo
    await addTodo({ title: 'Valid Todo' })

    // 然后手动添加一个无效的 Todo（绕过验证）
    const invalidTodo: Todo = {
      id: 'invalid-id',
      title: '', // 空标题
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
    }

    // 直接推入数组（模拟数据损坏情况）
    todos.value.push(invalidTodo)

    await nextTick()

    // 验证原始数组包含两个项目
    expect(todos.value).toHaveLength(2)

    // filteredTodos 应该只包含有效的 Todo
    expect(filteredTodos.value).toHaveLength(1)
    expect(filteredTodos.value[0].title).toBe('Valid Todo')
  })

  it('should handle todos with undefined title gracefully', async () => {
    const { todos, addTodo } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 确保初始状态为空
    expect(todos.value).toHaveLength(0)
    expect(filteredTodos.value).toHaveLength(0)

    // 先添加一个有效的 Todo
    await addTodo({ title: 'Valid Todo' })

    // 然后手动添加一个损坏的 Todo（绕过验证）
    const corruptedTodo = {
      id: 'corrupted-id',
      title: undefined as any,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }

    // 直接推入数组（模拟数据损坏情况）
    todos.value.push(corruptedTodo)

    await nextTick()

    // 验证原始数组包含两个项目
    expect(todos.value).toHaveLength(2)

    // filteredTodos 应该只包含有效的 Todo，过滤掉损坏的数据
    expect(filteredTodos.value).toHaveLength(1)
    expect(filteredTodos.value[0].title).toBe('Valid Todo')
  })

  it('should maintain reactivity after adding todo', async () => {
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
