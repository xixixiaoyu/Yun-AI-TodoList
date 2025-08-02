/**
 * PWA 配置优化工具
 * 解决 manifest 图标和缓存问题
 */

export interface PWAConfig {
  manifestIcons: Array<{
    src: string
    sizes: string
    type: string
    purpose?: string
  }>
  cacheStrategies: {
    images: string
    pages: string
    assets: string
  }
}

/**
 * 获取优化的 PWA 配置
 */
export function getOptimizedPWAConfig(): PWAConfig {
  return {
    manifestIcons: [
      {
        src: './pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: './pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: './pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: './apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    cacheStrategies: {
      images: 'CacheFirst',
      pages: 'NetworkFirst',
      assets: 'StaleWhileRevalidate',
    },
  }
}

/**
 * 验证图标文件是否存在
 */
export async function validatePWAIcons(): Promise<boolean> {
  const icons = ['/pwa-192x192.png', '/pwa-512x512.png', '/apple-touch-icon.png']

  try {
    const results = await Promise.all(
      icons.map(async (icon) => {
        try {
          const response = await fetch(icon, { method: 'HEAD' })
          return response.ok
        } catch {
          return false
        }
      })
    )

    return results.every(Boolean)
  } catch {
    return false
  }
}

/**
 * 减少 PWA 日志输出的配置
 */

export function configurePWALogging() {
  // 在生产环境中减少 workbox 日志
  if ((import.meta as { env: { PROD?: boolean } }).env.PROD) {
    // 覆盖 console.log 以过滤 workbox 日志
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      const message = args.join(' ')
      if (
        message.includes('workbox') ||
        message.includes('Router is responding to') ||
        message.includes('Using CacheFirst')
      ) {
        return // 忽略 workbox 日志
      }
      originalLog.apply(console, args)
    }
  }
}

/**
 * 配置 PWA 状态栏主题色
 * 根据当前主题动态调整状态栏颜色
 */
export function configurePWAThemeColor() {
  // 获取当前主题
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark'

  // 设置主题色
  const themeColor = isDarkTheme ? '#1e2329' : '#8cb9a8'

  // 更新 meta 标签
  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColorMeta)
  }
  themeColorMeta.setAttribute('content', themeColor)

  // 为 iOS Safari 设置状态栏样式
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta')
    statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
    document.head.appendChild(statusBarMeta)
  }
  statusBarMeta.setAttribute('content', isDarkTheme ? 'black-translucent' : 'default')

  // 为 Android 设置状态栏颜色
  let msApplicationMeta = document.querySelector('meta[name="msapplication-navbutton-color"]')
  if (!msApplicationMeta) {
    msApplicationMeta = document.createElement('meta')
    msApplicationMeta.setAttribute('name', 'msapplication-navbutton-color')
    document.head.appendChild(msApplicationMeta)
  }
  msApplicationMeta.setAttribute('content', themeColor)
}
