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
   * 生成字符串 ID（用于需要字符串 ID 的场景）
   */
  static generateStringId(): string {
    return `todo_${this.generateId()}_${Math.random().toString(36).substring(2, 11)}`
  }

  static isValidId(id: number): boolean {
    return typeof id === 'number' && id > 0 && Number.isInteger(id)
  }

  static reset(): void {
    this.counter = 0
  }
}
