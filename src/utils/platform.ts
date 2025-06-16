/**
 * 平台检测工具
 * 用于检测当前运行环境（Web、Electron、Capacitor）
 */

import { Capacitor } from '@capacitor/core'

export interface PlatformInfo {
  isWeb: boolean
  isElectron: boolean
  isCapacitor: boolean
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  platform: 'web' | 'electron' | 'android' | 'ios'
}

export function isElectron(): boolean {
  return (
    !!(window as typeof window & { electronAPI?: unknown }).electronAPI ||
    typeof (window as typeof window & { require?: unknown }).require !== 'undefined'
  )
}

export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform()
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 获取当前平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const isCapacitorEnv = isCapacitor()
  const isElectronEnv = isElectron()
  const isMobileEnv = isMobileDevice() || isCapacitorEnv

  let platform: PlatformInfo['platform'] = 'web'

  if (isElectronEnv) {
    platform = 'electron'
  } else if (isCapacitorEnv) {
    if (Capacitor.getPlatform() === 'android') {
      platform = 'android'
    } else if (Capacitor.getPlatform() === 'ios') {
      platform = 'ios'
    }
  }

  return {
    isWeb: !isElectronEnv && !isCapacitorEnv,
    isElectron: isElectronEnv,
    isCapacitor: isCapacitorEnv,
    isMobile: isMobileEnv,
    isAndroid: isCapacitorEnv && Capacitor.getPlatform() === 'android',
    isIOS: isCapacitorEnv && Capacitor.getPlatform() === 'ios',
    platform,
  }
}

export function getPlatformClasses(): string[] {
  const info = getPlatformInfo()
  const classes: string[] = []

  if (info.isElectron) classes.push('platform-electron')
  if (info.isCapacitor) classes.push('platform-capacitor')
  if (info.isMobile) classes.push('platform-mobile')
  if (info.isAndroid) classes.push('platform-android')
  if (info.isIOS) classes.push('platform-ios')
  if (info.isWeb) classes.push('platform-web')

  return classes
}

export function platformLog(message: string, ...args: unknown[]): void {
  const info = getPlatformInfo()

  console.warn(`[${info.platform.toUpperCase()}] ${message}`, ...args)
}
