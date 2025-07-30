// AI 响应缓存工具函数

// 缓存相关常量
const CACHE_KEY_PREFIX = 'ai_response_'
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000 // 30分钟

/**
 * 生成缓存键
 * @param prompt 提示词
 * @returns 缓存键
 */
export function generateCacheKey(prompt: string): string {
  return `${CACHE_KEY_PREFIX}${encodeURIComponent(prompt)}`
}

/**
 * 从缓存中获取 AI 响应
 * @param prompt 提示词
 * @returns 缓存的响应或 null
 */
export function getCachedResponse(prompt: string): string | null {
  try {
    const cacheKey = generateCacheKey(prompt)
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData)

      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        return data as string
      } else {
        // 缓存过期，删除缓存项
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (error) {
    console.warn('获取缓存的 AI 响应失败:', error)
  }

  return null
}

/**
 * 将 AI 响应存储到缓存
 * @param prompt 提示词
 * @param response 响应
 */
export function cacheResponse(prompt: string, response: string): void {
  try {
    const cacheKey = generateCacheKey(prompt)
    const cacheData = {
      data: response,
      timestamp: Date.now(),
    }

    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.warn('缓存 AI 响应失败:', error)
  }
}

/**
 * 清除所有 AI 响应缓存
 */
export function clearAICache(): void {
  try {
    const keysToRemove: string[] = []

    // 找到所有相关的缓存键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    // 删除所有相关的缓存项
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.warn('清除 AI 响应缓存失败:', error)
  }
}
