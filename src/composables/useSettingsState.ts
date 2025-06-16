import { onMounted, ref } from 'vue'
import { apiKey } from '../services/configService'

export function useSettingsState() {
  const showApiKey = ref(false)
  const showApiKeyPopover = ref(false)
  const localApiKey = ref('')
  const showSuccessMessage = ref(false)

  const initializeSettings = () => {
    localApiKey.value = apiKey.value

    // 清理系统提示词相关的本地存储数据
    localStorage.removeItem('systemPrompt')
    localStorage.removeItem('lastSelectedTemplate')
    localStorage.removeItem('customPrompts')
    localStorage.removeItem('promptFilter')
    localStorage.removeItem('promptSortOptions')
  }

  const showSuccessToast = (duration = 2000) => {
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, duration)
  }

  /**
   * 切换 API 密钥显示状态
   */
  const toggleShowApiKey = () => {
    showApiKey.value = !showApiKey.value
  }

  onMounted(() => {
    initializeSettings()
  })

  return {
    showApiKey,
    showApiKeyPopover,
    localApiKey,
    showSuccessMessage,
    initializeSettings,
    showSuccessToast,
    toggleShowApiKey,
  }
}
