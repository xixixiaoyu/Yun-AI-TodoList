import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateFallbackQuestion, generateTodoSystemPrompt } from '../services/aiAnalysisService'
import type { Todo } from '../types/todo'

// Mock the deepseekService
vi.mock('@/services/deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

// Mock the logger
vi.mock('@/utils/logger', () => ({
  handleError: vi.fn(),
}))

describe('Smart Question Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate fallback question for many active todos', () => {
    const manyTodos: Todo[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      text: `任务 ${i + 1}`,
      completed: false,
      tags: [],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      order: i + 1,
    }))

    const result = generateFallbackQuestion(manyTodos)

    expect(result.category).toBe('priority')
    expect(result.question).toContain('15 个待完成任务')
    expect(result.reasoning).toBe('任务数量较多，需要优化优先级管理')
  })

  it('should generate fallback question for many high priority todos', () => {
    const highPriorityTodos: Todo[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      text: `高优先级任务 ${i + 1}`,
      completed: false,
      tags: [],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      order: i + 1,
      priority: 5,
    }))

    const result = generateFallbackQuestion(highPriorityTodos)

    expect(result.category).toBe('planning')
    expect(result.question).toContain('5 个高优先级任务')
    expect(result.reasoning).toBe('高优先级任务较多，需要时间规划建议')
  })

  it('should generate fallback question for many completed todos', () => {
    const completedTodos: Todo[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      text: `已完成任务 ${i + 1}`,
      completed: true,
      completedAt: '2024-01-01T18:00:00Z',
      tags: [],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T18:00:00Z',
      order: i + 1,
    }))

    const activeTodos: Todo[] = [
      {
        id: 11,
        text: '待完成任务',
        completed: false,
        tags: [],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        order: 11,
      },
    ]

    const allTodos = [...completedTodos, ...activeTodos]
    const result = generateFallbackQuestion(allTodos)

    expect(result.category).toBe('summary')
    expect(result.question).toContain('10 个任务')
    expect(result.reasoning).toBe('完成任务较多，适合进行总结回顾')
  })

  it('should generate fallback question for many unanalyzed todos', () => {
    const unanalyzedTodos: Todo[] = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      text: `未分析任务 ${i + 1}`,
      completed: false,
      tags: [],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      order: i + 1,
      aiAnalyzed: false,
    }))

    const result = generateFallbackQuestion(unanalyzedTodos)

    expect(result.category).toBe('improvement')
    expect(result.question).toContain('AI分析')
    expect(result.reasoning).toBe('未分析任务较多，建议使用AI分析功能')
  })

  it('should generate default question when no conditions match', () => {
    const simpleTodos: Todo[] = [
      {
        id: 1,
        text: '简单任务',
        completed: false,
        tags: [],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        order: 1,
        aiAnalyzed: true,
      },
    ]

    const result = generateFallbackQuestion(simpleTodos)

    expect(result.category).toBe('analysis')
    expect(result.question).toBe('基于你当前的任务情况，有什么需要我帮助分析或建议的吗？')
    expect(result.reasoning).toBe('提供通用的任务管理咨询')
  })
})

describe('Todo System Prompt Generation', () => {
  const mockTodos: Todo[] = [
    {
      id: 'test-todo-1',
      title: '完成项目报告',
      completed: false,
      tags: ['工作', '重要'],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      order: 1,
      priority: 4,
      estimatedTime: '2小时',
      aiAnalyzed: true,
    },
    {
      id: 'test-todo-2',
      title: '买菜做饭',
      completed: true,
      completedAt: '2024-01-01T18:00:00Z',
      tags: ['生活'],
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-01T18:00:00Z',
      order: 2,
      priority: 2,
      estimatedTime: '30分钟',
      aiAnalyzed: true,
    },
  ]

  it('should generate system prompt with task overview', () => {
    const systemPrompt = generateTodoSystemPrompt(mockTodos)

    expect(systemPrompt).toContain('你是专业的任务管理助手')
    expect(systemPrompt).toContain('1 个待完成任务')
    expect(systemPrompt).toContain('1 个已完成任务')
    expect(systemPrompt).toContain('## 待完成任务 (1个)')
  })

  it('should include detailed task information', () => {
    const systemPrompt = generateTodoSystemPrompt(mockTodos)

    expect(systemPrompt).toContain('完成项目报告')
    expect(systemPrompt).toContain('[优先级:4星]')
    expect(systemPrompt).toContain('[时间:2小时]')
    expect(systemPrompt).toContain('[标签:工作,重要]')
  })

  it('should include completed tasks information', () => {
    const systemPrompt = generateTodoSystemPrompt(mockTodos)

    expect(systemPrompt).toContain('买菜做饭')
    expect(systemPrompt).toContain('[用时:')
  })

  it('should handle empty todo list', () => {
    const systemPrompt = generateTodoSystemPrompt([])

    expect(systemPrompt).toContain('0 个待完成任务')
    expect(systemPrompt).toContain('0 个已完成任务')
    expect(systemPrompt).toContain('暂无待完成任务')
    expect(systemPrompt).toContain('暂无已完成任务')
  })

  it('should include AI assistant responsibilities', () => {
    const systemPrompt = generateTodoSystemPrompt(mockTodos)

    expect(systemPrompt).toContain('请基于以下具体任务信息提供个性化建议')
    expect(systemPrompt).toContain('提供针对性的任务管理建议')
    expect(systemPrompt).toContain('可以直接引用任务内容、优先级和时间信息')
  })
})
