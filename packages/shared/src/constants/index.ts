/**
 * 共享常量定义
 */

// 应用配置
export const APP_CONFIG = {
  NAME: 'Yun AI TodoList',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered Todo application with Vue 3 and NestJS',
  AUTHOR: 'yunmu',
  HOMEPAGE: 'https://github.com/xixixiaoyu/todo',
} as const

// API 配置
export const API_CONFIG = {
  VERSION: 'v1',
  PREFIX: '/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const

// Todo 相关常量
export const TODO_CONSTANTS = {
  MAX_TITLE_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS_COUNT: 10,
  MAX_TAG_LENGTH: 50,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 5,
  DEFAULT_PRIORITY: 3,
} as const

// 用户相关常量
export const USER_CONSTANTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_EMAIL_LENGTH: 255,
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const

// 搜索相关常量
export const SEARCH_CONSTANTS = {
  MIN_QUERY_LENGTH: 1,
  MAX_QUERY_LENGTH: 500,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  DEBOUNCE_DELAY: 300, // 300ms
} as const

// 主题相关常量
export const THEME_CONSTANTS = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
  DEFAULT: 'light',
} as const

// 语言相关常量
export const LANGUAGE_CONSTANTS = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  DEFAULT: 'zh-CN',
  SUPPORTED: ['zh-CN', 'en-US'],
} as const

// AI 相关常量
export const AI_CONSTANTS = {
  PROVIDERS: {
    DEEPSEEK: 'deepseek',
    OPENAI: 'openai',
    CLAUDE: 'claude',
  },
  DEFAULT_PROVIDER: 'deepseek',
  DEFAULT_MODEL: 'deepseek-chat',
  MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 0.7,
  ANALYSIS_TIMEOUT: 30000, // 30 seconds
} as const

// 文件上传相关常量
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const

// 缓存相关常量
export const CACHE_CONSTANTS = {
  KEYS: {
    USER_PREFERENCES: 'user_preferences',
    SEARCH_HISTORY: 'search_history',
    TODO_STATS: 'todo_stats',
    AI_CONFIG: 'ai_config',
  },
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 60 * 60, // 1 hour
    VERY_LONG: 24 * 60 * 60, // 24 hours
  },
} as const

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // 用户相关错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Todo 相关错误
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  TODO_ALREADY_EXISTS: 'TODO_ALREADY_EXISTS',
  TODO_LIMIT_EXCEEDED: 'TODO_LIMIT_EXCEEDED',

  // 搜索相关错误
  SEARCH_FAILED: 'SEARCH_FAILED',
  SEARCH_QUOTA_EXCEEDED: 'SEARCH_QUOTA_EXCEEDED',

  // AI 相关错误
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',

  // 文件上传错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const

// 事件类型
export const EVENT_TYPES = {
  // Todo 事件
  TODO_CREATED: 'todo.created',
  TODO_UPDATED: 'todo.updated',
  TODO_COMPLETED: 'todo.completed',
  TODO_DELETED: 'todo.deleted',
  TODO_ANALYZED: 'todo.analyzed',

  // 用户事件
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATED: 'user.updated',

  // 搜索事件
  SEARCH_PERFORMED: 'search.performed',
  SEARCH_SAVED: 'search.saved',

  // 系统事件
  SYSTEM_ERROR: 'system.error',
  SYSTEM_WARNING: 'system.warning',
} as const

// 正则表达式
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  TIME_ESTIMATE: /^\d+\s*(分钟|小时|天|minutes?|hours?|days?)$/i,
  TAG: /#(\w+)/g,
} as const
