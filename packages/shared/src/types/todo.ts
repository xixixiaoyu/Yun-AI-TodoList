/**
 * Todo 相关类型定义
 * 前后端共享的 Todo 数据结构
 */

// 优先级类型定义
export type TodoPriority = 1 | 2 | 3 | 4 | 5

// 时间估算类型（支持字符串格式和分钟数）
export interface TimeEstimate {
  text: string // 显示文本，如 "30分钟", "2小时", "1天"
  minutes: number // 对应的分钟数，便于计算
}

export interface Todo {
  id: string // UUID 字符串
  title: string
  description?: string
  completed: boolean
  completedAt?: string // ISO 8601 格式
  createdAt: string // ISO 8601 格式
  updatedAt: string // ISO 8601 格式
  order: number
  priority?: TodoPriority // 重要等级 (1-5 星)
  userId?: string // 用户 ID (后端使用)
  dueDate?: string // 截止日期 ISO 8601 格式
  estimatedTime?: TimeEstimate // AI 估算的时间
  aiAnalyzed?: boolean // 是否经过 AI 分析
  // 双重存储支持
  synced?: boolean // 是否已同步到云端
  lastSyncTime?: string // 最后同步时间 ISO 8601 格式
  syncError?: string // 同步错误信息
}

export interface CreateTodoDto {
  title: string
  description?: string
  priority?: TodoPriority
  dueDate?: string // ISO 8601 格式
  estimatedTime?: TimeEstimate
}

export interface UpdateTodoDto {
  title?: string
  description?: string
  completed?: boolean
  completedAt?: string // ISO 8601 格式
  priority?: TodoPriority
  dueDate?: string // ISO 8601 格式
  order?: number
  estimatedTime?: TimeEstimate
  aiAnalyzed?: boolean // 是否经过 AI 分析
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
  operation: 'complete' | 'delete'
}

// 历史记录相关
export interface TodoHistoryItem {
  id: string
  todoId: string
  action: 'created' | 'updated' | 'completed' | 'deleted'
  changes?: Record<string, string | number | boolean | null | undefined>
  timestamp: string
  userId?: string
}

export interface TodoListResponse {
  todos: Todo[]
  total: number
  page?: number
  limit?: number
  stats: TodoStats
  // 游标分页支持
  hasNextPage?: boolean
  nextCursor?: string
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
