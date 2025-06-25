/**
 * JWT 令牌管理器
 * 处理令牌的自动刷新、过期检测和存储管理
 */

import { authApi } from '../services/authApi'

/**
 * 令牌信息接口
 */
interface TokenInfo {
  accessToken: string
  refreshToken: string
  expiresAt: number // 过期时间戳
}

/**
 * 令牌管理器类
 */
class TokenManager {
  private refreshTimer: number | null = null
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 提前5分钟刷新
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
    REMEMBER_ME: 'auth_remember_me',
  }

  /**
   * 解析 JWT 令牌获取过期时间
   */
  private parseTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // 转换为毫秒
    } catch (error) {
      console.error('Failed to parse token:', error)
      return 0
    }
  }

  /**
   * 获取当前存储的令牌信息
   */
  getTokenInfo(): TokenInfo | null {
    const accessToken =
      localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN) ||
      sessionStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN)
    const refreshToken =
      localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN) ||
      sessionStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN)

    if (!accessToken || !refreshToken) {
      return null
    }

    const expiresAt = this.parseTokenExpiry(accessToken)

    return {
      accessToken,
      refreshToken,
      expiresAt,
    }
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(tokenInfo?: TokenInfo): boolean {
    const info = tokenInfo || this.getTokenInfo()
    if (!info) return true

    const now = Date.now()
    const timeUntilExpiry = info.expiresAt - now

    return timeUntilExpiry <= this.REFRESH_THRESHOLD
  }

  /**
   * 检查令牌是否已过期
   */
  isTokenExpired(tokenInfo?: TokenInfo): boolean {
    const info = tokenInfo || this.getTokenInfo()
    if (!info) return true

    return Date.now() >= info.expiresAt
  }

  /**
   * 保存令牌信息
   */
  saveTokens(accessToken: string, refreshToken: string, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage

    storage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    storage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken)

    if (rememberMe) {
      localStorage.setItem(this.STORAGE_KEYS.REMEMBER_ME, 'true')
    }

    // 设置自动刷新定时器
    this.scheduleTokenRefresh()
  }

  /**
   * 清除所有令牌
   */
  clearTokens(): void {
    // 清除定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    // 清除存储
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(this.STORAGE_KEYS.USER)
    localStorage.removeItem(this.STORAGE_KEYS.REMEMBER_ME)

    sessionStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN)
    sessionStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN)
    sessionStorage.removeItem(this.STORAGE_KEYS.USER)
  }

  /**
   * 安排令牌刷新
   */
  private scheduleTokenRefresh(): void {
    // 清除现有定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const tokenInfo = this.getTokenInfo()
    if (!tokenInfo) return

    const now = Date.now()
    const timeUntilRefresh = tokenInfo.expiresAt - now - this.REFRESH_THRESHOLD

    if (timeUntilRefresh > 0) {
      this.refreshTimer = window.setTimeout(() => {
        this.performAutoRefresh()
      }, timeUntilRefresh)

      // Token refresh scheduled - using console.group for debugging
      console.group('Token Management')
      console.warn(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)
      console.groupEnd()
    } else {
      // 令牌即将过期或已过期，立即刷新
      this.performAutoRefresh()
    }
  }

  /**
   * 执行自动刷新
   */
  private async performAutoRefresh(): Promise<void> {
    try {
      const tokenInfo = this.getTokenInfo()
      if (!tokenInfo) {
        console.warn('No token info available for refresh')
        return
      }

      console.warn('Performing automatic token refresh...')

      const response = await authApi.refreshToken(tokenInfo.refreshToken)

      // 保存新令牌
      const rememberMe = localStorage.getItem(this.STORAGE_KEYS.REMEMBER_ME) === 'true'
      this.saveTokens(response.accessToken, response.refreshToken, rememberMe)

      // 更新用户信息
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(response.user))

      console.warn('Token refreshed automatically')

      // 触发自定义事件通知应用
      window.dispatchEvent(
        new CustomEvent('tokenRefreshed', {
          detail: { user: response.user },
        })
      )
    } catch (error) {
      console.error('Automatic token refresh failed:', error)

      // 刷新失败，清除令牌并触发登出事件
      this.clearTokens()

      window.dispatchEvent(
        new CustomEvent('tokenRefreshFailed', {
          detail: { error },
        })
      )
    }
  }

  /**
   * 手动刷新令牌
   */
  async refreshToken(): Promise<boolean> {
    try {
      await this.performAutoRefresh()
      return true
    } catch (error) {
      console.error('Manual token refresh failed:', error)
      return false
    }
  }

  /**
   * 初始化令牌管理器
   */
  initialize(): void {
    // 检查现有令牌并设置刷新定时器
    const tokenInfo = this.getTokenInfo()
    if (tokenInfo) {
      if (this.isTokenExpired(tokenInfo)) {
        // 令牌已过期，尝试刷新
        this.performAutoRefresh()
      } else {
        // 令牌有效，设置刷新定时器
        this.scheduleTokenRefresh()
      }
    }

    // 监听页面可见性变化，在页面重新可见时检查令牌
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const currentTokenInfo = this.getTokenInfo()
        if (currentTokenInfo && this.isTokenExpiringSoon(currentTokenInfo)) {
          this.performAutoRefresh()
        }
      }
    })

    // 监听存储变化（多标签页同步）
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEYS.ACCESS_TOKEN) {
        if (event.newValue) {
          // 令牌更新，重新设置定时器
          this.scheduleTokenRefresh()
        } else {
          // 令牌被清除，清除定时器
          if (this.refreshTimer) {
            clearTimeout(this.refreshTimer)
            this.refreshTimer = null
          }
        }
      }
    })
  }

  /**
   * 销毁令牌管理器
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

// 创建单例实例
export const tokenManager = new TokenManager()

// 自动初始化
tokenManager.initialize()

// 导出类型
export type { TokenInfo }
