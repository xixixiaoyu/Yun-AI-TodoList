export interface Todo {
  id: number
  text: string
  completed: boolean
  completedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  order: number
  priority?: number // 重要等级 (1-5 星)
  estimatedTime?: string // 时间估算 (如: "30分钟", "2小时", "1天")
  aiAnalyzed?: boolean // 是否已进行 AI 分析
}

export interface HistoryItem {
  id: number
  todos: Todo[]
  timestamp: string
  action: string
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
}

export interface TodoFilter {
  type: 'all' | 'active' | 'completed'
}

export type TodoSortField = 'createdAt' | 'completedAt' | 'text'
export type SortDirection = 'asc' | 'desc'

export interface TodoSortOptions {
  field: TodoSortField
  direction: SortDirection
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
