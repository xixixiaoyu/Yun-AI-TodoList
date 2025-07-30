// Re-export shared types to ensure consistency across the frontend
export type {
  CreateTodoDto,
  Todo,
  TodoFilter,
  TodoSortField,
  TodoSortOptions,
  TodoStats,
  UpdateTodoDto,
  TimeEstimate,
  TodoPriority,
} from '@shared/types/todo'

// Import Todo type for use in interfaces
import type { Todo } from '@shared/types/todo'

// Local frontend-specific types
export interface HistoryItem {
  id: string // Align with shared Todo ID type
  todos: Todo[]
  timestamp: string
  action: string
}

// AI 任务生成相关类型
export interface AITaskGenerationRequest {
  description: string
  context?: {
    existingTodos?: Todo[]
    userPreferences?: UserTaskPreferences
    timeframe?: string
  }
  config?: TaskGenerationConfig
}

export interface GeneratedTask {
  title: string
  description?: string
  priority?: number
  estimatedTime?: string
  category?: string
  tags?: string[]
  reasoning?: string
}

export interface AITaskGenerationResult {
  success: boolean
  tasks: GeneratedTask[]
  originalDescription: string
  totalTasks: number
  processingTime: number
  suggestions?: Record<string, unknown>
  error?: string
  metadata?: {
    generatedAt: string
    model: string
    version: string
  }
}

export type SortDirection = 'asc' | 'desc'

export interface TaskGenerationConfig {
  maxTasks: number // 0 表示自动判断
  enablePriorityAnalysis: boolean
  enableTimeEstimation: boolean
  includeSubtasks: boolean
  taskComplexity: 'simple' | 'medium' | 'complex'
}

export interface TaskGenerationHistory {
  id: string
  config: TaskGenerationConfig
  result: AITaskGenerationResult
  timestamp: string
}

export interface TaskTemplate {
  id: string
  name: string
  description: string
  config: TaskGenerationConfig
}

export interface UserTaskPreferences {
  defaultTaskCount: number
  preferredTopics: string[]
  difficulty: string
  autoGenerateSubtasks: boolean
  preferredTaskDuration?: string
  priorityStyle?: 'urgent-first' | 'important-first' | 'balanced'
  taskCategories?: string[]
  insights?: {
    completionRate: number
    averageTaskDuration: string
    mostProductiveTimeframe: string
    commonTaskPatterns: string[]
    recommendedTaskSize: 'small' | 'medium' | 'large'
    workloadTrend: 'increasing' | 'stable' | 'decreasing'
  }
  suggestions?: {
    taskBreakdown: string
    priorityStrategy: string
    timeManagement: string
  }
}

// AI 分析相关类型
export interface AIAnalysisResult {
  priority: number // 1-5 星级
  estimatedTime: string // 时间估算
  reasoning?: string // AI 分析理由
}

export interface AIAnalysisConfig {
  autoAnalyzeNewTodos: boolean // 是否自动分析新添加的 Todo
  enablePriorityAnalysis: boolean // 是否启用重要等级分析
  enableTimeEstimation: boolean // 是否启用时间估算
  enableSubtaskSplitting: boolean // 是否启用 AI 拆分子任务
}

// AI 拆分相关类型
export interface AISubtaskResult {
  canSplit: boolean // 是否可以拆分
  subtasks: string[] // 拆分后的子任务列表
  reasoning: string // 拆分理由
  originalTask: string // 原始任务
}

export interface SubtaskSelectionConfig {
  showDialog: boolean // 是否显示选择对话框
  originalTask: string // 原始任务
  subtasks: string[] // 建议的子任务
  reasoning: string // AI 分析理由
}

export type OmitReasoningSubtaskSelectionConfig = Omit<SubtaskSelectionConfig, 'reasoning'>
