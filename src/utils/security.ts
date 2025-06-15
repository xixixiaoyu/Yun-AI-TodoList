/**
 * 安全工具集
 * 提供应用安全相关的工具函数和配置
 */

import DOMPurify from 'dompurify'

// 类型声明
interface SecureRequestInit {
  method?: string
  headers?: Record<string, string>
  body?: string
  credentials?: 'same-origin' | 'include' | 'omit'
  signal?: {
    aborted: boolean
    addEventListener: (type: string, listener: () => void) => void
    removeEventListener: (type: string, listener: () => void) => void
  }
}

/**
 * 内容安全策略配置
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // 开发环境可能需要 unsafe-inline
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.deepseek.com'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

/**
 * 生成 CSP 字符串
 */
export function generateCSPString(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * 安全的 HTML 清理
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,

    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}

/**
 * 验证 URL 安全性
 */
export function isSecureURL(url: string): boolean {
  try {
    const parsedURL = new URL(url)

    // 只允许 https 和 http 协议
    if (!['https:', 'http:'].includes(parsedURL.protocol)) {
      return false
    }

    // 检查是否为恶意域名（简单示例）
    const suspiciousDomains = [
      'malware.com',
      'phishing.com'
      // 添加更多已知恶意域名
    ]

    return !suspiciousDomains.some(domain => parsedURL.hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * 安全的本地存储操作
 */
export class SecureStorage {
  private static readonly PREFIX = 'todo_app_'
  private static readonly MAX_SIZE = 5 * 1024 * 1024 // 5MB

  /**
   * 安全地设置存储项
   */
  static setItem(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value)

      // 检查大小限制
      if (serialized.length > this.MAX_SIZE) {
        console.warn('Storage item too large:', key)
        return false
      }

      // 添加前缀防止命名冲突
      const prefixedKey = this.PREFIX + key
      localStorage.setItem(prefixedKey, serialized)
      return true
    } catch (error) {
      console.error('Failed to set storage item:', error)
      return false
    }
  }

  /**
   * 安全地获取存储项
   */
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const prefixedKey = this.PREFIX + key
      const item = localStorage.getItem(prefixedKey)

      if (item === null) {
        return defaultValue
      }

      return JSON.parse(item)
    } catch (error) {
      console.error('Failed to get storage item:', error)
      return defaultValue
    }
  }

  /**
   * 移除存储项
   */
  static removeItem(key: string): void {
    try {
      const prefixedKey = this.PREFIX + key
      localStorage.removeItem(prefixedKey)
    } catch (error) {
      console.error('Failed to remove storage item:', error)
    }
  }

  /**
   * 清理过期或无效的存储项
   */
  static cleanup(): void {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.PREFIX)) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              JSON.parse(value) // 验证是否为有效 JSON
            }
          } catch {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))

      if (keysToRemove.length > 0) {
        console.warn(`Cleaned up ${keysToRemove.length} invalid storage items`)
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error)
    }
  }
}

/**
 * API 请求安全包装器
 */
export class SecureAPIClient {
  private static readonly TIMEOUT = 10000 // 10秒超时
  private static readonly MAX_RETRIES = 3

  /**
   * 安全的 fetch 请求
   */
  static async secureRequest(
    url: string,
    options: SecureRequestInit = {},
    retries = 0
  ): Promise<Response> {
    // 验证 URL
    if (!isSecureURL(url)) {
      throw new Error('Insecure URL detected')
    }

    // 设置默认安全选项
    const secureOptions: SecureRequestInit = {
      ...options,
      credentials: 'same-origin', // 防止 CSRF
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    // 创建带超时的 AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)

    try {
      const response = await fetch(url, {
        ...secureOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 检查响应状态
      if (!response.ok) {
        if (response.status >= 500 && retries < this.MAX_RETRIES) {
          // 服务器错误时重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
          return this.secureRequest(url, options, retries + 1)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }
}

/**
 * 输入验证工具
 */
export class InputValidator {
  /**
   * 验证字符串长度
   */
  static validateLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max
  }

  /**
   * 验证是否包含恶意脚本
   */
  static containsScript(str: string): boolean {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ]

    return scriptPatterns.some(pattern => pattern.test(str))
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/javascript:/gi, '') // 移除 javascript: 协议
      .substring(0, 1000) // 限制长度
  }
}

// 初始化安全措施
export function initSecurity(): void {
  // 清理存储
  SecureStorage.cleanup()

  // 设置全局错误处理
  window.addEventListener('error', event => {
    console.error('Global error:', event.error)
    // 可以发送到错误监控服务
  })

  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason)
    // 可以发送到错误监控服务
  })
}
