import { ref } from 'vue'
import { logger } from './logger'
import { configurePWALogging, configurePWAThemeColor, validatePWAIcons } from './pwa-config'

// PWA 安装相关状态
export const canInstall = ref(false)
export const isInstalled = ref(false)
export const isOnline = ref(navigator.onLine)

// 定义 BeforeInstallPromptEvent 接口
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 安装提示事件
let deferredPrompt: BeforeInstallPromptEvent | null = null

// 监听安装提示事件
window.addEventListener('beforeinstallprompt', (e: Event) => {
  // 阻止默认的安装提示
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
  canInstall.value = true
  logger.info('PWA 安装提示已准备就绪', undefined, 'PWA')
})

// 监听应用安装事件
window.addEventListener('appinstalled', () => {
  isInstalled.value = true
  canInstall.value = false
  deferredPrompt = null
  logger.info('PWA 应用已安装', undefined, 'PWA')
})

// 监听网络状态变化
window.addEventListener('online', () => {
  isOnline.value = true
  logger.info('网络连接已恢复', undefined, 'PWA')
})

window.addEventListener('offline', () => {
  isOnline.value = false
  logger.warn('网络连接已断开，应用将在离线模式下运行', undefined, 'PWA')
})

// 检查是否已安装
export function checkIfInstalled(): boolean {
  // 检查是否在独立模式下运行（已安装）
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isInWebAppiOS =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches

  const installed = isStandalone || isInWebAppiOS || isInWebAppChrome
  isInstalled.value = installed

  return installed
}

// 显示安装提示
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false
  }

  try {
    // 显示安装提示
    await deferredPrompt.prompt()

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice

    // 清除保存的事件
    deferredPrompt = null
    canInstall.value = false

    if (outcome === 'accepted') {
      isInstalled.value = true
      return true
    }

    return false
  } catch (error) {
    logger.error('显示安装提示失败', error, 'PWA')
    return false
  }
}

// 获取网络状态
export function getNetworkStatus(): 'online' | 'offline' {
  return navigator.onLine ? 'online' : 'offline'
}

// 检查 Service Worker 支持
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator
}

// 检查 PWA 功能支持
export function isPWASupported(): boolean {
  return isServiceWorkerSupported() && 'PushManager' in window && 'Notification' in window
}

// 检查更新
export async function checkForUpdates(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      return true
    }
    return false
  } catch (error) {
    logger.error('检查更新失败', error, 'PWA')
    return false
  }
}

// 获取缓存大小
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0
  }

  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()

      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  } catch (error) {
    logger.error('获取缓存大小失败', error, 'PWA')
    return 0
  }
}

// 清理缓存
export async function clearCache(): Promise<boolean> {
  if (!('caches' in window)) {
    return false
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    logger.info('缓存已清理', undefined, 'PWA')
    return true
  } catch (error) {
    logger.error('清理缓存失败', error, 'PWA')
    return false
  }
}

// 预缓存重要资源
export async function precacheResources(urls: string[]): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const cache = await caches.open('precache-v1')
    await cache.addAll(urls)
    logger.info(`预缓存 ${urls.length} 个资源`, undefined, 'PWA')
  } catch (error) {
    logger.error('预缓存资源失败', error, 'PWA')
  }
}

// 初始化 PWA 功能
export async function initPWA(): Promise<void> {
  // 配置 PWA 日志
  configurePWALogging()

  // 配置 PWA 主题色
  configurePWAThemeColor()

  // 检查安装状态
  checkIfInstalled()

  // 设置初始网络状态
  isOnline.value = navigator.onLine

  // 验证图标文件并预缓存重要资源
  if (isOnline.value) {
    const iconsValid = await validatePWAIcons()
    if (!iconsValid) {
      logger.warn('部分 PWA 图标文件无法访问', undefined, 'PWA')
    }

    precacheResources(['/', '/manifest.webmanifest', '/pwa-192x192.png', '/pwa-512x512.png'])
  }

  logger.info(
    `PWA 功能初始化完成`,
    {
      installed: isInstalled.value,
      canInstall: canInstall.value,
      online: isOnline.value,
      supported: isPWASupported(),
    },
    'PWA'
  )
}
