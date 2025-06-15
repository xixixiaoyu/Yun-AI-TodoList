import { onMounted, ref } from 'vue'
import { builtinPromptTemplates } from '../config/prompts'
import { apiKey } from '../services/configService'
import type {
  CustomPrompt,
  PromptFilter,
  PromptSortOptions,
  PromptTemplate
} from '../types/settings'
import { PromptCategory, PromptPriority } from '../types/settings'
import { handleError } from '../utils/logger'

/**
 * 增强的设置状态管理 composable
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
  const showPromptImportDialog = ref(false)
  const showPromptExportDialog = ref(false)
  const newPromptName = ref('')
  const newPromptContent = ref('')
  const newPromptDescription = ref('')
  const newPromptCategory = ref<PromptCategory>(PromptCategory.CUSTOM)
  const newPromptPriority = ref<PromptPriority>(PromptPriority.MEDIUM)
  const newPromptTags = ref<string[]>([])
  const customPrompts = ref<CustomPrompt[]>([])

  // 提示词过滤和排序状态
  const promptFilter = ref<PromptFilter>({
    searchText: '',
    category: undefined,
    priority: undefined,
    tags: [],
    isFavorite: undefined,
    isActive: undefined
  })

  const promptSortOptions = ref<PromptSortOptions>({
    field: 'updatedAt',
    order: 'desc'
  })

  // 通知状态
  const showSuccessMessage = ref(false)

  /**
   * 初始化设置状态
   */
  const initializeSettings = () => {
    // 加载 API 密钥
    localApiKey.value = apiKey.value

    // 初始化系统提示词
    const savedSystemPrompt = localStorage.getItem('systemPrompt')
    if (savedSystemPrompt) {
      localSystemPrompt.value = savedSystemPrompt
    } else {
      localSystemPrompt.value = builtinPromptTemplates.my.content
    }

    // 初始化选中的模板
    const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')
    if (lastSelectedTemplate) {
      selectedPromptTemplate.value = lastSelectedTemplate as PromptTemplate
    }

    // 初始化自定义提示词
    const savedCustomPrompts = localStorage.getItem('customPrompts')
    if (savedCustomPrompts) {
      try {
        const parsed = JSON.parse(savedCustomPrompts)
        // 迁移旧格式的提示词数据
        customPrompts.value = parsed.map((prompt: Partial<CustomPrompt>) => {
          if (!prompt.category) {
            return {
              ...prompt,
              description: prompt.description || '',
              category: PromptCategory.CUSTOM,
              priority: PromptPriority.MEDIUM,
              tags: prompt.tags || [],
              createdAt: prompt.createdAt || Date.now(),
              updatedAt: prompt.updatedAt || Date.now(),
              isActive: prompt.isActive !== undefined ? prompt.isActive : true,
              usageCount: prompt.usageCount || 0,
              isFavorite: prompt.isFavorite || false
            } as CustomPrompt
          }
          return prompt as CustomPrompt
        })
      } catch (error) {
        handleError(error, 'Failed to parse custom prompts', 'SettingsState')
        customPrompts.value = []
      }
    }

    // 初始化过滤和排序选项
    const savedFilter = localStorage.getItem('promptFilter')
    if (savedFilter) {
      try {
        promptFilter.value = { ...promptFilter.value, ...JSON.parse(savedFilter) }
      } catch (error) {
        handleError(error, 'Failed to parse prompt filter', 'SettingsState')
      }
    }

    const savedSortOptions = localStorage.getItem('promptSortOptions')
    if (savedSortOptions) {
      try {
        promptSortOptions.value = {
          ...promptSortOptions.value,
          ...JSON.parse(savedSortOptions)
        }
      } catch (error) {
        handleError(error, 'Failed to parse prompt sort options', 'SettingsState')
      }
    }
  }

  /**
   * 加载提示词内容
   */
  const loadPromptContent = (template: string, fallbackContent?: string | null) => {
    if (builtinPromptTemplates[template]) {
      // 如果是内置模板，直接使用配置内容
      localSystemPrompt.value = builtinPromptTemplates[template].content
    } else {
      // 如果是自定义模板，从自定义提示词中查找
      const customPrompt = customPrompts.value.find(p => p.id === template)
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
    localSystemPrompt.value = builtinPromptTemplates.my.content
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
    showPromptImportDialog.value = false
    showPromptExportDialog.value = false
    newPromptName.value = ''
    newPromptContent.value = ''
    newPromptDescription.value = ''
    newPromptCategory.value = PromptCategory.CUSTOM
    newPromptPriority.value = PromptPriority.MEDIUM
    newPromptTags.value = []
  }

  /**
   * 保存过滤选项到本地存储
   */
  const saveFilterOptions = () => {
    localStorage.setItem('promptFilter', JSON.stringify(promptFilter.value))
  }

  /**
   * 保存排序选项到本地存储
   */
  const saveSortOptions = () => {
    localStorage.setItem('promptSortOptions', JSON.stringify(promptSortOptions.value))
  }

  // 组件挂载时初始化设置
  onMounted(() => {
    initializeSettings()
  })

  return {
    // API 密钥状态
    showApiKey,
    showApiKeyPopover,
    localApiKey,

    // 系统提示词状态
    localSystemPrompt,
    isFullscreen,
    selectedPromptTemplate,

    // 自定义提示词状态
    showAddPromptPopover,
    showPromptImportDialog,
    showPromptExportDialog,
    newPromptName,
    newPromptContent,
    newPromptDescription,
    newPromptCategory,
    newPromptPriority,
    newPromptTags,
    customPrompts,

    // 过滤和排序状态
    promptFilter,
    promptSortOptions,

    // 通知状态
    showSuccessMessage,

    // 方法
    initializeSettings,
    loadPromptContent,
    loadDefaultPrompt,
    showSuccessToast,
    toggleFullscreen,
    toggleShowApiKey,
    resetPopoverStates,
    saveFilterOptions,
    saveSortOptions
  }
}
