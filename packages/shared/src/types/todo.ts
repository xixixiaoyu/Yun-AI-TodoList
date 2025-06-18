/**
 * Todo 相关类型定义
 * 前后端共享的 Todo 数据结构
 */

export interface Todo {
  id: string // 改为 UUID 字符串
  title: string // 重命名为 title
  description?: string // 新增描述字段
  completed: boolean
  completedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  order: number
  priority?: number // 重要等级 (1-5 星)
  estimatedTime?: string // 时间估算 (如: "30分钟", "2小时", "1天")
  aiAnalyzed?: boolean // 是否已进行 AI 分析
  userId?: string // 用户 ID (后端使用)
  dueDate?: string // 截止日期
}

export interface CreateTodoDto {
  title: string
  description?: string
  tags?: string[]
  priority?: number
  estimatedTime?: string
  dueDate?: string
}

export interface UpdateTodoDto {
  title?: string
  description?: string
  completed?: boolean
  tags?: string[]
  priority?: number
  estimatedTime?: string
  dueDate?: string
  order?: number
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
  overdue?: number
  dueToday?: number
  dueThisWeek?: number
}

export interface TodoFilter {
  type: 'all' | 'active' | 'completed' | 'overdue' | 'today' | 'week'
  tags?: string[]
  priority?: number[]
  search?: string
}

export type TodoSortField = 'createdAt' | 'completedAt' | 'title' | 'priority' | 'dueDate' | 'order'
export type SortDirection = 'asc' | 'desc'

export interface TodoSortOptions {
  field: TodoSortField
  direction: SortDirection
}

export interface TodoReorderDto {
  todoId: string
  newOrder: number
}

export interface BatchTodoOperationDto {
  todoIds: string[]
  operation: 'complete' | 'delete' | 'analyze'
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

export interface BatchAnalyzeDto {
  todoIds: string[]
  config?: Partial<AIAnalysisConfig>
}

// 历史记录相关
export interface TodoHistoryItem {
  id: string
  todoId: string
  action: 'created' | 'updated' | 'completed' | 'deleted' | 'analyzed'
  changes?: Record<string, any>
  timestamp: string
  userId?: string
}

export interface TodoListResponse {
  todos: Todo[]
  total: number
  page?: number
  limit?: number
  stats: TodoStats
}
