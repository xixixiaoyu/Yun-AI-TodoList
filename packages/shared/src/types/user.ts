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
  saveHistory: boolean
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
