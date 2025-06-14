import { ref, onMounted } from 'vue'
import { apiKey } from '../services/configService'
import type { CustomPrompt, PromptTemplate } from '../types/settings'
import { promptsConfig } from '../config/prompts'

/**
 * 设置状态管理 composable
 * 管理设置页面的所有状态
 */
export function useSettingsState() {
  // API 密钥相关状态
  const showApiKey = ref(false)
  const showApiKeyPopover = ref(false)
  const localApiKey = ref('')

  // 系统提示词相关状态
  const localSystemPrompt = ref('')
  const isFullscreen = ref(false)
  const selectedPromptTemplate = ref<PromptTemplate>('my')

  // 自定义提示词相关状态
  const showAddPromptPopover = ref(false)
  const newPromptName = ref('')
  const newPromptContent = ref('')
  const customPrompts = ref<CustomPrompt[]>([])

  // 通知状态
  const showSuccessMessage = ref(false)

  /**
   * 初始化设置状态
   */
  const initializeSettings = () => {
    // 加载 API 密钥
    localApiKey.value = apiKey.value

    // 加载自定义提示词
    const savedCustomPrompts = localStorage.getItem('customPrompts')
    if (savedCustomPrompts) {
      customPrompts.value = JSON.parse(savedCustomPrompts)
    }

    // 从 localStorage 加载系统提示词和上次选择的模板
    const savedSystemPrompt = localStorage.getItem('systemPrompt')
    const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')

    if (lastSelectedTemplate) {
      selectedPromptTemplate.value = lastSelectedTemplate
      loadPromptContent(lastSelectedTemplate, savedSystemPrompt)
    } else {
      // 没有上次选择的模板，使用默认模板
      selectedPromptTemplate.value = 'my'
      loadDefaultPrompt()
    }
  }

  /**
   * 加载提示词内容
   */
  const loadPromptContent = (template: string, fallbackContent?: string | null) => {
    if (template === 'my' || template === 'study' || template === 'studentStudy') {
      // 如果是预设模板，直接使用配置内容
      localSystemPrompt.value = promptsConfig[template].content
    } else {
      // 如果是自定义模板，从自定义提示词中查找
      const customPrompt = customPrompts.value.find((p) => p.id === template)
      if (customPrompt) {
        localSystemPrompt.value = customPrompt.content
      } else if (fallbackContent) {
        // 如果找不到自定义模板但有保存的内容，使用保存的内容
        localSystemPrompt.value = fallbackContent
      }
    }
  }

  /**
   * 加载默认提示词
   */
  const loadDefaultPrompt = () => {
    localSystemPrompt.value = promptsConfig.my.content
  }

  /**
   * 显示成功消息
   */
  const showSuccessToast = (duration = 2000) => {
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, duration)
  }

  /**
   * 切换全屏模式
   */
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
  }

  /**
   * 切换 API 密钥显示状态
   */
  const toggleShowApiKey = () => {
    showApiKey.value = !showApiKey.value
  }

  /**
   * 重置所有弹窗状态
   */
  const resetPopoverStates = () => {
    showApiKeyPopover.value = false
    showAddPromptPopover.value = false
    newPromptName.value = ''
    newPromptContent.value = ''
  }

  // 组件挂载时初始化设置
  onMounted(() => {
    initializeSettings()
  })

  return {
    // 状态
    showApiKey,
    showApiKeyPopover,
    localApiKey,
    localSystemPrompt,
    isFullscreen,
    selectedPromptTemplate,
    showAddPromptPopover,
    newPromptName,
    newPromptContent,
    customPrompts,
    showSuccessMessage,

    // 方法
    initializeSettings,
    loadPromptContent,
    loadDefaultPrompt,
    showSuccessToast,
    toggleFullscreen,
    toggleShowApiKey,
    resetPopoverStates,
  }
}
