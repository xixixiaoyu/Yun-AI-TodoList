/**
 * 数据验证工具函数
 */

import type { CreateTodoDto, CreateUserDto, UpdateTodoDto } from '../types'

// 邮箱验证
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 密码强度验证
export function isValidPassword(password: string): boolean {
  // 至少8位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return passwordRegex.test(password)
}

// 用户名验证
export function isValidUsername(username: string): boolean {
  // 3-20位，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// Todo 标题验证
export function isValidTodoTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 500
}

// 优先级验证
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

// 时间估算格式验证
export function isValidTimeEstimate(estimate: string): boolean {
  const timeRegex = /^\d+\s*(分钟|小时|天|minutes?|hours?|days?)$/i
  return timeRegex.test(estimate.trim())
}

// URL 验证
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// UUID 验证
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 验证 CreateTodoDto
export function validateCreateTodoDto(dto: CreateTodoDto): string[] {
  const errors: string[] = []

  if (!dto.title || !isValidTodoTitle(dto.title)) {
    errors.push('标题不能为空且长度不能超过500字符')
  }

  if (dto.description && dto.description.length > 2000) {
    errors.push('描述长度不能超过2000字符')
  }

  if (dto.priority && !isValidPriority(dto.priority)) {
    errors.push('优先级必须是1-5之间的整数')
  }

  if (dto.estimatedTime && !isValidTimeEstimate(dto.estimatedTime)) {
    errors.push('时间估算格式不正确')
  }

  if (dto.dueDate && isNaN(Date.parse(dto.dueDate))) {
    errors.push('截止日期格式不正确')
  }

  return errors
}

// 验证 UpdateTodoDto
export function validateUpdateTodoDto(dto: UpdateTodoDto): string[] {
  const errors: string[] = []

  if (dto.title !== undefined && !isValidTodoTitle(dto.title)) {
    errors.push('标题不能为空且长度不能超过500字符')
  }

  if (dto.description !== undefined && dto.description.length > 2000) {
    errors.push('描述长度不能超过2000字符')
  }

  if (dto.priority !== undefined && !isValidPriority(dto.priority)) {
    errors.push('优先级必须是1-5之间的整数')
  }

  if (dto.estimatedTime !== undefined && !isValidTimeEstimate(dto.estimatedTime)) {
    errors.push('时间估算格式不正确')
  }

  if (dto.dueDate !== undefined && isNaN(Date.parse(dto.dueDate))) {
    errors.push('截止日期格式不正确')
  }

  return errors
}

// 验证 CreateUserDto
export function validateCreateUserDto(dto: CreateUserDto): string[] {
  const errors: string[] = []

  if (!dto.email || !isValidEmail(dto.email)) {
    errors.push('邮箱格式不正确')
  }

  if (!dto.username || !isValidUsername(dto.username)) {
    errors.push('用户名必须是3-20位字母、数字或下划线')
  }

  if (!dto.password || !isValidPassword(dto.password)) {
    errors.push('密码必须至少8位，包含字母和数字')
  }

  return errors
}

// 清理和标准化数据
export function sanitizeTodoTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase()
}
