const TIME_SYNC_ENDPOINT = 'https://worldtimeapi.org/api/ip'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const SYNC_THRESHOLD = 5000 // 5 seconds

interface TimeResponse {
  datetime: string
  unixtime: number
}

let lastSyncTime: number | null = null
let timeOffset: number = 0

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchWithTimeout = async (
  url: string,
  timeout: number = 5000
): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

async function fetchServerTime(attempt: number = 0): Promise<TimeResponse> {
  try {
    const response = await fetchWithTimeout(TIME_SYNC_ENDPOINT)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, attempt))
      return fetchServerTime(attempt + 1)
    }
    throw error
  }
}

export async function syncWithServerTime(): Promise<number> {
  try {
    // 如果上次同步时间在阈值内，直接返回已知的时间偏移
    if (lastSyncTime && Date.now() - lastSyncTime < SYNC_THRESHOLD) {
      return timeOffset
    }

    const beforeRequest = Date.now()
    const serverTime = await fetchServerTime()
    const afterRequest = Date.now()
    const requestTime = afterRequest - beforeRequest

    // 如果请求时间太长，可能不够准确，重试
    if (requestTime > SYNC_THRESHOLD) {
      return syncWithServerTime()
    }

    const serverTimestamp = serverTime.unixtime * 1000
    const localTimestamp = (beforeRequest + afterRequest) / 2
    timeOffset = serverTimestamp - localTimestamp
    lastSyncTime = Date.now()

    return timeOffset
  } catch (error) {
    console.error('Error syncing time:', error)
    // 如果同步失败，返回最后一次已知的偏移，如果没有则返回0
    return timeOffset || 0
  }
}

export function getAdjustedTime(): number {
  return Date.now() + (timeOffset || 0)
}

// 定期同步时间
export function startPeriodicSync(interval: number = 60 * 60 * 1000): () => void {
  const syncInterval = setInterval(async () => {
    try {
      await syncWithServerTime()
    } catch (error) {
      console.error('Periodic time sync failed:', error)
    }
  }, interval)

  return () => clearInterval(syncInterval)
}

// 导出用于测试的内部状态
export const __timeServiceInternals = {
  timeOffset,
  lastSyncTime,
  resetState: () => {
    timeOffset = 0
    lastSyncTime = null
  },
}
