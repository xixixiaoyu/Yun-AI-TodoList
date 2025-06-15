import { describe, it, expect, beforeEach } from 'vitest'
import { IdGenerator } from '../idGenerator'

describe('IdGenerator', () => {
  beforeEach(() => {
    IdGenerator.reset()
  })

  it('should generate unique IDs', () => {
    const id1 = IdGenerator.generateId()
    const id2 = IdGenerator.generateId()
    const id3 = IdGenerator.generateId()

    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })

  it('should generate IDs in sequence when called rapidly', () => {
    const ids = []
    for (let i = 0; i < 100; i++) {
      ids.push(IdGenerator.generateId())
    }

    // 检查所有 ID 都是唯一的
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should generate valid positive integers', () => {
    for (let i = 0; i < 10; i++) {
      const id = IdGenerator.generateId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
      expect(Number.isInteger(id)).toBe(true)
    }
  })

  it('should validate IDs correctly', () => {
    expect(IdGenerator.isValidId(123)).toBe(true)
    expect(IdGenerator.isValidId(0)).toBe(false)
    expect(IdGenerator.isValidId(-1)).toBe(false)
    expect(IdGenerator.isValidId(1.5)).toBe(false)
    expect(IdGenerator.isValidId(NaN)).toBe(false)
    expect(IdGenerator.isValidId(Infinity)).toBe(false)
  })

  it('should generate string IDs with correct format', () => {
    const stringId = IdGenerator.generateStringId()
    expect(typeof stringId).toBe('string')
    expect(stringId).toMatch(/^todo_\d+_[a-z0-9]+$/)
  })

  it('should reset counter correctly', () => {
    IdGenerator.generateId()
    IdGenerator.generateId()
    IdGenerator.reset()

    // 重置后生成的 ID 应该从新的时间戳开始
    const id = IdGenerator.generateId()
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })
})
