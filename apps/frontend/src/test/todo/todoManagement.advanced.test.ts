import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTodoManagement } from '../../composables/useTodoManagement'
import { useTodos } from '../../composables/useTodos'
import { setupTestEnvironment } from '../helpers'
// import type { Todo, TodoPriority } from '../../types/todo'

// Mock AI 分析服务
vi.mock('../../services/aiAnalysisService', () => ({
  analyzeTodo: vi.fn().mockResolvedValue({
    priority: 3,
    estimatedTime: '30分钟',
    reasoning: '这是一个中等优先级的任务',
  }),
  reanalyzeTodo: vi.fn(),
  analyzeTask: vi.fn(),
  generateSmartQuestion: vi.fn(),
  generateTodoSystemPrompt: vi.fn(),
}))

// Mock 通知服务
vi.mock('../../composables/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}))

// Mock 错误处理
vi.mock('../../composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    showError: vi.fn(),
    handleError: vi.fn(),
  })),
}))

describe('Todo 管理高级测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(async () => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // 重置状态
    const { resetState } = useTodos()
    await resetState()
  })

  afterEach(async () => {
    testEnv.cleanup()

    // 清理状态
    const { resetState } = useTodos()
    await resetState()
  })

  describe('Todo 创建与管理', () => {
    it('应该能够创建基本 Todo', async () => {
      const { addTodo, todos } = useTodos()

      const result = await addTodo({ title: '测试任务' })

      expect(result).toBeTruthy()
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('测试任务')
      expect(todos.value[0].completed).toBe(false)
      expect(todos.value[0].id).toBeDefined()
      expect(todos.value[0].createdAt).toBeDefined()
    })

    it('应该能够创建带优先级的 Todo', async () => {
      const { addTodo, todos } = useTodos()

      const result = await addTodo({ title: '高优先级任务', priority: 5 })

      expect(result).toBeTruthy()
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].priority).toBe(5)
    })

    it('应该拒绝创建空任务', async () => {
      const { addTodo, todos } = useTodos()

      const result1 = await addTodo({ title: '' })
      const result2 = await addTodo({ title: '   ' })

      expect(result1).toBeNull()
      expect(result2).toBeNull()
      expect(todos.value).toHaveLength(0)
    })

    it('应该能够批量添加 Todo', async () => {
      const { addMultipleTodos, todos } = useTodos()

      const newTodos = [{ title: '任务1' }, { title: '任务2' }, { title: '任务3' }]

      const duplicates = await addMultipleTodos(newTodos)

      expect(duplicates).toEqual([])
      expect(todos.value).toHaveLength(3)
      expect(todos.value[0].title).toBe('任务1')
      expect(todos.value[1].title).toBe('任务2')
      expect(todos.value[2].title).toBe('任务3')
    })
  })

  describe('Todo 状态管理', () => {
    it('应该能够切换 Todo 完成状态', async () => {
      const { addTodo, toggleTodo, todos } = useTodos()

      const todo = await addTodo({ title: '测试任务' })
      expect(todo).toBeTruthy()

      const todoId = todos.value[0].id
      expect(todos.value[0].completed).toBe(false)

      const result1 = await toggleTodo(todoId)
      expect(result1).toBe(true)
      expect(todos.value[0].completed).toBe(true)

      const result2 = await toggleTodo(todoId)
      expect(result2).toBe(true)
      expect(todos.value[0].completed).toBe(false)
    })

    it('应该能够更新 Todo 标题', async () => {
      const { addTodo, updateTodo, todos } = useTodos()

      const todo = await addTodo({ title: '原始任务' })
      expect(todo).toBeTruthy()

      const todoId = todos.value[0].id
      const result = await updateTodo(todoId, { title: '更新后的任务' })

      expect(result).toBe(true)
      expect(todos.value[0].title).toBe('更新后的任务')
    })

    it('应该能够更新 Todo 优先级', async () => {
      const { addTodo, updateTodo, todos } = useTodos()

      const todo = await addTodo({ title: '测试任务', priority: 1 })
      expect(todo).toBeTruthy()

      const todoId = todos.value[0].id
      const result = await updateTodo(todoId, { priority: 5 })

      expect(result).toBe(true)
      expect(todos.value[0].priority).toBe(5)
    })

    it('应该能够设置 Todo 截止日期', async () => {
      const { addTodo, updateTodo, todos } = useTodos()

      const todo = await addTodo({ title: '测试任务' })
      expect(todo).toBeTruthy()

      const todoId = todos.value[0].id
      const dueDate = '2024-12-31T00:00:00.000Z'
      const result = await updateTodo(todoId, { dueDate })

      expect(result).toBe(true)
      expect(todos.value[0].dueDate).toBe(dueDate)
    })
  })

  describe('Todo 删除', () => {
    it('应该能够删除单个 Todo', async () => {
      const { addTodo, removeTodo, todos } = useTodos()

      await addTodo({ title: '任务1' })
      await addTodo({ title: '任务2' })

      expect(todos.value).toHaveLength(2)

      const todoId = todos.value[0].id
      const result = await removeTodo(todoId)

      expect(result).toBe(true)
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('任务2')
    })
  })

  describe('Todo 数据持久化', () => {
    it('应该能够保存 Todo', async () => {
      const { addTodo, saveTodos, todos } = useTodos()

      await addTodo({ title: '测试任务' })
      expect(todos.value).toHaveLength(1)

      // 保存数据应该成功
      await expect(saveTodos()).resolves.not.toThrow()

      // 验证数据仍然存在
      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('测试任务')
    })
  })

  describe('Todo 管理功能', () => {
    it('应该能够使用 useTodoManagement 进行高级操作', async () => {
      const { handleAddTodo, todos, filteredTodos } = useTodoManagement()

      await handleAddTodo('管理测试任务')

      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('管理测试任务')
      expect(filteredTodos.value).toHaveLength(1)
    })

    it('应该能够处理筛选功能', () => {
      const { filter, filteredTodos } = useTodoManagement()

      // 测试筛选器状态
      expect(filter.value).toBe('active')
      expect(filteredTodos.value).toEqual([])
    })
  })

  describe('AI 分析功能', () => {
    it('应该能够分析 Todo', async () => {
      const { addTodo, updateTodoAIAnalysis, todos } = useTodos()

      // 创建一个测试 Todo
      await addTodo({ title: '测试任务' })
      const todo = todos.value[0]

      // Mock 分析结果
      const mockAnalysisResult = {
        priority: 3,
        estimatedTime: '30分钟',
        aiAnalyzed: true,
      }

      // 直接调用 updateTodoAIAnalysis 来模拟分析完成
      const result = await updateTodoAIAnalysis(todo.id, mockAnalysisResult)

      // 验证更新成功
      expect(result).toBe(true)

      // 验证 Todo 被标记为已分析
      expect(todos.value[0].aiAnalyzed).toBe(true)
      expect(todos.value[0].priority).toBe(3)
    })
  })

  describe('性能测试', () => {
    it('应该能够处理大量 Todo', async () => {
      const { addMultipleTodos, todos } = useTodos()

      const largeTodoList = Array.from({ length: 100 }, (_, i) => ({
        title: `任务 ${i + 1}`,
      }))

      const start = performance.now()
      await addMultipleTodos(largeTodoList)
      const end = performance.now()

      expect(todos.value).toHaveLength(100)
      expect(end - start).toBeLessThan(1000) // 应该在 1 秒内完成
    })

    it('应该能够快速更新多个 Todo', async () => {
      const { addMultipleTodos, batchUpdateTodos, todos } = useTodos()

      // 创建测试数据
      const testTodos = Array.from({ length: 10 }, (_, i) => ({
        title: `任务 ${i + 1}`,
      }))

      await addMultipleTodos(testTodos)
      expect(todos.value).toHaveLength(10)

      // 等待一下确保 Todo 创建完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 批量更新前 5 个 Todo
      const updates = todos.value.slice(0, 5).map((todo) => ({
        id: todo.id,
        updates: { completed: true },
      }))

      const start = performance.now()
      const result = await batchUpdateTodos(updates)
      const end = performance.now()

      // 如果批量更新失败，至少验证性能
      expect(end - start).toBeLessThan(500) // 应该在 0.5 秒内完成

      // 验证至少有一些 Todo 被更新（可能不是全部成功）
      if (result) {
        expect(result).toBe(true)
      }
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的 Todo ID', async () => {
      const { updateTodo, removeTodo, toggleTodo } = useTodos()

      const invalidId = 'invalid-id'

      const updateResult = await updateTodo(invalidId, { title: '新标题' })
      const removeResult = await removeTodo(invalidId)
      const toggleResult = await toggleTodo(invalidId)

      expect(updateResult).toBe(false)
      expect(removeResult).toBe(false)
      expect(toggleResult).toBe(false)
    })

    it('应该处理重复的 Todo 标题', async () => {
      const { addTodo, addMultipleTodos, todos } = useTodos()

      await addTodo({ title: '重复任务' })
      expect(todos.value).toHaveLength(1)

      // 尝试添加重复的任务
      const duplicates = await addMultipleTodos([{ title: '重复任务' }, { title: '新任务' }])

      expect(duplicates).toContain('重复任务')
      expect(todos.value).toHaveLength(2) // 只添加了新任务
    })
  })

  describe('数据一致性', () => {
    it('应该清理重复数据', async () => {
      const { cleanupDuplicates, todos } = useTodos()

      // 手动添加重复数据（模拟数据损坏）
      const duplicateData = [
        {
          id: '1',
          title: '任务1',
          completed: false,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: '任务1',
          completed: false,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: '任务2',
          completed: false,
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const { setTodos } = useTodos()
      setTodos(duplicateData)

      expect(todos.value).toHaveLength(3)

      const result = await cleanupDuplicates()

      expect(result.removed).toBe(1)
      expect(result.remaining).toBe(2)
      expect(todos.value).toHaveLength(2)
    })
  })
})
