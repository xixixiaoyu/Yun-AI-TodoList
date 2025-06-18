/**
 * 安全工具集
 * 提供应用安全相关的工具函数和配置
 */

import DOMPurify from 'dompurify'

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

export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.deepseek.com'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
}

export function generateCSPString(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

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
      'a',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,

    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

export function isSecureURL(url: string): boolean {
  try {
    const parsedURL = new URL(url)

    if (!['https:', 'http:'].includes(parsedURL.protocol)) {
      return false
    }

    const suspiciousDomains = ['malware.com', 'phishing.com']

    return !suspiciousDomains.some((domain) => parsedURL.hostname.includes(domain))
  } catch {
    return false
  }
}

export class SecureStorage {
  private static readonly PREFIX = 'todo_app_'
  private static readonly MAX_SIZE = 5 * 1024 * 1024

  static setItem(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value)

      if (serialized.length > this.MAX_SIZE) {
        console.warn('Storage item too large:', key)
        return false
      }

      const prefixedKey = this.PREFIX + key
      localStorage.setItem(prefixedKey, serialized)
      return true
    } catch (error) {
      console.error('Failed to set storage item:', error)
      return false
    }
  }

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

  static cleanup(): void {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.PREFIX)) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              JSON.parse(value)
            }
          } catch {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      if (keysToRemove.length > 0) {
        console.warn(`Cleaned up ${keysToRemove.length} invalid storage items`)
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error)
    }
  }
}

export class SecureAPIClient {
  private static readonly TIMEOUT = 10000
  private static readonly MAX_RETRIES = 3

  static async secureRequest(
    url: string,
    options: SecureRequestInit = {},
    retries = 0
  ): Promise<Response> {
    if (!isSecureURL(url)) {
      throw new Error('Insecure URL detected')
    }

    const secureOptions: SecureRequestInit = {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)

    try {
      const response = await fetch(url, {
        ...secureOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status >= 500 && retries < this.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)))
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

export class InputValidator {
  static validateLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max
  }

  static containsScript(str: string): boolean {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ]

    return scriptPatterns.some((pattern) => pattern.test(str))
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .substring(0, 1000)
  }
}

export function initSecurity(): void {
  SecureStorage.cleanup()

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}
