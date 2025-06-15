/**
 * 安全的 ID 生成器
 * 确保生成的 ID 在应用生命周期内唯一
 */

export class IdGenerator {
  private static counter = 0

  /**
   * 生成唯一 ID
   * 使用简单的递增计数器 + 时间戳确保唯一性
   */
  static generateId(): number {
    // 使用当前时间戳的后6位 + 递增计数器
    const timestamp = Date.now() % 1000000 // 取时间戳后6位
    this.counter++

    // 如果计数器超过999999，重置为0
    if (this.counter > 999999) {
      this.counter = 0
    }

    // 组合：时间戳(6位) + 计数器(6位)，确保12位数字的唯一性
    return timestamp * 1000000 + this.counter
  }

  /**
   * 生成字符串 ID（用于需要字符串 ID 的场景）
   */
  static generateStringId(): string {
    return `todo_${this.generateId()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 验证 ID 是否有效
   */
  static isValidId(id: number): boolean {
    return typeof id === 'number' && id > 0 && Number.isInteger(id)
  }

  /**
   * 重置计数器（主要用于测试）
   */
  static reset(): void {
    this.counter = 0
  }
}
