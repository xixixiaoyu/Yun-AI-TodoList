import { ref } from 'vue'

const API_KEY_STORAGE_KEY = 'deepseek_api_key'
const HIDE_API_KEY_REMINDER_KEY = 'hide_api_key_reminder'

export const apiKey = ref<string>(localStorage.getItem(API_KEY_STORAGE_KEY) || '')

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

export function shouldShowApiKeyReminder(): boolean {
  return localStorage.getItem(HIDE_API_KEY_REMINDER_KEY) !== 'true'
}

export function hideApiKeyReminder(): void {
  localStorage.setItem(HIDE_API_KEY_REMINDER_KEY, 'true')
}
