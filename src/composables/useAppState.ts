import router from '../router'
import { getApiKey, hideApiKeyReminder, shouldShowApiKeyReminder } from '../services/configService'

/**
 * 应用全局状态管理
 * 管理 API Key 提醒、导航等全局状态
 */
export function useAppState() {
  const showApiKeyReminder = ref(false)

  const closeReminder = (dontShowAgain = false) => {
    if (dontShowAgain) {
      hideApiKeyReminder()
    }
    showApiKeyReminder.value = false
  }

  const goToSettings = () => {
    router.push('/settings')
    showApiKeyReminder.value = false
  }

  const initializeApp = () => {
    if (!getApiKey() && shouldShowApiKeyReminder()) {
      showApiKeyReminder.value = true
    }
  }

  onMounted(() => {
    initializeApp()
  })

  return {
    showApiKeyReminder,
    closeReminder,
    goToSettings,
    initializeApp,
  }
}
