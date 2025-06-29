import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock data
const mockTodos: any[] = []
let mockNextId = 1

// Mock storage service
const mockStorageService = {
  getTodos: vi.fn().mockImplementation(() => {
    return Promise.resolve({ success: true, data: mockTodos })
  }),
  saveTodos: vi.fn().mockImplementation((todoList: any[]) => {
    mockTodos.splice(0, mockTodos.length, ...todoList)
    return Promise.resolve({ success: true })
  }),
  createTodo: vi.fn().mockImplementation((dto: any) => {
    const newTodo = {
      id: `todo-${mockNextId++}`,
      title: dto.title,
      completed: false,
      order: mockTodos.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockTodos.push(newTodo)
    return Promise.resolve({ success: true, data: newTodo })
  }),
  updateTodo: vi.fn().mockImplementation((id: string, updates: any) => {
    const index = mockTodos.findIndex((todo) => todo.id === id)
    if (index !== -1) {
      mockTodos[index] = { ...mockTodos[index], ...updates, updatedAt: new Date().toISOString() }
      return Promise.resolve({ success: true, data: mockTodos[index] })
    }
    return Promise.resolve({ success: false, error: 'Todo not found' })
  }),
  deleteTodo: vi.fn().mockImplementation((id: string) => {
    const index = mockTodos.findIndex((todo) => todo.id === id)
    if (index !== -1) {
      mockTodos.splice(index, 1)
      return Promise.resolve({ success: true })
    }
    return Promise.resolve({ success: false, error: 'Todo not found' })
  }),
  reorderTodos: vi.fn().mockImplementation((reorders: Array<{ id: string; order: number }>) => {
    const orderMap = new Map(reorders.map((r) => [r.id, r.order]))
    mockTodos.forEach((todo) => {
      const newOrder = orderMap.get(todo.id)
      if (newOrder !== undefined) {
        todo.order = newOrder
        todo.updatedAt = new Date().toISOString()
      }
    })
    mockTodos.sort((a, b) => a.order - b.order)
    return Promise.resolve({ success: true })
  }),
}

// Mock all dependencies before importing useTodos
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: { value: false },
  }),
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showNotification: vi.fn(),
  }),
}))

vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    getCurrentStorageService: () => mockStorageService,
    initializeStorageMode: vi.fn().mockResolvedValue(undefined),
    isInitialized: { value: true },
  }),
}))

describe('useTodos', () => {
  let todoInstance: any

  beforeEach(async () => {
    // 重置 mock 状态
    mockTodos.splice(0, mockTodos.length)
    mockNextId = 1

    // 清除 localStorage
    localStorage.clear()

    // 重置所有 mock 函数
    vi.clearAllMocks()

    // 动态导入 useTodos 以确保 mock 生效
    const { useTodos } = await import('../useTodos')

    // 直接使用 composable
    todoInstance = useTodos()

    // 清空 todos 并初始化
    todoInstance.todos.value = []
    await todoInstance.initializeTodos()
  })

  afterEach(() => {
    // 清理工作
  })

  it('should add a todo', async () => {
    const _result = await todoInstance.addTodo({ title: 'Test todo' })

    expect(todoInstance.todos.value).toHaveLength(1)
    expect(todoInstance.todos.value[0].title).toBe('Test todo')
    expect(todoInstance.todos.value[0].completed).toBe(false)
  })

  it('should update a todo', async () => {
    await todoInstance.addTodo({ title: 'Test todo' })
    const todoId = todoInstance.todos.value[0].id

    await todoInstance.updateTodo(todoId, { title: 'Updated todo' })

    expect(todoInstance.todos.value[0].title).toBe('Updated todo')
  })

  it('should delete a todo', async () => {
    await todoInstance.addTodo({ title: 'Test todo' })
    const todoId = todoInstance.todos.value[0].id

    await todoInstance.removeTodo(todoId)

    expect(todoInstance.todos.value).toHaveLength(0)
  })

  it('should toggle todo completion', async () => {
    await todoInstance.addTodo({ title: 'Test todo' })
    const todoId = todoInstance.todos.value[0].id

    await todoInstance.toggleTodo(todoId)

    expect(todoInstance.todos.value[0].completed).toBe(true)

    await todoInstance.toggleTodo(todoId)

    expect(todoInstance.todos.value[0].completed).toBe(false)
  })

  it('should remove completed todos', async () => {
    await todoInstance.addTodo({ title: 'Todo 1' })
    await todoInstance.addTodo({ title: 'Todo 2' })
    await todoInstance.addTodo({ title: 'Todo 3' })

    // 标记前两个为完成
    await todoInstance.toggleTodo(todoInstance.todos.value[0].id)
    await todoInstance.toggleTodo(todoInstance.todos.value[1].id)

    // 手动删除已完成的任务
    const completedTodos = todoInstance.todos.value.filter((todo) => todo.completed)
    for (const todo of completedTodos) {
      await todoInstance.removeTodo(todo.id)
    }

    expect(todoInstance.todos.value).toHaveLength(1)
    expect(todoInstance.todos.value[0].title).toBe('Todo 3')
  })

  it('should reorder todos', async () => {
    await todoInstance.addTodo({ title: 'Todo 1' })
    await todoInstance.addTodo({ title: 'Todo 2' })

    const todo1Id = todoInstance.todos.value[0].id
    const todo2Id = todoInstance.todos.value[1].id

    // 重新排序
    await todoInstance.updateTodosOrder([todo2Id, todo1Id])

    expect(todoInstance.todos.value[0].title).toBe('Todo 2')
    expect(todoInstance.todos.value[1].title).toBe('Todo 1')
  })
})
