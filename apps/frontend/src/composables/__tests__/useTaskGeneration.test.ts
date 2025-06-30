import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTaskGeneration } from '../useTaskGeneration'

// Mock dependencies
vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('@/services/aiTaskGenerationService', () => ({
  analyzeAdvancedUserContext: vi.fn(() => ({
    preferences: {},
    insights: {
      completionRate: 0.5,
      averageTaskDuration: '1小时',
      mostProductiveTimeframe: '上午',
      commonTaskPatterns: ['测试'],
      recommendedTaskSize: 'medium',
      workloadTrend: 'stable',
    },
    suggestions: {
      taskBreakdown: '建议保持现有方式',
      priorityStrategy: '当前策略良好',
      timeManagement: '保持稳定',
    },
  })),
  generateTasksWithRetry: vi.fn(),
  optimizeGeneratedTasks: vi.fn((tasks) => tasks),
  validateGeneratedTasks: vi.fn(() => ({
    isValid: true,
    issues: [],
    suggestions: [],
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('useTaskGeneration', () => {
  let taskGeneration: ReturnType<typeof useTaskGeneration>

  beforeEach(() => {
    vi.clearAllMocks()
    taskGeneration = useTaskGeneration()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(taskGeneration.state.isGenerating).toBe(false)
      expect(taskGeneration.state.showDialog).toBe(false)
      expect(taskGeneration.state.generatedTasks).toEqual([])
      expect(taskGeneration.state.selectedTasks.size).toBe(0)
      expect(taskGeneration.state.editingTask).toBe(null)
    })

    it('should have correct initial config', () => {
      expect(taskGeneration.config.value.maxTasks).toBe(0) // 0 表示自动判断
      expect(taskGeneration.config.value.enablePriorityAnalysis).toBe(true)
      expect(taskGeneration.config.value.enableTimeEstimation).toBe(true)
      expect(taskGeneration.config.value.includeSubtasks).toBe(false)
      expect(taskGeneration.config.value.taskComplexity).toBe('medium')
    })
  })

  describe('stopGeneration', () => {
    it('should stop generation when called during generation', () => {
      // 设置生成状态
      taskGeneration.state.isGenerating = true

      // 调用停止生成
      taskGeneration.stopGeneration()

      // 验证状态已重置
      expect(taskGeneration.state.isGenerating).toBe(false)
    })

    it('should do nothing when not generating', () => {
      // 确保初始状态
      expect(taskGeneration.state.isGenerating).toBe(false)

      // 调用停止生成
      taskGeneration.stopGeneration()

      // 状态应该保持不变
      expect(taskGeneration.state.isGenerating).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('should compute hasGeneratedTasks correctly', () => {
      expect(taskGeneration.hasGeneratedTasks.value).toBe(false)
    })

    it('should compute selectedTasksCount correctly', () => {
      expect(taskGeneration.selectedTasksCount.value).toBe(0)
    })

    it('should compute canConfirm correctly', () => {
      expect(taskGeneration.canConfirm.value).toBe(false)
    })
  })

  describe('task selection', () => {
    it('should have toggle task selection method', () => {
      expect(typeof taskGeneration.toggleTaskSelection).toBe('function')
    })

    it('should have toggle all tasks method', () => {
      expect(typeof taskGeneration.toggleAllTasks).toBe('function')
    })

    it('should have get selected tasks method', () => {
      expect(typeof taskGeneration.getSelectedTasks).toBe('function')
      const selected = taskGeneration.getSelectedTasks()
      expect(Array.isArray(selected)).toBe(true)
    })
  })

  describe('task editing', () => {
    it('should have start edit task method', () => {
      expect(typeof taskGeneration.startEditTask).toBe('function')
    })

    it('should have save task edit method', () => {
      expect(typeof taskGeneration.saveTaskEdit).toBe('function')
    })

    it('should have cancel task edit method', () => {
      expect(typeof taskGeneration.cancelTaskEdit).toBe('function')
    })

    it('should have delete task method', () => {
      expect(typeof taskGeneration.deleteTask).toBe('function')
    })
  })

  describe('dialog management', () => {
    it('should have close dialog method', () => {
      expect(typeof taskGeneration.closeDialog).toBe('function')
    })

    it('should have confirm tasks method', () => {
      expect(typeof taskGeneration.confirmTasks).toBe('function')
      const result = taskGeneration.confirmTasks()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should have regenerate tasks method', () => {
      expect(typeof taskGeneration.regenerateTasks).toBe('function')
    })
  })

  describe('config management', () => {
    it('should have update config method', () => {
      expect(typeof taskGeneration.updateConfig).toBe('function')
    })
  })

  describe('task generation', () => {
    it('should have generate tasks method', () => {
      expect(typeof taskGeneration.generateTasks).toBe('function')
    })
  })
})
