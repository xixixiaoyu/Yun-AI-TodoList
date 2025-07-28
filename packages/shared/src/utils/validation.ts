/**
 * 数据验证工具函数
 */

import { REGEX_PATTERNS } from '../constants'
import type { CreateTodoDto, CreateUserDto, UpdateTodoDto } from '../types'

// 邮箱验证
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  return REGEX_PATTERNS.EMAIL.test(email.trim())
}

// 密码强度验证
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false
  return REGEX_PATTERNS.PASSWORD.test(password)
}

// 用户名验证
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false
  return REGEX_PATTERNS.USERNAME.test(username.trim())
}

// Todo 标题验证
export function isValidTodoTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false
  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed.length <= 500
}

// 优先级验证
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

// 时间估算格式验证
export function isValidTimeEstimate(estimate: string): boolean {
  if (!estimate || typeof estimate !== 'string') return false
  return REGEX_PATTERNS.TIME_ESTIMATE.test(estimate.trim())
}

// URL 验证
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  // 首先使用正则表达式进行基本验证
  if (!REGEX_PATTERNS.URL.test(url.trim())) return false

  // 然后使用 URL 构造函数进行更严格的验证
  try {
    new URL(url.trim())
    return true
  } catch {
    return false
  }
}

// UUID 验证
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false
  return REGEX_PATTERNS.UUID.test(uuid.trim())
}

// ISO 8601 日期格式验证
export function isValidISODate(date: string): boolean {
  if (!date || typeof date !== 'string') return false

  // 首先检查格式
  if (!REGEX_PATTERNS.ISO_DATE.test(date.trim())) return false

  // 然后检查是否是有效日期
  const parsedDate = new Date(date.trim())
  return !isNaN(parsedDate.getTime())
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

  if (dto.estimatedTime) {
    if (
      typeof dto.estimatedTime.text !== 'string' ||
      !isValidTimeEstimate(dto.estimatedTime.text)
    ) {
      errors.push('时间估算文本格式不正确')
    }
    if (typeof dto.estimatedTime.minutes !== 'number' || dto.estimatedTime.minutes < 0) {
      errors.push('时间估算分钟数必须为非负数')
    }
  }

  if (dto.dueDate && !isValidISODate(dto.dueDate)) {
    errors.push('截止日期格式不正确，请使用 ISO 8601 格式')
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

  if (dto.estimatedTime) {
    // Can be null to reset
    if (
      typeof dto.estimatedTime.text !== 'string' ||
      !isValidTimeEstimate(dto.estimatedTime.text)
    ) {
      errors.push('时间估算文本格式不正确')
    }
    if (typeof dto.estimatedTime.minutes !== 'number' || dto.estimatedTime.minutes < 0) {
      errors.push('时间估算分钟数必须为非负数')
    }
  }

  if (dto.dueDate !== undefined && !isValidISODate(dto.dueDate)) {
    errors.push('截止日期格式不正确，请使用 ISO 8601 格式')
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
  if (!title || typeof title !== 'string') return ''
  return title.trim().replace(/\s+/g, ' ')
}

export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return ''
  return username.trim().toLowerCase()
}
