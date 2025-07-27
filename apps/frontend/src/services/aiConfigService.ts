/**
 * AI 功能配置服务
 * 简化的 AI 功能可用性检查
 */

/**
 * 检查 AI 功能是否可用
 * 检查本地存储的 API 密钥配置
 */
export function checkAIAvailability(): boolean {
  try {
    // 首先检查本地存储的 API 密钥
    const localDeepseekKey = localStorage.getItem('deepseek_api_key')
    if (localDeepseekKey && localDeepseekKey.trim() !== '') {
      return true
    }

    // 然后检查环境变量中的 API 密钥（作为备选）
    const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

    return !!(deepseekKey || openaiKey)
  } catch {
    return false
  }
}

/**
 * 获取 AI 功能状态消息
 */
export function getAIStatusMessage(): string {
  if (!checkAIAvailability()) {
    return 'AI 功能需要配置 API 密钥，请前往设置页面配置'
  }
  return ''
}
