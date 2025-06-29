/**
 * 用户相关类型定义
 */

export interface User {
  id: string
  email: string
  username: string
  password: string // 仅在后端内部使用，前端不会接收到此字段
  avatarUrl?: string
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
    [key: string]: any
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
    [key: string]: any
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
export type StorageMode = 'local' | 'hybrid'

export interface StorageConfig {
  mode: StorageMode
  autoSync: boolean
  syncInterval: number // 自动同步间隔（分钟）
  offlineMode: boolean // 离线模式是否启用
  conflictResolution: ConflictResolutionStrategy
}

export type ConflictResolutionStrategy = 'local-wins' | 'remote-wins' | 'merge' | 'ask-user'

export interface SyncStatus {
  lastSyncTime?: string
  syncInProgress: boolean
  syncError?: string
  pendingChanges: number
  conflictsCount: number
  failedOperations?: number
  pendingOperations?: number
}

// 双重存储相关类型
export interface SyncableEntity {
  synced?: boolean // 是否已同步到云端
  lastSyncTime?: string // 最后同步时间
  syncError?: string // 同步错误信息
}

export interface ConflictResolution<T = any> {
  localData: T
  remoteData: T
  strategy: ConflictResolutionStrategy
  resolvedData?: T
}

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'todo' | 'user_setting' | 'ai_analysis'
  entityId: string
  data?: any
  timestamp: string
  retryCount: number
  maxRetries: number
}

export interface SyncQueue {
  operations: SyncOperation[]
  isProcessing: boolean
  lastProcessedTime?: string
}

export interface StorageHealth {
  localStorage: boolean
  remoteStorage: boolean
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
  errors: Array<{ type: string; message: string; data?: any }>
}
