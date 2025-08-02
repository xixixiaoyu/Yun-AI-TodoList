/**
 * 认证 API 服务
 * 处理用户认证相关的 API 请求
 */

import type {
  AuthResponse,
  CreateUserDto,
  LoginDto,
  PublicUser,
  RefreshTokenDto,
  SendVerificationCodeDto,
  VerifyEmailCodeDto,
} from '@shared/types'
import { ApiError, httpClient } from './api'

/**
 * 认证 API 类
 */
class AuthApi {
  private readonly baseEndpoint = '/api/v1/auth'

  /**
   * 用户登录
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<{ success: boolean; data: AuthResponse }>(
        `${this.baseEndpoint}/login`,
        credentials
      )

      // 验证响应数据结构
      if (
        !response.success ||
        !response.data ||
        !response.data.user ||
        !response.data.accessToken ||
        !response.data.refreshToken
      ) {
        throw new ApiError('Invalid response format from server', 500, 'INVALID_RESPONSE')
      }

      return response.data
    } catch (error) {
      if (error instanceof ApiError) {
        // 处理特定的认证错误
        if (error.status === 401) {
          throw new ApiError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
        }
        if (error.status === 429) {
          throw new ApiError('登录尝试过于频繁，请稍后再试', 429, 'TOO_MANY_ATTEMPTS')
        }
        if (error.status === 403) {
          throw new ApiError('账户已被锁定，请联系管理员', 403, 'ACCOUNT_LOCKED')
        }
      }

      throw error
    }
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(data: SendVerificationCodeDto): Promise<{ message: string }> {
    try {
      // 使用认证服务的验证码发送接口
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/send-verification-code`,
        data
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new ApiError('该邮箱已被注册', 409, 'EMAIL_EXISTS')
        }
        if (error.status === 429) {
          throw new ApiError('发送过于频繁，请稍后再试', 429, 'TOO_MANY_REQUESTS')
        }
        if (error.status === 422) {
          throw new ApiError('邮箱格式不正确', 422, 'INVALID_EMAIL')
        }
      }

      throw error
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyEmailCode(data: VerifyEmailCodeDto): Promise<{ message: string; valid: boolean }> {
    try {
      // 使用认证服务的验证码验证接口
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/verify-email-code`,
        { email: data.email, code: data.code }
      )

      return { message: response.message, valid: true }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new ApiError('验证码无效或已过期', 400, 'INVALID_CODE')
        }
        if (error.status === 429) {
          throw new ApiError('验证尝试过于频繁，请稍后再试', 429, 'TOO_MANY_ATTEMPTS')
        }
      }

      throw error
    }
  }

  /**
   * 用户注册（需要邮箱验证码）
   */
  async register(userData: CreateUserDto & { verificationCode: string }): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<{ success: boolean; data: AuthResponse }>(
        `${this.baseEndpoint}/register`,
        userData
      )

      // 验证响应数据结构
      if (
        !response.success ||
        !response.data ||
        !response.data.user ||
        !response.data.accessToken ||
        !response.data.refreshToken
      ) {
        throw new ApiError('Invalid response format from server', 500, 'INVALID_RESPONSE')
      }

      return response.data
    } catch (error) {
      if (error instanceof ApiError) {
        // 处理特定的注册错误
        if (error.status === 409) {
          const details = error.details
          if (details?.field === 'email') {
            throw new ApiError('该邮箱已被注册', 409, 'EMAIL_EXISTS')
          }
          if (details?.field === 'username') {
            throw new ApiError('该用户名已被使用', 409, 'USERNAME_EXISTS')
          }
          throw new ApiError('用户信息冲突', 409, 'USER_CONFLICT')
        }
        if (error.status === 400) {
          throw new ApiError('邮箱验证码无效或已过期', 400, 'INVALID_VERIFICATION_CODE')
        }
        if (error.status === 422) {
          throw new ApiError('输入信息格式不正确', 422, 'VALIDATION_ERROR')
        }
      }

      throw error
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<{ success: boolean; data: AuthResponse }>(
        `${this.baseEndpoint}/refresh`,
        {
          refreshToken,
        } as RefreshTokenDto
      )

      // 验证响应数据结构
      if (
        !response.success ||
        !response.data ||
        !response.data.user ||
        !response.data.accessToken ||
        !response.data.refreshToken
      ) {
        throw new ApiError('Invalid response format from server', 500, 'INVALID_RESPONSE')
      }

      return response.data
    } catch (error) {
      if (error instanceof ApiError) {
        // 处理令牌刷新错误
        if (error.status === 401) {
          throw new ApiError('刷新令牌已过期，请重新登录', 401, 'REFRESH_TOKEN_EXPIRED')
        }
        if (error.status === 403) {
          throw new ApiError('刷新令牌无效', 403, 'INVALID_REFRESH_TOKEN')
        }
      }

      throw error
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(`${this.baseEndpoint}/logout`)

      return response
    } catch (error) {
      // 登出失败不应该阻止客户端清除本地状态
      console.warn('Logout API call failed:', error)
      return { message: '登出成功' }
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<PublicUser> {
    try {
      const response = await httpClient.get<PublicUser>(`${this.baseEndpoint}/me`)

      return response
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError('用户未登录或令牌已过期', 401, 'UNAUTHORIZED')
      }

      throw error
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/verify-email`,
        { token }
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new ApiError('验证链接无效或已过期', 400, 'INVALID_VERIFICATION_TOKEN')
        }
        if (error.status === 409) {
          throw new ApiError('邮箱已经验证过了', 409, 'EMAIL_ALREADY_VERIFIED')
        }
      }

      throw error
    }
  }

  /**
   * 发送密码重置邮件
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/forgot-password`,
        { email }
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new ApiError('该邮箱未注册', 404, 'EMAIL_NOT_FOUND')
        }
        if (error.status === 429) {
          throw new ApiError('请求过于频繁，请稍后再试', 429, 'TOO_MANY_REQUESTS')
        }
      }

      throw error
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/reset-password`,
        { token, password: newPassword }
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new ApiError('重置链接无效或已过期', 400, 'INVALID_RESET_TOKEN')
        }
        if (error.status === 422) {
          throw new ApiError('新密码格式不正确', 422, 'INVALID_PASSWORD_FORMAT')
        }
      }

      throw error
    }
  }

  /**
   * 更改密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(
        `${this.baseEndpoint}/change-password`,
        { currentPassword, newPassword }
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new ApiError('当前密码错误', 401, 'INVALID_CURRENT_PASSWORD')
        }
        if (error.status === 422) {
          throw new ApiError('新密码格式不正确', 422, 'INVALID_NEW_PASSWORD')
        }
      }

      throw error
    }
  }
}

// 创建认证 API 实例
export const authApi = new AuthApi()

// 导出类型
export type {
  AuthResponse,
  CreateUserDto,
  LoginDto,
  PublicUser,
  RefreshTokenDto,
  SendVerificationCodeDto,
  VerifyEmailCodeDto,
}
