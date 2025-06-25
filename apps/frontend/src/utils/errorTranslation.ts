/**
 * 错误消息国际化工具
 * 处理存储服务返回的错误消息的翻译
 */

import { useI18n } from 'vue-i18n'

/**
 * 翻译错误消息
 * @param error 错误消息（可能是国际化键名或原始文本）
 * @returns 翻译后的错误消息
 */
export function translateError(error: string): string {
  const { t } = useI18n()

  // 如果是国际化键名（以 storage. 开头），则翻译
  if (error.startsWith('storage.')) {
    try {
      return t(error)
    } catch {
      // 如果翻译失败，返回原始错误消息
      return error
    }
  }

  // 如果是其他国际化键名
  if (error.includes('.')) {
    try {
      return t(error)
    } catch {
      return error
    }
  }

  // 如果是原始文本，直接返回
  return error
}

/**
 * 创建一个响应式的错误翻译函数
 * 用于在组件中使用
 */
export function useErrorTranslation() {
  const { t } = useI18n()

  return {
    translateError: (error: string) => translateError(error),
    t,
  }
}
