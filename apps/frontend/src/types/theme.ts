/**
 * 主题相关类型定义
 */
import type { VNode } from 'vue'

export type ThemeValue = 'light' | 'dark' | 'auto'

export interface ThemeOption {
  value: ThemeValue
  label: string
  description: string
  icon: () => VNode
}
