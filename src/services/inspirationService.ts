import { getAIResponse } from './deepseekService'

const INSPIRATION_KEY = 'dailyInspiration'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const ERROR_RETRY_COUNT = 3
const ERROR_RETRY_DELAY = 1000 // 1 second

interface CachedInspiration {
  text: string
  timestamp: number
  language: string
  retryCount?: number
  lastError?: string
}

let refreshPromise: Promise<string> | null = null

const getDefaultInspiration = (language: string): string => {
  return language === 'zh'
    ? '每一天都是新的开始，珍惜当下，创造美好的未来。'
    : 'Every day is a new beginning. Cherish the present and create a beautiful future.'
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getCachedInspiration = (): CachedInspiration | null => {
  try {
    const cached = localStorage.getItem(INSPIRATION_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('Error reading cached inspiration:', error)
    // 清除可能损坏的缓存
    localStorage.removeItem(INSPIRATION_KEY)
  }
  return null
}

const setCachedInspiration = (inspiration: string, language: string, error?: Error) => {
  try {
    const cache: CachedInspiration = {
      text: inspiration,
      timestamp: Date.now(),
      language,
      retryCount: error ? (getCachedInspiration()?.retryCount || 0) + 1 : 0,
      lastError: error?.message,
    }
    localStorage.setItem(INSPIRATION_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error caching inspiration:', error)
  }
}

const isCacheValid = (cache: CachedInspiration, language: string): boolean => {
  const now = Date.now()
  return (
    cache.language === language &&
    now - cache.timestamp < CACHE_DURATION &&
    (!cache.retryCount || cache.retryCount < ERROR_RETRY_COUNT)
  )
}

export async function getDailyInspiration(language: string): Promise<string> {
  try {
    const cached = getCachedInspiration()
    if (cached && isCacheValid(cached, language)) {
      // 如果缓存有效但有错误计数，在后台刷新
      if (cached.retryCount && cached.retryCount > 0) {
        refreshInspiration(language).catch(console.error)
      }
      return cached.text
    }
    return refreshInspiration(language)
  } catch (error) {
    console.error('Error getting daily inspiration:', error)
    const cached = getCachedInspiration()
    return cached?.text || getDefaultInspiration(language)
  }
}

export async function refreshInspiration(language: string): Promise<string> {
  // 如果已经有刷新在进行中，返回该Promise
  if (refreshPromise) {
    return refreshPromise
  }

  try {
    refreshPromise = (async () => {
      const prompt =
        language === 'zh'
          ? '请生成一句对人生最具指导意义或激励作用的短句'
          : 'Please generate a short, meaningful quote that provides guidance or inspiration for life'

      let lastError: Error | undefined
      for (let i = 0; i < ERROR_RETRY_COUNT; i++) {
        try {
          const inspiration = await getAIResponse(prompt, language, 1.5)
          if (!inspiration) {
            throw new Error('Empty response from AI')
          }

          setCachedInspiration(inspiration, language)
          return inspiration
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          if (i < ERROR_RETRY_COUNT - 1) {
            await delay(ERROR_RETRY_DELAY * Math.pow(2, i))
          }
        }
      }

      // 如果所有重试都失败了
      const cached = getCachedInspiration()
      const fallbackText = cached?.text || getDefaultInspiration(language)
      if (lastError) {
        setCachedInspiration(fallbackText, language, lastError)
      }
      return fallbackText
    })()

    return await refreshPromise
  } catch (error) {
    console.error('Error refreshing inspiration:', error)
    const cached = getCachedInspiration()
    return cached?.text || getDefaultInspiration(language)
  } finally {
    refreshPromise = null
  }
}

export function clearInspirationCache(): void {
  try {
    localStorage.removeItem(INSPIRATION_KEY)
    refreshPromise = null
  } catch (error) {
    console.error('Error clearing inspiration cache:', error)
  }
}
