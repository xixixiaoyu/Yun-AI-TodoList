/**
 * 节假日类型定义
 */

// 节假日类型
export type HolidayType =
  | 'legal' // 法定节假日
  | 'traditional' // 传统节日
  | 'international' // 国际节日
  | 'custom' // 用户自定义

// 节假日重要程度
export type HolidayImportance = 'high' | 'medium' | 'low'

// 节假日信息
export interface Holiday {
  id: string
  name: string
  nameEn?: string // 英文名称
  date: string // YYYY-MM-DD 格式
  type: HolidayType
  importance: HolidayImportance
  isOfficial: boolean // 是否为官方假期
  description?: string
  color?: string // 显示颜色
  icon?: string // 图标
}

// 节假日配置
export interface HolidayConfig {
  showHolidays: boolean // 是否显示节假日
  showLegalHolidays: boolean // 显示法定节假日
  showTraditionalHolidays: boolean // 显示传统节日
  showInternationalHolidays: boolean // 显示国际节日
  showCustomHolidays: boolean // 显示自定义节假日
  locale: 'zh' | 'en' // 语言设置
}

// 节假日查询参数
export interface HolidayQuery {
  year: number
  month?: number
  types?: HolidayType[]
  locale?: 'zh' | 'en'
}

// 节假日响应
export interface HolidayResponse {
  holidays: Holiday[]
  total: number
  year: number
  month?: number
}
