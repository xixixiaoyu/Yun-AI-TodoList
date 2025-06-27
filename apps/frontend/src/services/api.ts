/**
 * HTTP 客户端基础配置
 * 处理请求拦截、响应拦截、错误处理等
 */

import type { AuthResponse, CreateUserDto, LoginDto, RefreshTokenDto } from '@shared/types'

// 令牌刷新相关
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

// API 基础配置
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3000'
const API_TIMEOUT = 10000 // 10秒超时

// 请求重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

// 错误类型定义
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 网络错误检测
const isNetworkError = (error: {
  response?: unknown
  code?: string
  message?: string
}): boolean => {
  return (
    !error.response &&
    (error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      false)
  )
}

// 延迟函数
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * HTTP 客户端类
 */
class HttpClient {
  private baseURL: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): Record<string, string> {
    const token =
      localStorage.getItem('auth_access_token') || sessionStorage.getItem('auth_access_token')

    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  /**
   * 构建完整的请求头
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...customHeaders,
    }
  }

  /**
   * 处理响应
   */
  private async handleResponse(
    response: Response,
    originalUrl?: string,
    originalOptions?: RequestInit
  ): Promise<unknown> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    let data: unknown
    try {
      data = isJson ? await response.json() : await response.text()
    } catch {
      throw new ApiError('Failed to parse response', response.status)
    }

    if (!response.ok) {
      // 处理 401 未授权错误，尝试刷新令牌
      if (response.status === 401 && originalUrl && originalOptions) {
        const newToken = await this.handleTokenRefresh()
        if (newToken) {
          // 使用新令牌重试请求
          const retryOptions = {
            ...originalOptions,
            headers: {
              ...originalOptions.headers,
              Authorization: `Bearer ${newToken}`,
            },
          }

          const retryResponse = await fetch(originalUrl, retryOptions)
          return this.handleResponse(retryResponse) // 递归调用，但不再传递重试参数避免无限循环
        }
      }

      const errorData = data as any
      const message = errorData?.message || errorData?.error || `HTTP ${response.status}`
      const code = errorData?.code || response.status.toString()

      throw new ApiError(message, response.status, code, errorData as Record<string, unknown>)
    }

    return data
  }

  /**
   * 处理令牌刷新
   */
  private async handleTokenRefresh(): Promise<string | null> {
    // 如果已经在刷新中，等待刷新完成
    if (isRefreshing && refreshPromise) {
      try {
        return await refreshPromise
      } catch {
        return null
      }
    }

    // 开始刷新流程
    isRefreshing = true
    refreshPromise = this.performTokenRefresh()

    try {
      const newToken = await refreshPromise
      return newToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }

  /**
   * 执行令牌刷新
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken =
      localStorage.getItem('auth_refresh_token') || sessionStorage.getItem('auth_refresh_token')

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh token request failed')
      }

      const data = await response.json()
      const newAccessToken = data.accessToken

      // 更新存储的令牌
      const storage = localStorage.getItem('auth_access_token') ? localStorage : sessionStorage
      storage.setItem('auth_access_token', newAccessToken)

      if (data.refreshToken) {
        storage.setItem('auth_refresh_token', data.refreshToken)
      }

      console.log('Token refreshed successfully')
      return newAccessToken
    } catch (error) {
      // 刷新失败，清除所有认证信息
      this.clearAuthTokens()
      throw error
    }
  }

  /**
   * 清除认证令牌
   */
  private clearAuthTokens(): void {
    localStorage.removeItem('auth_access_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_access_token')
    sessionStorage.removeItem('auth_refresh_token')
    sessionStorage.removeItem('auth_user')
  }

  /**
   * 执行请求（带重试机制）
   */
  private async executeRequest(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<unknown> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse(response, url, options)
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      const errorObj = error as any

      // 检查是否需要重试
      const shouldRetry =
        retryCount < RETRY_CONFIG.maxRetries &&
        (isNetworkError(errorObj) ||
          (error instanceof ApiError && RETRY_CONFIG.retryableStatuses.includes(error.status || 0)))

      if (shouldRetry) {
        const delayMs = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount) // 指数退避
        await delay(delayMs)
        return this.executeRequest(url, options, retryCount + 1)
      }

      // 处理特定错误
      if (errorObj?.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT')
      }

      if (isNetworkError(errorObj)) {
        throw new ApiError('Network error, please check your connection', 0, 'NETWORK_ERROR')
      }

      throw error
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.executeRequest(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    }) as Promise<T>
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    return this.executeRequest(url.toString(), {
      method: 'POST',
      headers: this.buildHeaders(customHeaders),
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    return this.executeRequest(url.toString(), {
      method: 'PUT',
      headers: this.buildHeaders(customHeaders),
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    return this.executeRequest(url.toString(), {
      method: 'PATCH',
      headers: this.buildHeaders(customHeaders),
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    return this.executeRequest(url.toString(), {
      method: 'DELETE',
      headers: this.buildHeaders(),
    }) as Promise<T>
  }
}

// 创建默认的 HTTP 客户端实例
export const httpClient = new HttpClient()

// 导出类型和工具
export { HttpClient }
export type { AuthResponse, CreateUserDto, LoginDto, RefreshTokenDto }
