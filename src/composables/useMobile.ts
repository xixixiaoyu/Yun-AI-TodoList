/**
 * 移动端功能组合式函数
 * 提供移动端特有功能的封装
 */

import { getPlatformInfo } from '@/utils/platform'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Preferences } from '@capacitor/preferences'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Toast } from '@capacitor/toast'
import { onMounted, ref } from 'vue'

export function useMobile() {
  const platformInfo = getPlatformInfo()
  const isReady = ref(false)

  const initMobile = async () => {
    if (!platformInfo.isCapacitor) {
      isReady.value = true
      return
    }

    try {
      await StatusBar.setStyle({ style: Style.Default })
      await StatusBar.setBackgroundColor({ color: '#f8f7f6' })

      await SplashScreen.hide()

      isReady.value = true
    } catch (error) {
      console.error('移动端初始化失败:', error)
      isReady.value = true
    }
  }

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!platformInfo.isCapacitor) return

    try {
      await Haptics.impact({ style })
    } catch (error) {
      console.error('触觉反馈失败:', error)
    }
  }

  const showToast = async (text: string, duration: 'short' | 'long' = 'short') => {
    if (!platformInfo.isCapacitor) {
      return
    }

    try {
      await Toast.show({
        text,
        duration: duration === 'short' ? 'short' : 'long',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示 Toast 失败:', error)
    }
  }

  const setPreference = async (key: string, value: string) => {
    if (!platformInfo.isCapacitor) {
      localStorage.setItem(key, value)
      return
    }

    try {
      await Preferences.set({ key, value })
    } catch (error) {
      console.error('存储偏好设置失败:', error)
    }
  }

  const getPreference = async (key: string): Promise<string | null> => {
    if (!platformInfo.isCapacitor) {
      return localStorage.getItem(key)
    }

    try {
      const { value } = await Preferences.get({ key })
      return value
    } catch (error) {
      console.error('获取偏好设置失败:', error)
      return null
    }
  }

  const removePreference = async (key: string) => {
    if (!platformInfo.isCapacitor) {
      localStorage.removeItem(key)
      return
    }

    try {
      await Preferences.remove({ key })
    } catch (error) {
      console.error('移除偏好设置失败:', error)
    }
  }

  const writeFile = async (path: string, data: string) => {
    if (!platformInfo.isCapacitor) {
      console.warn('文件写入仅在移动端支持')
      return
    }

    try {
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      })
    } catch (error) {
      console.error('写入文件失败:', error)
      throw error
    }
  }

  const readFile = async (path: string): Promise<string | null> => {
    if (!platformInfo.isCapacitor) {
      console.warn('文件读取仅在移动端支持')
      return null
    }

    try {
      const { data } = await Filesystem.readFile({
        path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      })
      return data as string
    } catch (error) {
      console.error('读取文件失败:', error)
      return null
    }
  }

  const deleteFile = async (path: string) => {
    if (!platformInfo.isCapacitor) {
      console.warn('文件删除仅在移动端支持')
      return
    }

    try {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Documents
      })
    } catch (error) {
      console.error('删除文件失败:', error)
      throw error
    }
  }

  onMounted(() => {
    initMobile()
  })

  return {
    isReady,
    platformInfo,

    initMobile,
    hapticFeedback,
    showToast,
    setPreference,
    getPreference,
    removePreference,
    writeFile,
    readFile,
    deleteFile
  }
}
