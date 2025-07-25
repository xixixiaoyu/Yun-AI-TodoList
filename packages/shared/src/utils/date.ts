/**
 * 日期时间工具函数
 */

// 格式化日期
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return '无效日期'
  }

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // 相对时间显示
  if (format === 'short') {
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 0 ? '刚刚' : `${diffMinutes}分钟前`
      }
      return `${diffHours}小时前`
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return d.toLocaleDateString('zh-CN')
    }
  }

  // 完整日期时间
  if (format === 'long') {
    return d.toLocaleString('zh-CN')
  }

  // 仅时间
  if (format === 'time') {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return d.toLocaleDateString('zh-CN')
}

// 检查日期是否过期
export function isOverdue(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.getTime() < now.getTime()
}

// 检查是否是今天
export function isToday(date: string | Date): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

// 检查是否是本周
export function isThisWeek(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()

  // 创建新的 Date 对象，避免修改原对象
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const endOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 6,
    23,
    59,
    59,
    999
  )

  return d >= startOfWeek && d <= endOfWeek
}

// 获取日期范围描述
export function getDateRangeDescription(date: string | Date): string {
  const d = new Date(date)

  if (isOverdue(d)) {
    return '已过期'
  }

  if (isToday(d)) {
    return '今天'
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) {
    return '明天'
  }

  if (isThisWeek(d)) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[d.getDay()]
  }

  return formatDate(d)
}

// 解析时间估算字符串为分钟数
export function parseTimeEstimate(estimate: string): number {
  if (!estimate || typeof estimate !== 'string') return 0

  const match = estimate.trim().match(/(\d+)\s*(分钟|小时|天|minutes?|hours?|days?)/i)
  if (!match) return 0

  const value = parseInt(match[1], 10)
  if (isNaN(value) || value <= 0) return 0

  const unit = match[2].toLowerCase()

  if (unit.includes('分钟') || unit.includes('minute')) {
    return value
  } else if (unit.includes('小时') || unit.includes('hour')) {
    return value * 60
  } else if (unit.includes('天') || unit.includes('day')) {
    return value * 60 * 24
  }

  return 0
}

// 将分钟数格式化为可读的时间估算
export function formatTimeEstimate(minutes: number): string {
  if (!minutes || minutes <= 0) return '0分钟'

  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`
  } else if (minutes < 60 * 24) {
    const hours = minutes / 60
    // 如果是整数小时，不显示小数
    if (hours % 1 === 0) {
      return `${Math.round(hours)}小时`
    }
    return `${Math.round(hours * 10) / 10}小时`
  } else {
    const days = minutes / (60 * 24)
    // 如果是整数天，不显示小数
    if (days % 1 === 0) {
      return `${Math.round(days)}天`
    }
    return `${Math.round(days * 10) / 10}天`
  }
}

// 生成 ISO 日期字符串
export function toISOString(date: Date = new Date()): string {
  return date.toISOString()
}

// 解析 ISO 日期字符串
export function fromISOString(isoString: string): Date {
  return new Date(isoString)
}

// 获取日期的开始时间（00:00:00）
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// 获取日期的结束时间（23:59:59）
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
