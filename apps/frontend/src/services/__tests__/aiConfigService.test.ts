import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkAIAvailability, getAIStatusMessage } from '../aiConfigService'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('aiConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAIAvailability', () => {
    it('应该在本地存储有 Deepseek API 密钥时返回 true', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'deepseek_api_key') return 'test-deepseek-key'
        return null
      })

      const result = checkAIAvailability()

      expect(result).toBe(true)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('deepseek_api_key')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('openai_api_key')
    })

    it('应该在本地存储有 OpenAI API 密钥时返回 true', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'openai_api_key') return 'test-openai-key'
        return null
      })

      const result = checkAIAvailability()

      expect(result).toBe(true)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('deepseek_api_key')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('openai_api_key')
    })

    it('应该在没有任何 API 密钥时返回 false', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = checkAIAvailability()

      expect(result).toBe(false)
    })

    it('应该在本地存储访问出错时返回 false', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const result = checkAIAvailability()

      expect(result).toBe(false)
    })

    it('应该忽略空白字符串密钥', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'deepseek_api_key') return '   '
        if (key === 'openai_api_key') return '\t\n'
        return null
      })

      const result = checkAIAvailability()

      expect(result).toBe(false)
    })
  })

  describe('getAIStatusMessage', () => {
    it('应该在 AI 可用时返回空字符串', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'deepseek_api_key') return 'test-key'
        return null
      })

      const result = getAIStatusMessage()

      expect(result).toBe('')
    })

    it('应该在 AI 不可用时返回配置提示消息', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getAIStatusMessage()

      expect(result).toBe('AI 功能需要配置 API 密钥，请前往设置页面配置')
    })
  })

  describe('集成测试', () => {
    it('应该正确处理不同的配置状态', () => {
      // 测试无配置状态
      mockLocalStorage.getItem.mockReturnValue(null)

      expect(checkAIAvailability()).toBe(false)
      expect(getAIStatusMessage()).toBe('AI 功能需要配置 API 密钥，请前往设置页面配置')

      // 测试有本地配置状态
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'deepseek_api_key') return 'local-key'
        return null
      })

      expect(checkAIAvailability()).toBe(true)
      expect(getAIStatusMessage()).toBe('')
    })
  })
})
