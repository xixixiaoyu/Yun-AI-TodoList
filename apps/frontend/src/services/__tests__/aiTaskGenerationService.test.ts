import type { GeneratedTask, Todo } from '@/types/todo'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeAdvancedUserContext,
  analyzeUserContext,
  optimizeGeneratedTasks,
  validateGeneratedTasks,
} from '../aiTaskGenerationService'

// Mock deepseekService
vi.mock('../deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

describe('aiTaskGenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeUserContext', () => {
    it('should return empty object for empty todos', () => {
      const result = analyzeUserContext([])
      expect(result).toEqual({})
    })

    it('should analyze user preferences correctly', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test todo 1',
          completed: false,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          order: 1,
          priority: 4,
          estimatedTime: '2小时',
        },
        {
          id: '2',
          title: 'Test todo 2',
          completed: false,
          createdAt: '2023-01-02',
          updatedAt: '2023-01-02',
          order: 2,
          priority: 5,
          estimatedTime: '1小时',
        },
      ]

      const result = analyzeUserContext(todos)

      expect(result.priorityStyle).toBe('urgent-first')
      expect(result.preferredTaskDuration).toBe('中等时长')
    })
  })

  describe('validateGeneratedTasks', () => {
    it('should validate empty tasks', () => {
      const result = validateGeneratedTasks([])

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('未生成任何任务')
    })

    it('should validate tasks with missing titles', () => {
      const tasks: GeneratedTask[] = [
        {
          title: '',
          reasoning: 'Test reasoning',
        },
      ]

      const result = validateGeneratedTasks(tasks)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('1 个任务缺少标题')
    })

    it('should validate duplicate tasks', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Test Task',
          reasoning: 'Test reasoning',
        },
        {
          title: 'Test Task',
          reasoning: 'Test reasoning',
        },
      ]

      const result = validateGeneratedTasks(tasks)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('发现 1 个重复任务')
    })

    it('should validate high priority distribution', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Task 1',
          priority: 5,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
        {
          title: 'Task 2',
          priority: 5,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
        {
          title: 'Task 3',
          priority: 4,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
      ]

      const result = validateGeneratedTasks(tasks)

      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('高优先级任务过多')
    })

    it('should pass validation for good tasks', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Task 1',
          priority: 3,
          estimatedTime: '1小时',
          reasoning: 'Test reasoning',
        },
        {
          title: 'Task 2',
          priority: 2,
          estimatedTime: '30分钟',
          reasoning: 'Test reasoning',
        },
      ]

      const result = validateGeneratedTasks(tasks)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('optimizeGeneratedTasks', () => {
    it('should remove duplicate tasks', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Test Task',
          reasoning: 'Test reasoning',
        },
        {
          title: 'Test Task',
          reasoning: 'Test reasoning',
        },
        {
          title: 'Another Task',
          reasoning: 'Test reasoning',
        },
      ]

      const result = optimizeGeneratedTasks(tasks)

      expect(result).toHaveLength(2)
      expect(result.map((t) => t.title)).toEqual(['Test Task', 'Another Task'])
    })

    it('should sort tasks by priority and dependencies', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Low Priority Task',
          priority: 2,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
        {
          title: 'High Priority Task',
          priority: 5,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
        {
          title: 'Medium Priority Task',
          priority: 3,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
      ]

      const result = optimizeGeneratedTasks(tasks)

      expect(result[0].title).toBe('High Priority Task')
      expect(result[1].title).toBe('Medium Priority Task')
      expect(result[2].title).toBe('Low Priority Task')
    })

    it('should add estimated time for tasks without it', () => {
      const tasks: GeneratedTask[] = [
        {
          title: 'Task without time',
          priority: 3,
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
      ]

      const result = optimizeGeneratedTasks(tasks)

      expect(result[0].estimatedTime).toBeDefined()
      expect(result[0].estimatedTime).toMatch(/\d+分钟|\d+小时|\d+天/)
    })
  })

  describe('analyzeAdvancedUserContext', () => {
    it('should provide detailed analysis for user todos', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Completed task',
          completed: true,
          completedAt: '2023-01-01T10:00:00Z',
          createdAt: '2023-01-01T09:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
          order: 1,
          priority: 3,
          estimatedTime: '1小时',
        },
        {
          id: '2',
          title: 'Active task',
          completed: false,
          createdAt: '2023-01-02T09:00:00Z',
          updatedAt: '2023-01-02T09:00:00Z',
          order: 2,
          priority: 4,
          estimatedTime: '2小时',
        },
      ]

      const result = analyzeAdvancedUserContext(todos)

      expect(result.preferences).toBeDefined()
      expect(result.insights).toBeDefined()
      expect(result.suggestions).toBeDefined()

      expect(result.insights.completionRate).toBe(0.5)
      expect(result.insights.averageTaskDuration).toMatch(/\d+分钟|\d+小时/)
      expect(result.insights.recommendedTaskSize).toMatch(/small|medium|large/)
      expect(result.insights.workloadTrend).toMatch(/increasing|stable|decreasing/)

      expect(result.suggestions.taskBreakdown).toBeDefined()
      expect(result.suggestions.priorityStrategy).toBeDefined()
      expect(result.suggestions.timeManagement).toBeDefined()
    })
  })
})
