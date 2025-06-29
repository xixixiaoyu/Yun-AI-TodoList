/**
 * 认证状态管理 Composable
 * 管理用户登录状态、令牌存储、自动登录等功能
 */

import type { AuthResponse, CreateUserDto, LoginDto, PublicUser } from '@shared/types'
import { authApi } from '../services/authApi'
import { tokenManager } from '../utils/tokenManager'

// 认证状态接口
interface AuthState {
  user: PublicUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// 全局认证状态
const authState = reactive<AuthState>({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
})

// 存储键名
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  REMEMBER_ME: 'auth_remember_me',
} as const

/**
 * 认证 Composable
 */
export function useAuth() {
  // 响应式状态
  const user = readonly(toRef(authState, 'user'))
  const isAuthenticated = readonly(toRef(authState, 'isAuthenticated'))
  const isLoading = readonly(toRef(authState, 'isLoading'))

  /**
   * 从存储中加载认证状态
   */
  const loadAuthState = (): boolean => {
    try {
      // 使用 tokenManager 获取令牌信息
      const tokenInfo = tokenManager.getTokenInfo()

      // 尝试从 localStorage 和 sessionStorage 获取用户信息
      const userStr =
        localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER)

      if (tokenInfo && userStr) {
        const user = JSON.parse(userStr) as PublicUser

        // 验证令牌是否过期
        if (!tokenManager.isTokenExpired(tokenInfo)) {
          authState.accessToken = tokenInfo.accessToken
          authState.refreshToken = tokenInfo.refreshToken
          authState.user = user
          authState.isAuthenticated = true

          console.log('Auth state loaded from storage')
          return true
        } else {
          // 令牌过期，尝试刷新
          if (tokenInfo.refreshToken) {
            refreshAccessToken()
          } else {
            clearAuthState()
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
      clearAuthState()
    }

    return false
  }

  /**
   * 保存认证状态到 localStorage
   */
  const saveAuthState = (authResponse: AuthResponse, rememberMe = false) => {
    try {
      authState.user = authResponse.user
      authState.accessToken = authResponse.accessToken
      authState.refreshToken = authResponse.refreshToken
      authState.isAuthenticated = true

      // 使用令牌管理器保存令牌
      tokenManager.saveTokens(authResponse.accessToken, authResponse.refreshToken, rememberMe)

      // 保存用户信息
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(authResponse.user))

      console.log('Auth state saved to storage')
    } catch (error) {
      console.error('Failed to save auth state:', error)
    }
  }

  /**
   * 清除认证状态
   */
  const clearAuthState = () => {
    authState.user = null
    authState.accessToken = null
    authState.refreshToken = null
    authState.isAuthenticated = false

    // 使用令牌管理器清除令牌
    tokenManager.clearTokens()

    console.log('Auth state cleared')
  }

  /**
   * 检查令牌是否有效
   */
  const _isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp > currentTime
    } catch {
      return false
    }
  }

  /**
   * 刷新访问令牌
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!authState.refreshToken) {
      return false
    }

    try {
      console.log('Refreshing access token...')

      // 调用刷新令牌 API
      const response = await authApi.refreshToken(authState.refreshToken)

      // 保存新的认证状态
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
      saveAuthState(response, rememberMe)

      return true
    } catch (error) {
      console.error('Failed to refresh token:', error)
      clearAuthState()
      return false
    }
  }

  /**
   * 用户登录
   */
  const login = async (credentials: LoginDto & { rememberMe?: boolean }): Promise<void> => {
    authState.isLoading = true

    try {
      console.log('Logging in user:', credentials.email)

      // 调用登录 API
      const response = await authApi.login({
        email: credentials.email,
        password: credentials.password,
      })

      // 保存认证状态
      saveAuthState(response, credentials.rememberMe)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      authState.isLoading = false
    }
  }

  /**
   * 用户注册
   */
  const register = async (userData: CreateUserDto): Promise<void> => {
    authState.isLoading = true

    try {
      console.log('Registering user:', userData.email)

      // 调用注册 API（注册成功后会自动返回认证信息）
      const response = await authApi.register(userData)

      // 保存认证状态（注册后自动登录）
      saveAuthState(response, false) // 注册时默认不记住登录状态
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      authState.isLoading = false
    }
  }

  /**
   * 忘记密码
   */
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      authState.isLoading = true
      await authApi.requestPasswordReset(email)
    } catch (error: unknown) {
      console.error('Forgot password failed:', error)
      throw error
    } finally {
      authState.isLoading = false
    }
  }

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user')

      // 调用登出 API
      await authApi.logout()

      // 清除本地状态
      clearAuthState()
    } catch (error) {
      console.error('Logout failed:', error)
      // 即使 API 调用失败，也要清除本地状态
      clearAuthState()
    }
  }

  /**
   * 获取认证头
   */
  const getAuthHeaders = (): Record<string, string> => {
    if (authState.accessToken) {
      return {
        Authorization: `Bearer ${authState.accessToken}`,
      }
    }
    return {}
  }

  /**
   * 初始化认证状态
   */
  const initAuth = () => {
    loadAuthState()

    // 监听令牌刷新事件
    window.addEventListener('tokenRefreshed', (event: Event) => {
      const { user } = (event as CustomEvent).detail
      authState.user = user
      console.log('Auth state updated after token refresh')
    })

    // 监听令牌刷新失败事件
    window.addEventListener('tokenRefreshFailed', () => {
      clearAuthState()
      console.log('Auth state cleared after token refresh failure')
    })
  }

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading,

    // 方法
    login,
    register,
    logout,
    forgotPassword,
    refreshAccessToken,
    getAuthHeaders,
    initAuth,
    clearAuthState,
  }
}
