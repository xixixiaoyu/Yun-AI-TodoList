import { useI18n } from 'vue-i18n'
import type { Ref } from 'vue'
import type { CustomPrompt, PromptTemplate } from '../types/settings'
import { promptsConfig } from '../config/prompts'

/**
 * 提示词管理 composable
 * 处理自定义提示词的增删改查操作
 */
export function usePromptManagement(
  customPrompts: Ref<CustomPrompt[]>,
  selectedPromptTemplate: Ref<PromptTemplate>,
  localSystemPrompt: Ref<string>,
  newPromptName: Ref<string>,
  newPromptContent: Ref<string>,
  showAddPromptPopover: Ref<boolean>,
  showSuccessToast: () => void
) {
  const { t } = useI18n()

  /**
   * 处理模板变更
   */
  const handleTemplateChange = () => {
    const template = selectedPromptTemplate.value

    if (template === 'my' || template === 'study' || template === 'studentStudy') {
      localSystemPrompt.value = promptsConfig[template].content
    } else {
      const customPrompt = customPrompts.value.find((p) => p.id === template)
      if (customPrompt) {
        localSystemPrompt.value = customPrompt.content
      }
    }
    // 保存当前选择的模板
    localStorage.setItem('lastSelectedTemplate', template)
  }

  /**
   * 保存新的自定义提示词
   */
  const saveNewPrompt = () => {
    const newPrompt: CustomPrompt = {
      id: `custom_${Date.now()}`,
      name: newPromptName.value,
      content: newPromptContent.value,
    }

    customPrompts.value.push(newPrompt)
    localStorage.setItem('customPrompts', JSON.stringify(customPrompts.value))

    selectedPromptTemplate.value = newPrompt.id
    localSystemPrompt.value = newPrompt.content
    localStorage.setItem('lastSelectedTemplate', newPrompt.id)

    showAddPromptPopover.value = false
    newPromptName.value = ''
    newPromptContent.value = ''
    showSuccessToast()
  }

  /**
   * 保存系统提示词
   */
  const saveSystemPrompt = () => {
    localStorage.setItem('systemPrompt', localSystemPrompt.value)

    // 如果当前不是自定义模板，保存时创建一个新的自定义模板
    if (!selectedPromptTemplate.value.startsWith('custom_')) {
      const newPrompt: CustomPrompt = {
        id: `custom_${Date.now()}`,
        name: t('customPrompt'),
        content: localSystemPrompt.value,
      }

      customPrompts.value.push(newPrompt)
      localStorage.setItem('customPrompts', JSON.stringify(customPrompts.value))
      selectedPromptTemplate.value = newPrompt.id
      localStorage.setItem('lastSelectedTemplate', newPrompt.id)
    }

    showSuccessToast()
  }

  /**
   * 重置系统提示词
   */
  const resetSystemPrompt = () => {
    selectedPromptTemplate.value = 'my'
    localSystemPrompt.value = promptsConfig.my.content
    localStorage.removeItem('systemPrompt')
    localStorage.removeItem('lastSelectedTemplate')
  }

  /**
   * 确认删除提示词
   */
  const confirmDeletePrompt = () => {
    if (window.confirm(t('confirmDeletePrompt'))) {
      const updatedPrompts = customPrompts.value.filter(
        (p) => p.id !== selectedPromptTemplate.value
      )
      customPrompts.value = updatedPrompts
      localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts))

      // 删除后重置为默认提示词
      selectedPromptTemplate.value = 'my'
      localSystemPrompt.value = promptsConfig.my.content
      localStorage.setItem('lastSelectedTemplate', 'my')

      showSuccessToast()
    }
  }

  /**
   * 验证提示词表单
   */
  const isPromptFormValid = () => {
    return newPromptName.value.trim() !== '' && newPromptContent.value.trim() !== ''
  }

  /**
   * 验证系统提示词
   */
  const isSystemPromptValid = () => {
    return localSystemPrompt.value.trim() !== ''
  }

  /**
   * 获取当前选中的自定义提示词
   */
  const getCurrentCustomPrompt = () => {
    return customPrompts.value.find((p) => p.id === selectedPromptTemplate.value)
  }

  /**
   * 检查是否为自定义提示词
   */
  const isCustomPrompt = () => {
    return selectedPromptTemplate.value.startsWith('custom_')
  }

  return {
    handleTemplateChange,
    saveNewPrompt,
    saveSystemPrompt,
    resetSystemPrompt,
    confirmDeletePrompt,
    isPromptFormValid,
    isSystemPromptValid,
    getCurrentCustomPrompt,
    isCustomPrompt,
  }
}
