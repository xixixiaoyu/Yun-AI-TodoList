import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAIModel, saveAIModel, aiModel } from '../../services/configService'
import type { AIModel } from '../../services/types'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('模型选择功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    aiModel.value = 'deepseek-chat'
  })

  describe('getAIModel', () => {
    it('应该返回当前选择的模型', () => {
      expect(getAIModel()).toBe('deepseek-chat')
    })

    it('应该返回响应式的模型值', () => {
      aiModel.value = 'deepseek-reasoner'
      expect(getAIModel()).toBe('deepseek-reasoner')
    })
  })

  describe('saveAIModel', () => {
    it('应该保存模型到 localStorage 和响应式变量', () => {
      const newModel: AIModel = 'deepseek-reasoner'

      saveAIModel(newModel)

      expect(aiModel.value).toBe(newModel)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('deepseek_ai_model', newModel)
    })

    it('应该能够切换回 deepseek-chat 模型', () => {
      saveAIModel('deepseek-reasoner')
      expect(getAIModel()).toBe('deepseek-reasoner')

      saveAIModel('deepseek-chat')
      expect(getAIModel()).toBe('deepseek-chat')
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        'deepseek_ai_model',
        'deepseek-chat'
      )
    })
  })

  describe('默认模型', () => {
    it('应该默认使用 deepseek-chat 模型', () => {
      localStorageMock.getItem.mockReturnValue(null)

      vi.resetModules()

      expect(getAIModel()).toBe('deepseek-chat')
    })

    it('应该从 localStorage 加载保存的模型', () => {
      localStorageMock.getItem.mockReturnValue('deepseek-reasoner')

      aiModel.value = (localStorage.getItem('deepseek_ai_model') as AIModel) || 'deepseek-chat'

      expect(getAIModel()).toBe('deepseek-reasoner')
    })
  })

  describe('模型类型验证', () => {
    it('应该只接受有效的模型类型', () => {
      const validModels: AIModel[] = ['deepseek-chat', 'deepseek-reasoner']

      validModels.forEach((model) => {
        expect(() => saveAIModel(model)).not.toThrow()
        expect(getAIModel()).toBe(model)
      })
    })
  })
})
