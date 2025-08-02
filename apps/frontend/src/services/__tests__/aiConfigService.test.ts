import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

// Mock import.meta.env
const originalEnv = import.meta.env

describe('aiConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置环境变量
    Object.assign(import.meta.env, {
      VITE_DEEPSEEK_API_KEY: '',
      VITE_OPENAI_API_KEY: '',
    })
  })

  afterEach(() => {
    // 恢复原始环境变量
    Object.assign(import.meta.env, originalEnv)
  })

  describe('checkAIAvailability', () => {
    it('应该在本地存储有 Deepseek API 密钥时返回 true', () => {
      mockLocalStorage.getItem.mockReturnValue('test-deepseek-key')

      const result = checkAIAvailability()

      expect(result).toBe(true)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('deepseek_api_key')
    })

    it('应该在本地存储的密钥为空时检查环境变量', () => {
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_DEEPSEEK_API_KEY = 'env-deepseek-key'

      const result = checkAIAvailability()

      expect(result).toBe(true)
    })

    it('应该在有 OpenAI 环境变量时返回 true', () => {
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_OPENAI_API_KEY = 'env-openai-key'

      const result = checkAIAvailability()

      expect(result).toBe(true)
    })

    it('应该在没有任何 API 密钥时返回 false', () => {
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_DEEPSEEK_API_KEY = ''
      import.meta.env.VITE_OPENAI_API_KEY = ''

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
      mockLocalStorage.getItem.mockReturnValue('   ')
      import.meta.env.VITE_DEEPSEEK_API_KEY = ''
      import.meta.env.VITE_OPENAI_API_KEY = ''

      const result = checkAIAvailability()

      expect(result).toBe(false)
    })
  })

  describe('getAIStatusMessage', () => {
    it('应该在 AI 可用时返回空字符串', () => {
      mockLocalStorage.getItem.mockReturnValue('test-key')

      const result = getAIStatusMessage()

      expect(result).toBe('')
    })

    it('应该在 AI 不可用时返回配置提示消息', () => {
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_DEEPSEEK_API_KEY = ''
      import.meta.env.VITE_OPENAI_API_KEY = ''

      const result = getAIStatusMessage()

      expect(result).toBe('AI 功能需要配置 API 密钥，请前往设置页面配置')
    })
  })

  describe('集成测试', () => {
    it('应该正确处理不同的配置状态', () => {
      // 测试无配置状态
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_DEEPSEEK_API_KEY = ''
      import.meta.env.VITE_OPENAI_API_KEY = ''

      expect(checkAIAvailability()).toBe(false)
      expect(getAIStatusMessage()).toBe('AI 功能需要配置 API 密钥，请前往设置页面配置')

      // 测试有本地配置状态
      mockLocalStorage.getItem.mockReturnValue('local-key')

      expect(checkAIAvailability()).toBe(true)
      expect(getAIStatusMessage()).toBe('')

      // 测试有环境变量配置状态
      mockLocalStorage.getItem.mockReturnValue('')
      import.meta.env.VITE_DEEPSEEK_API_KEY = 'env-key'

      expect(checkAIAvailability()).toBe(true)
      expect(getAIStatusMessage()).toBe('')
    })
  })
})
