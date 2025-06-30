/**
 * 测试 Todo 删除问题修复
 */

import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import type { CreateTodoDto } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// 使用全局 mock，不需要重复定义

describe('Todo Delete Fix', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // 重置 todos 状态
    const { resetState } = useTodos()
    await resetState()
  })

  it('should delete todo successfully', async () => {
    const { todos, removeTodo, addTodo } = useTodos()

    // 先添加一个 Todo
    const addedTodo = await addTodo({ title: 'Test Todo' })
    expect(addedTodo).toBeTruthy()
    expect(todos.value).toHaveLength(1)

    // 删除 Todo
    const result = await removeTodo((addedTodo as Todo).id)

    expect(result).toBe(true)
    expect(todos.value).toHaveLength(0)
  })

  it('should handle delete failure gracefully', async () => {
    const { todos, removeTodo, addTodo } = useTodos()

    // 先添加一个 Todo
    const addedTodo = await addTodo({ title: 'Test Todo' })
    expect(addedTodo).toBeTruthy()
    expect(todos.value).toHaveLength(1)

    // 尝试删除不存在的 Todo
    const result = await removeTodo('non-existent-id')

    expect(result).toBe(false)
    expect(todos.value).toHaveLength(1) // Todo 仍然存在
  })

  it('should maintain reactivity after delete', async () => {
    const { todos, removeTodo, addTodo } = useTodos()
    const { filteredTodos } = useTodoManagement()

    // 添加多个 Todo
    const todo1 = await addTodo({ title: 'Test Todo 1' })
    const todo2 = await addTodo({ title: 'Test Todo 2' })

    expect(todo1).toBeTruthy()
    expect(todo2).toBeTruthy()
    expect(todos.value).toHaveLength(2)
    expect(filteredTodos.value).toHaveLength(2)

    // 删除第一个 Todo
    const result = await removeTodo((todo1 as Todo).id)

    // 等待响应式更新
    await nextTick()
    await nextTick()

    expect(result).toBe(true)
    expect(todos.value).toHaveLength(1)
    expect(filteredTodos.value).toHaveLength(1)
    expect(todos.value[0].id).toBe((todo2 as Todo).id)
    expect(filteredTodos.value[0].id).toBe((todo2 as Todo).id)
  })

  it('should allow adding new todo after delete', async () => {
    const { todos, removeTodo, addTodo } = useTodos()

    // 先添加一个 Todo
    const firstTodo = await addTodo({ title: 'Test Todo' })
    expect(firstTodo).toBeTruthy()
    expect(todos.value).toHaveLength(1)

    // 删除 Todo
    const deleteResult = await removeTodo((firstTodo as Todo).id)
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
    const { todos, removeTodo } = useTodos()

    // 没有添加任何 Todo
    expect(todos.value).toHaveLength(0)

    // 尝试删除不存在的 Todo
    const result = await removeTodo('non-existent-id')

    expect(result).toBe(false)
    expect(todos.value).toHaveLength(0)
  })
})
