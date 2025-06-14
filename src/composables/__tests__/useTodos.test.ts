import { beforeEach, describe, expect, it } from 'vitest'
import { useTodos } from '../useTodos'

describe('useTodos', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
  })

  it('should add a todo', () => {
    const { todos, addTodo } = useTodos()
    expect(todos.value.length).toBe(0)
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('Test todo')
  })

  it('should toggle a todo', () => {
    const { todos, addTodo, toggleTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value[0].completed).toBe(false)
    toggleTodo(todos.value[0].id)
    expect(todos.value[0].completed).toBe(true)
  })

  it('should remove a todo', () => {
    const { todos, addTodo, removeTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    removeTodo(todos.value[0].id)
    expect(todos.value.length).toBe(0)
  })

  it('should not add duplicate todos', () => {
    const { todos, addTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    const result = addTodo('Test todo')
    expect(result).toBe(false)
    expect(todos.value.length).toBe(1)
  })

  it('should add multiple todos', () => {
    const { todos, addMultipleTodos } = useTodos()
    const newTodos = [{ text: 'Todo 1' }, { text: 'Todo 2' }, { text: 'Todo 3' }]
    const duplicates = addMultipleTodos(newTodos)
    expect(todos.value.length).toBe(3)
    expect(duplicates.length).toBe(0)
  })

  it('should update todos order', () => {
    const { todos, addTodo, updateTodosOrder } = useTodos()
    addTodo('Todo 1')
    addTodo('Todo 2')
    addTodo('Todo 3')

    // 获取 todo 的 ID
    const todoIds = todos.value.map((todo) => todo.id)

    // 重新排序：第三个、第一个、第二个
    const newOrder = [todoIds[2], todoIds[0], todoIds[1]]
    updateTodosOrder(newOrder)

    // 检查新的顺序是否正确
    expect(todos.value[0].text).toBe('Todo 3')
    expect(todos.value[1].text).toBe('Todo 1')
    expect(todos.value[2].text).toBe('Todo 2')
  })
})
