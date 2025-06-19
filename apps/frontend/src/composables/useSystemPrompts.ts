import type {
  SystemPrompt,
  SystemPromptConfig,
  SystemPromptCreateInput,
  SystemPromptUpdateInput,
} from '@/services/types'
import { logger } from '@/utils/logger'
import { computed, onMounted, ref } from 'vue'

/**
 * 系统提示词管理 Composable
 * 提供系统提示词的 CRUD 操作、配置管理和持久化存储
 */
export function useSystemPrompts() {
  // 存储键名
  const SYSTEM_PROMPTS_KEY = 'system_prompts'
  const SYSTEM_PROMPT_CONFIG_KEY = 'system_prompt_config'

  // 响应式状态
  const systemPrompts = ref<SystemPrompt[]>([])
  const config = ref<SystemPromptConfig>({
    enabled: false, // 默认不启用系统提示词
    activePromptId: null,
  })

  const isLoading = ref(false)
  const error = ref<string>('')

  // 计算属性
  const activePrompt = computed(() => {
    if (!config.value.enabled || !config.value.activePromptId) {
      return null
    }
    return systemPrompts.value.find((prompt) => prompt.id === config.value.activePromptId) || null
  })

  const enabledPrompts = computed(() => {
    return systemPrompts.value.filter((prompt) => prompt.isActive)
  })

  const hasActivePrompt = computed(() => {
    return config.value.enabled && activePrompt.value !== null
  })

  const currentSystemPromptContent = computed(() => {
    if (hasActivePrompt.value && activePrompt.value) {
      return activePrompt.value.content
    }
    return ''
  })

  // 生成唯一 ID
  const generateId = (): string => {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 错误处理
  const handleError = (error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`系统提示词管理错误 - ${context}: ${errorMessage}`, error, 'useSystemPrompts')
    return errorMessage
  }

  // 加载系统提示词
  const loadSystemPrompts = () => {
    try {
      const saved = localStorage.getItem(SYSTEM_PROMPTS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SystemPrompt[]
        systemPrompts.value = parsed.map((prompt) => ({
          ...prompt,
          // 确保必要字段存在
          isActive: prompt.isActive ?? true,
          createdAt: prompt.createdAt || new Date().toISOString(),
          updatedAt: prompt.updatedAt || new Date().toISOString(),
        }))
      }
    } catch (error) {
      handleError(error, '加载系统提示词')
    }
  }

  // 加载配置
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(SYSTEM_PROMPT_CONFIG_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SystemPromptConfig
        config.value = {
          ...config.value,
          ...parsed,
        }
      }
    } catch (error) {
      handleError(error, '加载系统提示词配置')
    }
  }

  // 保存系统提示词
  const saveSystemPrompts = () => {
    try {
      localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(systemPrompts.value))
      logger.debug('系统提示词保存成功', { count: systemPrompts.value.length }, 'useSystemPrompts')
    } catch (error) {
      throw new Error(handleError(error, '保存系统提示词'))
    }
  }

  // 保存配置
  const saveConfig = () => {
    try {
      localStorage.setItem(SYSTEM_PROMPT_CONFIG_KEY, JSON.stringify(config.value))
      logger.debug('系统提示词配置保存成功', config.value, 'useSystemPrompts')
    } catch (error) {
      throw new Error(handleError(error, '保存系统提示词配置'))
    }
  }

  // 创建系统提示词
  const createSystemPrompt = async (input: SystemPromptCreateInput): Promise<SystemPrompt> => {
    try {
      isLoading.value = true
      error.value = ''

      // 验证输入
      if (!input.name.trim()) {
        throw new Error('系统提示词名称不能为空')
      }
      if (!input.content.trim()) {
        throw new Error('系统提示词内容不能为空')
      }

      // 检查名称是否重复
      const existingPrompt = systemPrompts.value.find((p) => p.name === input.name.trim())
      if (existingPrompt) {
        throw new Error('系统提示词名称已存在')
      }

      const now = new Date().toISOString()
      const newPrompt: SystemPrompt = {
        id: generateId(),
        name: input.name.trim(),
        content: input.content.trim(),
        description: input.description?.trim() || '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        tags: input.tags || [],
      }

      systemPrompts.value.push(newPrompt)
      saveSystemPrompts()

      logger.info(
        '系统提示词创建成功',
        { id: newPrompt.id, name: newPrompt.name },
        'useSystemPrompts'
      )
      return newPrompt
    } catch (error) {
      const errorMessage = handleError(error, '创建系统提示词')
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // 更新系统提示词
  const updateSystemPrompt = async (
    id: string,
    input: SystemPromptUpdateInput
  ): Promise<SystemPrompt> => {
    try {
      isLoading.value = true
      error.value = ''

      const index = systemPrompts.value.findIndex((p) => p.id === id)
      if (index === -1) {
        throw new Error('系统提示词不存在')
      }

      const existingPrompt = systemPrompts.value[index]

      // 如果更新名称，检查是否重复
      if (input.name && input.name.trim() !== existingPrompt.name) {
        const duplicatePrompt = systemPrompts.value.find(
          (p) => p.id !== id && p.name === input.name?.trim()
        )
        if (duplicatePrompt) {
          throw new Error('系统提示词名称已存在')
        }
      }

      const updatedPrompt: SystemPrompt = {
        ...existingPrompt,
        ...input,
        name: input.name?.trim() || existingPrompt.name,
        content: input.content?.trim() || existingPrompt.content,
        description: input.description?.trim() ?? existingPrompt.description,
        updatedAt: new Date().toISOString(),
      }

      systemPrompts.value[index] = updatedPrompt
      saveSystemPrompts()

      logger.info('系统提示词更新成功', { id, name: updatedPrompt.name }, 'useSystemPrompts')
      return updatedPrompt
    } catch (error) {
      const errorMessage = handleError(error, '更新系统提示词')
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // 删除系统提示词
  const deleteSystemPrompt = async (id: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = ''

      const index = systemPrompts.value.findIndex((p) => p.id === id)
      if (index === -1) {
        throw new Error('系统提示词不存在')
      }

      const prompt = systemPrompts.value[index]

      // 如果删除的是当前激活的提示词，清除激活状态
      if (config.value.activePromptId === id) {
        config.value.activePromptId = null
        saveConfig()
      }

      systemPrompts.value.splice(index, 1)
      saveSystemPrompts()

      logger.info('系统提示词删除成功', { id, name: prompt.name }, 'useSystemPrompts')
    } catch (error) {
      const errorMessage = handleError(error, '删除系统提示词')
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // 切换系统提示词启用状态
  const togglePromptActive = async (id: string): Promise<void> => {
    try {
      const prompt = systemPrompts.value.find((p) => p.id === id)
      if (!prompt) {
        throw new Error('系统提示词不存在')
      }

      await updateSystemPrompt(id, { isActive: !prompt.isActive })

      // 如果禁用的是当前激活的提示词，清除激活状态
      if (!prompt.isActive && config.value.activePromptId === id) {
        config.value.activePromptId = null
        saveConfig()
      }
    } catch (error) {
      const errorMessage = handleError(error, '切换系统提示词状态')
      throw new Error(errorMessage)
    }
  }

  // 设置激活的系统提示词
  const setActivePrompt = async (id: string | null): Promise<void> => {
    try {
      if (id && !systemPrompts.value.find((p) => p.id === id && p.isActive)) {
        throw new Error('系统提示词不存在或未启用')
      }

      config.value.activePromptId = id
      saveConfig()

      logger.info('激活系统提示词设置成功', { activePromptId: id }, 'useSystemPrompts')
    } catch (error) {
      const errorMessage = handleError(error, '设置激活系统提示词')
      throw new Error(errorMessage)
    }
  }

  // 更新配置
  const updateConfig = async (newConfig: Partial<SystemPromptConfig>): Promise<void> => {
    try {
      config.value = {
        ...config.value,
        ...newConfig,
      }
      saveConfig()

      logger.info('系统提示词配置更新成功', config.value, 'useSystemPrompts')
    } catch (error) {
      const errorMessage = handleError(error, '更新系统提示词配置')
      throw new Error(errorMessage)
    }
  }

  // 重置为默认状态
  const resetToDefault = async (): Promise<void> => {
    try {
      config.value = {
        enabled: false,
        activePromptId: null,
      }
      saveConfig()

      logger.info('系统提示词配置重置成功', undefined, 'useSystemPrompts')
    } catch (error) {
      const errorMessage = handleError(error, '重置系统提示词配置')
      throw new Error(errorMessage)
    }
  }

  // 初始化
  const initialize = () => {
    loadConfig()
    loadSystemPrompts()
  }

  // 组件挂载时初始化
  onMounted(() => {
    initialize()
  })

  return {
    // 状态
    systemPrompts,
    config,
    isLoading,
    error,

    // 计算属性
    activePrompt,
    enabledPrompts,
    hasActivePrompt,
    currentSystemPromptContent,

    // 方法
    createSystemPrompt,
    updateSystemPrompt,
    deleteSystemPrompt,
    togglePromptActive,
    setActivePrompt,
    updateConfig,
    resetToDefault,
    initialize,
  }
}
