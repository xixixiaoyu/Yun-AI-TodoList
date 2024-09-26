import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTodos } from '../useTodos'

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('adds a new todo', () => {
    const { todos, addTodo } = useTodos()
    addTodo('New Todo')
    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].text).toBe('New Todo')
  })

  it('toggles a todo', () => {
    const { todos, addTodo, toggleTodo } = useTodos()
    addTodo('Test Todo')
    const id = todos.value[0].id
    toggleTodo(id)
    expect(todos.value[0].completed).toBe(true)
  })

  it('removes a todo', () => {
    const { todos, addTodo, removeTodo } = useTodos()
    addTodo('Test Todo')
    const id = todos.value[0].id
    removeTodo(id)
    expect(todos.value).toHaveLength(0)
  })

  it('clears active todos', () => {
    const { todos, addTodo, clearActiveTodos } = useTodos()
    addTodo('Active Todo')
    addTodo('Completed Todo')
    todos.value[1].completed = true
    clearActiveTodos()
    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].text).toBe('Completed Todo')
  })

  it('restores history', () => {
    const { todos, addTodo, history, restoreHistory } = useTodos()

    // 设置一个固定的日期
    const fixedDate = new Date('2023-01-01T00:00:00.000Z')
    vi.setSystemTime(fixedDate)

    addTodo('Old Todo')

    // 模拟时间前进一天
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)

    addTodo('New Todo')

    expect(todos.value).toHaveLength(2)
    expect(history.value).toHaveLength(2)

    // 恢复到前一天的历史
    restoreHistory('2023-01-01')

    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].text).toBe('Old Todo')
    expect(history.value).toHaveLength(2) // 历史记录长度应该保持不变
  })
})
