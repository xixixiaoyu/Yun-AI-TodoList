/**
 * 设置相关的类型定义
 */

/**
 * 自定义提示词接口
 */
export interface CustomPrompt {
  id: string
  name: string
  content: string
}

/**
 * 提示词模板类型
 */
export type PromptTemplate = 'my' | string

/**
 * 设置状态接口
 */
export interface SettingsState {
  showApiKey: boolean
  showApiKeyPopover: boolean
  showAddPromptPopover: boolean
  localApiKey: string
  localSystemPrompt: string
  showSuccessMessage: boolean
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  newPromptName: string
  newPromptContent: string
  customPrompts: CustomPrompt[]
}

/**
 * API 密钥配置状态
 */
export interface ApiKeyState {
  showApiKey: boolean
  showApiKeyPopover: boolean
  localApiKey: string
}

/**
 * 提示词管理状态
 */
export interface PromptManagementState {
  showAddPromptPopover: boolean
  localSystemPrompt: string
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  newPromptName: string
  newPromptContent: string
  customPrompts: CustomPrompt[]
}

/**
 * 通知状态
 */
export interface ToastState {
  showSuccessMessage: boolean
  message?: string
}
