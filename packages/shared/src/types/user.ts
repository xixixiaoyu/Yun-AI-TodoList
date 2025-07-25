/**
 * 用户相关类型定义
 */

export interface User {
  id: string
  email: string
  username: string
  password: string // 仅在后端内部使用，前端不会接收到此字段
  avatarUrl?: string
  emailVerified: boolean
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

// 前端使用的用户类型，不包含密码
export interface PublicUser {
  id: string
  email: string
  username: string
  avatarUrl?: string
  emailVerified: boolean
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  theme: ThemeValue
  language: string
  aiConfig: UserAIAnalysisConfig
  searchConfig: SearchConfig
  notifications: NotificationSettings
  storageConfig: StorageConfig
}

export interface CreateUserDto {
  email: string
  username: string
  password: string
  avatarUrl?: string
  googleId?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface UpdateUserDto {
  username?: string
  avatarUrl?: string
  preferences?: Partial<UserPreferences>
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenDto {
  refreshToken: string
}

export interface SendVerificationCodeDto {
  email: string
  type: 'register' | 'login' | 'reset_password'
}

export interface VerifyEmailCodeDto {
  email: string
  code: string
}

// 主题相关
export type ThemeValue = 'light' | 'dark' | 'auto'

export interface ThemeConfig {
  value: ThemeValue
  customColors?: Record<string, string>
}

// AI 配置
export interface UserAIAnalysisConfig {
  enabled: boolean
  autoAnalyze: boolean
  priorityAnalysis: boolean
  timeEstimation: boolean
  subtaskSplitting: boolean
  modelConfig: {
    model: string
    temperature: number
    maxTokens: number
    [key: string]: unknown
  }
}

// 搜索配置
export interface SearchConfig {
  defaultLanguage: string
  safeSearch: boolean
  defaultResultCount: number
  engineConfig: {
    engine: string
    region: string
    [key: string]: unknown
  }
}

// 通知设置
export interface NotificationSettings {
  desktop: boolean
  email: boolean
  dueReminder: boolean
  reminderMinutes: number
}

// 存储模式配置
export type StorageMode = 'cloud' | 'local' | 'hybrid'

export interface StorageConfig {
  mode: StorageMode
  retryAttempts: number // 网络请求重试次数
  requestTimeout: number // 请求超时时间（毫秒）
  // 可选的额外配置字段
  autoSync?: boolean // 是否启用自动同步
  syncInterval?: number // 同步间隔（分钟）
  offlineMode?: boolean // 是否启用离线模式
  conflictResolution?: 'local-wins' | 'remote-wins' | 'merge' | 'ask-user' // 冲突解决策略
}

// 网络状态相关类型
export interface NetworkStatus {
  isOnline: boolean
  isServerReachable: boolean
  lastCheckTime?: string
  consecutiveFailures: number
}

export interface StorageHealth {
  cloudStorage: boolean
  networkConnectivity: boolean
  lastHealthCheck: string
}

export interface DataExportOptions {
  includeTodos: boolean
  includeSettings: boolean
  includeAIAnalysis: boolean
  format: 'json' | 'csv'
  compressed: boolean
}

export interface DataImportResult {
  success: boolean
  importedCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ type: string; message: string; data?: unknown }>
}
