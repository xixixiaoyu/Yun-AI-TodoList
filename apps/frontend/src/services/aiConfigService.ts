/**
 * AI 功能配置服务
 * 简化的 AI 功能可用性检查
 */

/**
 * 检查 AI 功能是否可用
 * 简单检查是否有 API 密钥配置
 */
export function checkAIAvailability(): boolean {
  try {
    // 检查是否有 API 密钥配置
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
    return 'AI 功能需要配置 API 密钥'
  }
  return ''
}
