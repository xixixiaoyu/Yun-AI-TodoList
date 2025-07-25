/**
 * API 相关类型定义
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
  path?: string
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterQuery {
  search?: string
  tags?: string[]
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface BulkOperationResponse {
  success: number
  failed: number
  errors?: Array<{
    id: string
    error: string
  }>
}

// HTTP 状态码枚举
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// API 端点常量
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  // Todo
  TODOS: {
    BASE: '/todos',
    BATCH_ANALYZE: '/todos/batch-analyze',
    REORDER: '/todos/reorder',
    STATS: '/todos/stats',
    HISTORY: '/todos/history',
  },
  // 搜索
  SEARCH: {
    BASE: '/search',
    HISTORY: '/search/history',
    SUGGESTIONS: '/search/suggestions',
    STATS: '/search/stats',
  },
  // 用户设置
  SETTINGS: {
    BASE: '/settings',
    THEME: '/settings/theme',
    AI_CONFIG: '/settings/ai-config',
    SEARCH_CONFIG: '/settings/search-config',
    NOTIFICATIONS: '/settings/notifications',
  },
  // 文件上传
  UPLOAD: {
    AVATAR: '/upload/avatar',
    ATTACHMENT: '/upload/attachment',
  },
} as const

export type ApiEndpoint =
  (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS][keyof (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS]]
