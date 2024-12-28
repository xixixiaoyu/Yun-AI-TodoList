import { ref } from 'vue'

const API_KEY_STORAGE_KEY = 'deepseek_api_key'

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
