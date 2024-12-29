import { getAIResponse } from './deepseekService'

const INSPIRATION_KEY = 'dailyInspiration'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CachedInspiration {
  text: string
  timestamp: number
  language: string
}

const getDefaultInspiration = (language: string): string => {
  return language === 'zh'
    ? '每一天都是新的开始，珍惜当下，创造美好的未来。'
    : 'Every day is a new beginning. Cherish the present and create a beautiful future.'
}

const getCachedInspiration = (): CachedInspiration | null => {
  try {
    const cached = localStorage.getItem(INSPIRATION_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('Error reading cached inspiration:', error)
  }
  return null
}

const setCachedInspiration = (inspiration: string, language: string) => {
  try {
    const cache: CachedInspiration = {
      text: inspiration,
      timestamp: Date.now(),
      language,
    }
    localStorage.setItem(INSPIRATION_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error caching inspiration:', error)
  }
}

const isCacheValid = (cache: CachedInspiration, language: string): boolean => {
  const now = Date.now()
  return cache.language === language && now - cache.timestamp < CACHE_DURATION
}

export async function getDailyInspiration(language: string): Promise<string> {
  try {
    const cached = getCachedInspiration()
    if (cached && isCacheValid(cached, language)) {
      return cached.text
    }
    return refreshInspiration(language)
  } catch (error) {
    console.error('Error getting daily inspiration:', error)
    return getDefaultInspiration(language)
  }
}

export async function refreshInspiration(language: string): Promise<string> {
  try {
    const prompt =
      language === 'zh'
        ? '请生成一句对人生最具指导意义或激励作用的短句'
        : 'Please generate a short, meaningful quote that provides guidance or inspiration for life'

    const inspiration = await getAIResponse(prompt, language, 1.5)
    if (!inspiration) {
      throw new Error('Empty response from AI')
    }

    setCachedInspiration(inspiration, language)
    return inspiration
  } catch (error) {
    console.error('Error refreshing inspiration:', error)
    // 如果有缓存的灵感，即使过期也返回
    const cached = getCachedInspiration()
    if (cached) {
      return cached.text
    }
    return getDefaultInspiration(language)
  }
}

export function clearInspirationCache(): void {
  try {
    localStorage.removeItem(INSPIRATION_KEY)
  } catch (error) {
    console.error('Error clearing inspiration cache:', error)
  }
}
