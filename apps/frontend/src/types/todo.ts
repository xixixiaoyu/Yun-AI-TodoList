// Re-export shared types to ensure consistency across the frontend
export type {
  // AI 任务生成相关类型
  AITaskGenerationRequest,
  AITaskGenerationResult,
  CreateTodoDto,
  GeneratedTask,
  SortDirection,
  TaskGenerationConfig,
  TaskGenerationHistory,
  TaskTemplate,
  Todo,
  TodoFilter,
  TodoSortField,
  TodoSortOptions,
  TodoStats,
  UpdateTodoDto,
  UserTaskPreferences,
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
