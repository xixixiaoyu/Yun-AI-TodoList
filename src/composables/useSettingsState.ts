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
  const showApiKey = ref(false)
  const showApiKeyPopover = ref(false)
  const localApiKey = ref('')

  const localSystemPrompt = ref('')
  const isFullscreen = ref(false)
  const selectedPromptTemplate = ref<PromptTemplate>('my')

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

  const showSuccessMessage = ref(false)

  const initializeSettings = () => {
    localApiKey.value = apiKey.value

    const savedSystemPrompt = localStorage.getItem('systemPrompt')
    if (savedSystemPrompt) {
      localSystemPrompt.value = savedSystemPrompt
    } else {
      localSystemPrompt.value = builtinPromptTemplates.my.content
    }

    const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')
    if (lastSelectedTemplate) {
      selectedPromptTemplate.value = lastSelectedTemplate as PromptTemplate
    }

    const savedCustomPrompts = localStorage.getItem('customPrompts')
    if (savedCustomPrompts) {
      try {
        const parsed = JSON.parse(savedCustomPrompts)

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
      localSystemPrompt.value = builtinPromptTemplates[template].content
    } else {
      const customPrompt = customPrompts.value.find(p => p.id === template)
      if (customPrompt) {
        localSystemPrompt.value = customPrompt.content
      } else if (fallbackContent) {
        localSystemPrompt.value = fallbackContent
      }
    }
  }

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

  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
  }

  /**
   * 切换 API 密钥显示状态
   */
  const toggleShowApiKey = () => {
    showApiKey.value = !showApiKey.value
  }

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

  const saveSortOptions = () => {
    localStorage.setItem('promptSortOptions', JSON.stringify(promptSortOptions.value))
  }

  onMounted(() => {
    initializeSettings()
  })

  return {
    showApiKey,
    showApiKeyPopover,
    localApiKey,

    localSystemPrompt,
    isFullscreen,
    selectedPromptTemplate,

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

    promptFilter,
    promptSortOptions,

    showSuccessMessage,

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
