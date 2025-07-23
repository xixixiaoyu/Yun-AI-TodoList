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
  aiAnalyzed?: boolean
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

// AI 任务生成相关类型
export interface AITaskGenerationRequest {
  description: string // 用户输入的任务描述
  context?: {
    existingTodos?: Todo[] // 现有任务列表，用于上下文分析
    userPreferences?: UserTaskPreferences // 用户偏好设置
    timeframe?: string // 时间范围（如"本周"、"下个月"）
  }
  config?: TaskGenerationConfig // 生成配置
}

export interface TaskGenerationConfig {
  maxTasks?: number // 最大生成任务数量，默认 5
  enablePriorityAnalysis?: boolean // 是否启用优先级分析
  enableTimeEstimation?: boolean // 是否启用时间估算
  includeSubtasks?: boolean // 是否包含子任务
  taskComplexity?: 'simple' | 'medium' | 'complex' // 任务复杂度偏好
}

export interface UserTaskPreferences {
  preferredTaskDuration?: string // 偏好的任务时长
  workingHours?: { start: string; end: string } // 工作时间
  priorityStyle?: 'urgent-first' | 'important-first' | 'balanced' // 优先级风格
  taskCategories?: string[] // 常用任务分类
}

export interface GeneratedTask {
  title: string // 任务标题
  description?: string // 任务描述
  priority?: number // 优先级 (1-5)
  estimatedTime?: string // 预估时间
  dueDate?: string // 建议截止日期
  category?: string // 任务分类
  tags?: string[] // 任务标签
  reasoning?: string // AI 生成此任务的理由
}

export interface AITaskGenerationResult {
  success: boolean
  tasks: GeneratedTask[] // 生成的任务列表
  originalDescription: string // 原始描述
  totalTasks: number // 生成的任务总数
  processingTime?: number // 处理时间（毫秒）
  suggestions?: {
    timeframe?: string // 建议的完成时间框架
    totalEstimatedTime?: string // 总预估时间
    priorityDistribution?: { high: number; medium: number; low: number } // 优先级分布
    recommendedOrder?: number[] // 建议的执行顺序（任务索引）
  }
  metadata?: {
    generatedAt: string // 生成时间
    model?: string // 使用的 AI 模型
    version?: string // 生成器版本
  }
  error?: string // 错误信息
}

export interface TaskGenerationHistory {
  id: string
  userId?: string
  request: AITaskGenerationRequest
  result: AITaskGenerationResult
  createdAt: string
  usedTasks?: number // 用户实际使用的任务数量
  feedback?: 'helpful' | 'partially-helpful' | 'not-helpful' // 用户反馈
}

export interface TaskTemplate {
  id: string
  name: string // 模板名称
  description: string // 模板描述
  category: string // 模板分类
  keywords: string[] // 关键词，用于匹配用户输入
  tasks: Omit<GeneratedTask, 'reasoning'>[] // 模板任务
  usage: number // 使用次数
  rating: number // 用户评分
  createdAt: string
  updatedAt: string
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
