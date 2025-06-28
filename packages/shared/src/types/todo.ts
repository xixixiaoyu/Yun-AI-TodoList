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
  createdAt: string
  updatedAt: string
  order: number
  priority?: number // 重要等级 (1-5 星)
  estimatedTime?: string // 时间估算 (如: "30分钟", "2小时", "1天")
  aiAnalyzed?: boolean // 是否已进行 AI 分析
  userId?: string // 用户 ID (后端使用)
  dueDate?: string // 截止日期
  // 双重存储支持
  synced?: boolean // 是否已同步到云端
  lastSyncTime?: string // 最后同步时间
  syncError?: string // 同步错误信息
}

export interface CreateTodoDto {
  title: string
  description?: string
  priority?: number
  estimatedTime?: string
  dueDate?: string
}

export interface UpdateTodoDto {
  title?: string
  description?: string
  completed?: boolean
  completedAt?: string
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
  confidence?: number // 分析置信度 (0-1)
}

export interface AIAnalysis {
  todoId: string // 作为主键，一个 Todo 只有一条分析记录
  userId: string
  priority?: number
  estimatedTime?: string
  reasoning?: string
  analyzedAt: string
  synced?: boolean // 是否已同步到云端
  lastSyncTime?: string // 最后同步时间
  syncError?: string // 同步错误信息
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

// 用户设置相关类型
export interface UserSetting {
  id: string
  userId: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
  // 双重存储支持
  synced?: boolean
  lastSyncTime?: string
  syncError?: string
}

export interface CreateUserSettingDto {
  key: string
  value: string
}

export interface UpdateUserSettingDto {
  value: string
}

// AI 分析相关类型 - 使用上面已定义的 AIAnalysis 接口

export interface CreateAIAnalysisDto {
  todoId: string
  userId: string
  priority?: number
  estimatedTime?: string
  reasoning?: string
}

export interface UpdateAIAnalysisDto {
  priority?: number
  estimatedTime?: string
  reasoning?: string
}
