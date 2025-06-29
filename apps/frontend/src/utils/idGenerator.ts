export class IdGenerator {
  private static counter = 0

  static generateId(): number {
    const timestamp = Date.now() % 1000000
    this.counter++

    if (this.counter > 999999) {
      this.counter = 0
    }

    return timestamp * 1000000 + this.counter
  }

  /**
   * 生成UUID格式的ID（与后端保持一致）
   */
  static generateUUID(): string {
    // 使用crypto API生成更安全的UUID
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
      return globalThis.crypto.randomUUID()
    }

    // 降级方案：手动生成UUID v4格式
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 生成字符串 ID（用于需要字符串 ID 的场景）
   * @deprecated 使用 generateUUID() 替代以保持与后端一致
   */
  static generateStringId(): string {
    return `todo_${this.generateId()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 统一的Todo ID生成器（推荐使用）
   */
  static generateTodoId(): string {
    return this.generateUUID()
  }

  /**
   * 检查ID是否为UUID格式
   */
  static isUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  /**
   * 检查ID是否为旧的字符串格式
   */
  static isLegacyStringId(id: string): boolean {
    return id.startsWith('todo_') && id.includes('_')
  }

  /**
   * 检查ID格式类型
   */
  static getIdType(id: string): 'uuid' | 'legacy' | 'unknown' {
    if (this.isUUID(id)) return 'uuid'
    if (this.isLegacyStringId(id)) return 'legacy'
    return 'unknown'
  }

  static isValidId(id: number): boolean {
    return typeof id === 'number' && id > 0 && Number.isInteger(id)
  }

  static reset(): void {
    this.counter = 0
  }
}
