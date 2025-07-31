/**
 * 配置服务
 */
import { ref } from 'vue'
import type { AIModel } from './types'

const API_KEY_STORAGE_KEY = 'deepseek_api_key'
const BASE_URL_STORAGE_KEY = 'deepseek_base_url'
const HIDE_API_KEY_REMINDER_KEY = 'hide_api_key_reminder'
const AI_MODEL_STORAGE_KEY = 'deepseek_ai_model'
const AI_PROVIDER_STORAGE_KEY = 'ai_provider'

// 默认基础 URL
const DEFAULT_BASE_URL = 'https://api.deepseek.com'

export const apiKey = ref<string>(localStorage.getItem(API_KEY_STORAGE_KEY) || '')
export const baseUrl = ref<string>(localStorage.getItem(BASE_URL_STORAGE_KEY) || DEFAULT_BASE_URL)
export const aiModel = ref<AIModel>(
  (localStorage.getItem(AI_MODEL_STORAGE_KEY) as AIModel | null) || 'deepseek-chat'
)
export const aiProvider = ref<string>(localStorage.getItem(AI_PROVIDER_STORAGE_KEY) || 'deepseek')

export function getApiKey(): string {
  return apiKey.value
}

export function saveApiKey(key: string): void {
  apiKey.value = key
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
}

export function clearApiKey(): void {
  apiKey.value = ''
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

export function getBaseUrl(): string {
  return baseUrl.value
}

export function saveBaseUrl(url: string): void {
  // 确保 URL 格式正确
  const cleanUrl = url.trim().replace(/\/$/, '') // 移除末尾的斜杠
  baseUrl.value = cleanUrl || DEFAULT_BASE_URL
  localStorage.setItem(BASE_URL_STORAGE_KEY, baseUrl.value)
}

export function clearBaseUrl(): void {
  baseUrl.value = DEFAULT_BASE_URL
  localStorage.removeItem(BASE_URL_STORAGE_KEY)
}

export function getAIModel(): AIModel {
  return aiModel.value
}

export function saveAIModel(model: AIModel): void {
  aiModel.value = model
  localStorage.setItem(AI_MODEL_STORAGE_KEY, model)
}

export function getAIProvider(): string {
  return aiProvider.value
}

export function saveAIProvider(provider: string): void {
  aiProvider.value = provider
  localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider)
}

export function shouldShowApiKeyReminder(): boolean {
  return localStorage.getItem(HIDE_API_KEY_REMINDER_KEY) !== 'true'
}

export function hideApiKeyReminder(): void {
  localStorage.setItem(HIDE_API_KEY_REMINDER_KEY, 'true')
}
