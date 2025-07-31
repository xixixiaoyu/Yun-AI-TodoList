import { onMounted, ref } from 'vue'
import { apiKey, baseUrl, aiModel, aiProvider } from '../services/configService'

export function useSettingsState() {
  const showApiKey = ref(false)
  const showApiKeyPopover = ref(false)
  const localApiKey = ref('')
  const localBaseUrl = ref('')
  const localModel = ref('')
  const localProvider = ref('deepseek')
  const showSuccessMessage = ref(false)

  const initializeSettings = () => {
    localApiKey.value = apiKey.value
    localBaseUrl.value = baseUrl.value
    localModel.value = aiModel.value
    localProvider.value = aiProvider.value

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
    localBaseUrl,
    localModel,
    localProvider,
    showSuccessMessage,
    initializeSettings,
    showSuccessToast,
    toggleShowApiKey,
  }
}
