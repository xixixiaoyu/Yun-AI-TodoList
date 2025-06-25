import { beforeEach, describe, expect, it } from 'vitest'
import { useTodos } from '../useTodos'

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear()
    // 重置全局状态
    const { todos } = useTodos()
    todos.value = []
  })

  it('should add a todo', () => {
    const { todos, addTodo } = useTodos()
    expect(todos.value.length).toBe(0)
    addTodo({ title: 'Test todo' })
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].title).toBe('Test todo')
  })

  it('should toggle a todo', () => {
    const { todos, addTodo, toggleTodo } = useTodos()
    addTodo({ title: 'Test todo' })
    expect(todos.value[0].completed).toBe(false)
    toggleTodo(todos.value[0].id)
    expect(todos.value[0].completed).toBe(true)
  })

  it('should remove a todo', () => {
    const { todos, addTodo, removeTodo } = useTodos()
    addTodo({ title: 'Test todo' })
    expect(todos.value.length).toBe(1)
    removeTodo(todos.value[0].id)
    expect(todos.value.length).toBe(0)
  })

  it('should not add duplicate todos', () => {
    const { todos, addTodo } = useTodos()
    addTodo({ title: 'Test todo' })
    expect(todos.value.length).toBe(1)
    const result = addTodo({ title: 'Test todo' })
    expect(result).toBe(null)
    expect(todos.value.length).toBe(1)
  })

  it('should add multiple todos', () => {
    const { todos, addMultipleTodos } = useTodos()
    const newTodos = [{ title: 'Todo 1' }, { title: 'Todo 2' }, { title: 'Todo 3' }]
    const duplicates = addMultipleTodos(newTodos)
    expect(todos.value.length).toBe(3)
    expect(duplicates.length).toBe(0)
  })

  it('should update todos order', () => {
    const { todos, addTodo, updateTodosOrder } = useTodos()
    addTodo({ title: 'Todo 1' })
    addTodo({ title: 'Todo 2' })
    addTodo({ title: 'Todo 3' })

    const todoIds = todos.value.map((todo: any) => todo.id)

    const newOrder = [todoIds[2], todoIds[0], todoIds[1]]
    updateTodosOrder(newOrder)

    expect(todos.value[0].title).toBe('Todo 3')
    expect(todos.value[1].title).toBe('Todo 1')
    expect(todos.value[2].title).toBe('Todo 2')
  })
})
