import { ref } from 'vue'
import type { Toast, ToastType } from '../components/common/SimpleToast.vue'

// 全局 Toast 实例引用
const toastInstance = ref<{
  addToast: (options: Partial<Toast>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
} | null>(null)

// Toast 选项
interface ToastOptions {
  duration?: number
}

export function useToast() {
  // 设置 Toast 实例
  const setToastInstance = (instance: {
    addToast: (options: Partial<Toast>) => void
    removeToast: (id: string) => void
    clearAllToasts: () => void
  }) => {
    toastInstance.value = instance
  }

  // 基础添加 Toast 方法
  const addToast = (type: ToastType, message: string, options?: ToastOptions) => {
    if (!toastInstance.value) {
      console.warn('Toast instance not found. Make sure SimpleToast component is mounted.')
      return
    }

    const toastOptions: Partial<Toast> = {
      type,
      message,
      duration: 3000,
      ...options,
    }

    return toastInstance.value.addToast(toastOptions)
  }

  // 便捷方法
  const success = (message: string, options?: ToastOptions) => {
    return addToast('success', message, options)
  }

  const error = (message: string, options?: ToastOptions) => {
    return addToast('error', message, {
      duration: 4000,
      ...options,
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    return addToast('info', message, options)
  }

  // 移除 Toast
  const removeToast = (id: string) => {
    if (toastInstance.value) {
      toastInstance.value.removeToast(id)
    }
  }

  // 清除所有 Toast（暂未使用）
  // const clearAll = () => {
  //   if (toastInstance.value) {
  //     toastInstance.value.clearAllToasts()
  //   }
  // }

  // 复制成功提示
  const copySuccess = () => {
    return success('已复制到剪贴板')
  }

  // 复制失败提示
  const copyError = (err?: Error) => {
    const message = err?.message || '复制失败，请重试'
    return error(message)
  }

  // 重试开始提示
  const retryStart = () => {
    return info('正在重试...')
  }

  // 重试成功提示
  const retrySuccess = () => {
    return success('重试成功')
  }

  // 重试失败提示
  const retryError = (retryCount: number, maxRetries: number) => {
    const message =
      retryCount >= maxRetries
        ? '重试失败，已达到最大重试次数'
        : `重试失败 (${retryCount}/${maxRetries})`

    return error(message)
  }

  // 网络错误提示
  const networkError = () => {
    return error('网络连接失败，请检查网络设置')
  }

  // API 错误提示
  const apiError = (message?: string) => {
    return error(message || 'API 请求失败，请稍后重试')
  }

  // 保存成功提示
  const saveSuccess = () => {
    return success('保存成功')
  }

  // 保存失败提示
  const saveError = () => {
    return error('保存失败，请重试')
  }

  return {
    // 核心方法
    setToastInstance,
    addToast,
    removeToast,

    // 便捷方法
    success,
    error,
    info,

    // 特定场景方法
    copySuccess,
    copyError,
    retryStart,
    retrySuccess,
    retryError,
    networkError,
    apiError,
    saveSuccess,
    saveError,
  }
}

// 类型声明
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $toast: ReturnType<typeof useToast>
  }
}
