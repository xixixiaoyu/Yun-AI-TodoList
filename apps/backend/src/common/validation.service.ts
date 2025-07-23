import { Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ValidationService {
  /**
   * 验证邮箱格式
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email)
  }

  /**
   * 验证用户名格式
   */
  validateUsername(username: string): boolean {
    // 用户名：3-20字符，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  /**
   * 验证待办事项标题
   */
  validateTodoTitle(title: string): boolean {
    return title && title.trim().length >= 1 && title.trim().length <= 200
  }

  /**
   * 验证优先级
   */
  validatePriority(priority?: number): boolean {
    return priority === undefined || priority === null || (priority >= 1 && priority <= 5)
  }

  /**
   * 验证预估时间（分钟）
   */
  validateEstimatedTime(estimatedTime?: number): boolean {
    return (
      estimatedTime === undefined ||
      estimatedTime === null ||
      (estimatedTime > 0 && estimatedTime <= 10080)
    ) // 最多一周
  }

  /**
   * 验证账户状态
   */
  validateAccountStatus(status: string): boolean {
    const validStatuses = ['active', 'inactive', 'suspended', 'deleted']
    return validStatuses.includes(status)
  }

  /**
   * 验证AI温度参数
   */
  validateAITemperature(temperature: number): boolean {
    return temperature >= 0.0 && temperature <= 2.0
  }

  /**
   * 验证AI最大令牌数
   */
  validateAIMaxTokens(maxTokens: number): boolean {
    return maxTokens >= 100 && maxTokens <= 8000
  }

  /**
   * 验证提醒时间（分钟）
   */
  validateReminderMinutes(minutes: number): boolean {
    return minutes > 0 && minutes <= 10080 // 最多一周
  }

  /**
   * 验证文件大小（字节）
   */
  validateFileSize(size: number): boolean {
    return size > 0 && size <= 52428800 // 50MB
  }

  /**
   * 验证文件名
   */
  validateFilename(filename: string): boolean {
    return filename && filename.trim().length >= 1 && filename.trim().length <= 255
  }

  /**
   * 验证邮箱验证码类型
   */
  validateVerificationType(type: string): boolean {
    const validTypes = ['register', 'login', 'reset_password', 'change_email']
    return validTypes.includes(type)
  }

  /**
   * 验证邮箱验证码格式
   */
  validateVerificationCode(code: string): boolean {
    return code && code.length === 6 && /^\d{6}$/.test(code)
  }

  /**
   * 验证尝试次数
   */
  validateAttempts(attempts: number): boolean {
    return attempts >= 0 && attempts <= 10
  }

  /**
   * 综合验证待办事项数据
   */
  validateTodoData(data: any): void {
    if (!this.validateTodoTitle(data.title)) {
      throw new BadRequestException('待办事项标题必须在1-200字符之间')
    }

    if (!this.validatePriority(data.priority)) {
      throw new BadRequestException('优先级必须在1-5之间')
    }

    if (!this.validateEstimatedTime(data.estimatedTime)) {
      throw new BadRequestException('预估时间必须为正数且不超过一周')
    }
  }

  /**
   * 综合验证用户数据
   */
  validateUserData(data: any): void {
    if (!this.validateEmail(data.email)) {
      throw new BadRequestException('邮箱格式不正确')
    }

    if (!this.validateUsername(data.username)) {
      throw new BadRequestException('用户名必须为3-20字符，只能包含字母、数字、下划线')
    }

    if (data.accountStatus && !this.validateAccountStatus(data.accountStatus)) {
      throw new BadRequestException('账户状态不正确')
    }
  }

  /**
   * 综合验证用户偏好数据
   */
  validateUserPreferencesData(data: any): void {
    if (data.aiTemperature !== undefined && !this.validateAITemperature(data.aiTemperature)) {
      throw new BadRequestException('AI温度参数必须在0.0-2.0之间')
    }

    if (data.aiMaxTokens !== undefined && !this.validateAIMaxTokens(data.aiMaxTokens)) {
      throw new BadRequestException('AI最大令牌数必须在100-8000之间')
    }

    if (data.reminderMinutes !== undefined && !this.validateReminderMinutes(data.reminderMinutes)) {
      throw new BadRequestException('提醒时间必须为正数且不超过一周')
    }
  }

  /**
   * 综合验证文档数据
   */
  validateDocumentData(data: any): void {
    if (!this.validateFilename(data.filename)) {
      throw new BadRequestException('文件名必须在1-255字符之间')
    }

    if (!this.validateFileSize(data.fileSize)) {
      throw new BadRequestException('文件大小不能超过50MB')
    }
  }

  /**
   * 综合验证邮箱验证码数据
   */
  validateEmailVerificationData(data: any): void {
    if (!this.validateEmail(data.email)) {
      throw new BadRequestException('邮箱格式不正确')
    }

    if (!this.validateVerificationType(data.type)) {
      throw new BadRequestException('验证类型不正确')
    }

    if (data.code && !this.validateVerificationCode(data.code)) {
      throw new BadRequestException('验证码必须为6位数字')
    }

    if (data.attempts !== undefined && !this.validateAttempts(data.attempts)) {
      throw new BadRequestException('尝试次数不能超过10次')
    }
  }
}
