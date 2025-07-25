/**
 * 平台检测工具
 * 用于检测当前运行环境（Web、Electron）
 */

export interface PlatformInfo {
  isWeb: boolean
  isElectron: boolean
  isMobile: boolean
  platform: 'web' | 'electron'
}

export function isElectron(): boolean {
  return (
    !!(window as typeof window & { electronAPI?: unknown }).electronAPI ||
    typeof (window as typeof window & { require?: unknown }).require !== 'undefined'
  )
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function getPlatformInfo(): PlatformInfo {
  const isElectronEnv = isElectron()
  const isMobileEnv = isMobileDevice()

  let platform: PlatformInfo['platform'] = 'web'

  if (isElectronEnv) {
    platform = 'electron'
  }

  return {
    isWeb: !isElectronEnv,
    isElectron: isElectronEnv,
    isMobile: isMobileEnv,
    platform,
  }
}

export function getPlatformClasses(): string[] {
  const info = getPlatformInfo()
  const classes: string[] = []

  if (info.isElectron) classes.push('platform-electron')
  if (info.isMobile) classes.push('platform-mobile')
  if (info.isWeb) classes.push('platform-web')

  return classes
}

export function platformLog(message: string, ...args: unknown[]): void {
  const info = getPlatformInfo()

  console.warn(`[${info.platform.toUpperCase()}] ${message}`, ...args)
}
