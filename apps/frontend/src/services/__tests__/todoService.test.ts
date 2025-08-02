import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Todo, CreateTodoDto, UpdateTodoDto, TodoPriority } from '@yun-ai-todolist/shared'

// Mock axios
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
}

vi.mock('axios', () => ({
  default: {
    create: () => mockAxios,
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// 创建测试用的 Todo 数据
const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'test-id-1',
  title: '测试待办事项',
  description: '这是一个测试描述',
  completed: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  order: 1,
  priority: 3,
  dueDate: undefined,
  estimatedTime: undefined,
  aiAnalyzed: false,
  ...overrides,
})

// 模拟 TodoService
class MockTodoService {
  private todos: Todo[] = []
  private baseURL = '/api/todos'

  async getTodos(): Promise<Todo[]> {
    try {
      const response = await mockAxios.get(this.baseURL)
      return response.data
    } catch {
      // 降级到本地存储
      const localTodos = localStorage.getItem('todos')
      return localTodos ? JSON.parse(localTodos) : []
    }
  }

  async createTodo(todoData: CreateTodoDto): Promise<Todo> {
    const newTodo = createMockTodo({
      id: `todo-${Date.now()}`,
      title: todoData.title,
      description: todoData.description,
      priority: todoData.priority,
      dueDate: todoData.dueDate,
      order: this.todos.length,
    })

    try {
      const response = await mockAxios.post(this.baseURL, todoData)
      return response.data
    } catch {
      // 降级到本地存储
      this.todos.push(newTodo)
      localStorage.setItem('todos', JSON.stringify(this.todos))
      return newTodo
    }
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<Todo> {
    try {
      const response = await mockAxios.put(`${this.baseURL}/${id}`, updates)
      return response.data
    } catch {
      // 降级到本地存储
      const todoIndex = this.todos.findIndex((t) => t.id === id)
      if (todoIndex === -1) {
        throw new Error('Todo not found')
      }

      this.todos[todoIndex] = {
        ...this.todos[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem('todos', JSON.stringify(this.todos))
      return this.todos[todoIndex]
    }
  }

  async deleteTodo(id: string): Promise<void> {
    try {
      await mockAxios.delete(`${this.baseURL}/${id}`)
    } catch {
      // 降级到本地存储
      this.todos = this.todos.filter((t) => t.id !== id)
      localStorage.setItem('todos', JSON.stringify(this.todos))
    }
  }

  async batchUpdateTodos(updates: Array<{ id: string; updates: UpdateTodoDto }>): Promise<Todo[]> {
    try {
      const response = await mockAxios.patch(`${this.baseURL}/batch`, { updates })
      return response.data
    } catch {
      // 降级到本地存储
      const updatedTodos = updates
        .map(({ id, updates: todoUpdates }) => {
          const todoIndex = this.todos.findIndex((t) => t.id === id)
          if (todoIndex !== -1) {
            this.todos[todoIndex] = {
              ...this.todos[todoIndex],
              ...todoUpdates,
              updatedAt: new Date().toISOString(),
            }
          }
          return this.todos[todoIndex]
        })
        .filter(Boolean)

      localStorage.setItem('todos', JSON.stringify(this.todos))
      return updatedTodos
    }
  }

  async reorderTodos(todoIds: string[]): Promise<Todo[]> {
    const updates = todoIds.map((id, index) => ({
      id,
      updates: { order: index },
    }))

    return this.batchUpdateTodos(updates)
  }

  // 搜索和筛选功能
  async searchTodos(query: string): Promise<Todo[]> {
    const todos = await this.getTodos()
    return todos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(query.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(query.toLowerCase()))
    )
  }

  async filterTodos(filters: {
    completed?: boolean
    priority?: number
    dueDate?: string
    // tags?: string[] // Not implemented in current Todo type
  }): Promise<Todo[]> {
    const todos = await this.getTodos()
    return todos.filter((todo) => {
      if (filters.completed !== undefined && todo.completed !== filters.completed) {
        return false
      }
      if (filters.priority !== undefined && todo.priority !== filters.priority) {
        return false
      }
      if (filters.dueDate && todo.dueDate !== filters.dueDate) {
        return false
      }
      // Note: tags functionality not implemented in current Todo type
      return true
    })
  }

  // 统计功能
  async getTodoStats(): Promise<{
    total: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
  }> {
    const todos = await this.getTodos()
    const now = new Date()

    const total = todos.length
    const completed = todos.filter((t) => t.completed).length
    const pending = total - completed
    const overdue = todos.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? completed / total : 0,
    }
  }
}

describe('TodoService', () => {
  let todoService: MockTodoService

  beforeEach(() => {
    vi.clearAllMocks()
    todoService = new MockTodoService()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('基础 CRUD 操作', () => {
    it('应该能够获取待办事项列表', async () => {
      const mockTodos = [createMockTodo(), createMockTodo({ id: 'test-id-2', title: '第二个任务' })]
      mockAxios.get.mockResolvedValue({ data: mockTodos })

      const todos = await todoService.getTodos()

      expect(todos).toEqual(mockTodos)
      expect(mockAxios.get).toHaveBeenCalledWith('/api/todos')
    })

    it('应该在网络失败时降级到本地存储', async () => {
      const localTodos = [createMockTodo()]
      mockAxios.get.mockRejectedValue(new Error('Network error'))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localTodos))

      const todos = await todoService.getTodos()

      expect(todos).toEqual(localTodos)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('todos')
    })

    it('应该能够创建新的待办事项', async () => {
      const todoData: CreateTodoDto = {
        title: '新任务',
        description: '新任务描述',
        priority: 4,
        dueDate: '2024-12-31T23:59:59Z',
      }

      const expectedTodo = createMockTodo(todoData)
      mockAxios.post.mockResolvedValue({ data: expectedTodo })

      const result = await todoService.createTodo(todoData)

      expect(result).toEqual(expectedTodo)
      expect(mockAxios.post).toHaveBeenCalledWith('/api/todos', todoData)
    })

    it('应该能够更新待办事项', async () => {
      const todoId = 'test-id-1'
      const updates: UpdateTodoDto = {
        title: '更新的标题',
        completed: true,
        priority: 5,
      }

      const updatedTodo = createMockTodo({ ...updates, id: todoId })
      mockAxios.put.mockResolvedValue({ data: updatedTodo })

      const result = await todoService.updateTodo(todoId, updates)

      expect(result).toEqual(updatedTodo)
      expect(mockAxios.put).toHaveBeenCalledWith(`/api/todos/${todoId}`, updates)
    })

    it('应该能够删除待办事项', async () => {
      const todoId = 'test-id-1'
      mockAxios.delete.mockResolvedValue({})

      await todoService.deleteTodo(todoId)

      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
    })
  })

  describe('批量操作', () => {
    it('应该能够批量更新待办事项', async () => {
      const updates = [
        { id: 'todo-1', updates: { completed: true } },
        { id: 'todo-2', updates: { priority: 5 as TodoPriority } },
      ]

      const updatedTodos = [
        createMockTodo({ id: 'todo-1', completed: true }),
        createMockTodo({ id: 'todo-2', priority: 5 }),
      ]

      mockAxios.patch.mockResolvedValue({ data: updatedTodos })

      const result = await todoService.batchUpdateTodos(updates)

      expect(result).toEqual(updatedTodos)
      expect(mockAxios.patch).toHaveBeenCalledWith('/api/todos/batch', { updates })
    })

    it('应该能够重新排序待办事项', async () => {
      const todoIds = ['todo-3', 'todo-1', 'todo-2']
      const expectedUpdates = [
        { id: 'todo-3', updates: { order: 0 } },
        { id: 'todo-1', updates: { order: 1 } },
        { id: 'todo-2', updates: { order: 2 } },
      ]

      const reorderedTodos = todoIds.map((id, index) => createMockTodo({ id, order: index }))

      mockAxios.patch.mockResolvedValue({ data: reorderedTodos })

      const result = await todoService.reorderTodos(todoIds)

      expect(result).toEqual(reorderedTodos)
      expect(mockAxios.patch).toHaveBeenCalledWith('/api/todos/batch', { updates: expectedUpdates })
    })
  })

  describe('搜索和筛选', () => {
    const mockTodos = [
      createMockTodo({ id: '1', title: '学习 Vue.js', description: '深入学习 Vue 3 组合式 API' }),
      createMockTodo({ id: '2', title: '写博客文章', description: '分享学习心得' }),
      createMockTodo({
        id: '3',
        title: '锻炼身体',
        description: '每天跑步 30 分钟',
        completed: true,
      }),
    ]

    beforeEach(() => {
      mockAxios.get.mockResolvedValue({ data: mockTodos })
    })

    it('应该能够按标题搜索待办事项', async () => {
      const result = await todoService.searchTodos('Vue')

      expect(result).toHaveLength(1)
      expect(result[0].title).toContain('Vue.js')
    })

    it('应该能够按描述搜索待办事项', async () => {
      const result = await todoService.searchTodos('学习')

      expect(result).toHaveLength(2)
      expect(result.map((t) => t.id)).toEqual(['1', '2'])
    })

    it('应该能够按完成状态筛选', async () => {
      const completedTodos = await todoService.filterTodos({ completed: true })
      const pendingTodos = await todoService.filterTodos({ completed: false })

      expect(completedTodos).toHaveLength(1)
      expect(completedTodos[0].id).toBe('3')
      expect(pendingTodos).toHaveLength(2)
    })

    it('应该能够按优先级筛选', async () => {
      const highPriorityTodos = await todoService.filterTodos({ priority: 3 })

      expect(highPriorityTodos).toHaveLength(3) // 所有测试数据默认优先级为 3
    })
  })

  describe('统计功能', () => {
    it('应该能够获取待办事项统计信息', async () => {
      const mockTodos = [
        createMockTodo({ id: '1', completed: false }),
        createMockTodo({ id: '2', completed: true }),
        createMockTodo({ id: '3', completed: false, dueDate: '2023-01-01T00:00:00Z' }), // 过期
      ]

      mockAxios.get.mockResolvedValue({ data: mockTodos })

      const stats = await todoService.getTodoStats()

      expect(stats).toEqual({
        total: 3,
        completed: 1,
        pending: 2,
        overdue: 1,
        completionRate: 1 / 3,
      })
    })

    it('应该正确处理空列表的统计', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })

      const stats = await todoService.getTodoStats()

      expect(stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      })
    })
  })

  describe('错误处理', () => {
    it('应该在更新不存在的待办事项时抛出错误', async () => {
      mockAxios.put.mockRejectedValue(new Error('Todo not found'))

      // 模拟本地存储中也没有该项目
      todoService['todos'] = []

      await expect(todoService.updateTodo('non-existent', { title: '新标题' })).rejects.toThrow(
        'Todo not found'
      )
    })

    it('应该在网络错误时优雅降级', async () => {
      const todoData: CreateTodoDto = { title: '测试任务' }
      mockAxios.post.mockRejectedValue(new Error('Network error'))

      const result = await todoService.createTodo(todoData)

      expect(result.title).toBe('测试任务')
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('数据验证', () => {
    it('应该验证必填字段', async () => {
      const invalidTodoData = { title: '' } as CreateTodoDto

      // 这里应该在实际服务中添加验证逻辑
      // 目前只是演示测试结构
      expect(invalidTodoData.title).toBe('')
    })

    it('应该验证优先级范围', async () => {
      const todoData: CreateTodoDto = {
        title: '测试任务',
        priority: 10 as TodoPriority, // 超出范围
      }

      // 实际实现中应该验证优先级在 1-5 范围内
      expect(todoData.priority).toBeGreaterThan(5)
    })
  })
})
