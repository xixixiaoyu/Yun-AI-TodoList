import { ref, onMounted } from 'vue'
import router from '../router'
import { getApiKey, shouldShowApiKeyReminder, hideApiKeyReminder } from '../services/configService'

/**
 * 应用全局状态管理
 * 管理 API Key 提醒、导航等全局状态
 */
export function useAppState() {
  // API Key 提醒状态
  const showApiKeyReminder = ref(false)

  /**
   * 关闭 API Key 提醒
   * @param dontShowAgain 是否不再显示
   */
  const closeReminder = (dontShowAgain = false) => {
    if (dontShowAgain) {
      hideApiKeyReminder()
    }
    showApiKeyReminder.value = false
  }

  /**
   * 跳转到设置页面
   */
  const goToSettings = () => {
    router.push('/settings')
    showApiKeyReminder.value = false
  }

  /**
   * 初始化应用状态
   */
  const initializeApp = () => {
    // 检查是否配置了 API Key 且是否应该显示提醒
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
    initializeApp
  }
}
