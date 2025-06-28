/**
 * 节假日管理 Composable
 */

import { allHolidays2025, holidaysByDate2025 } from '@/data/holidays'
import type { Holiday, HolidayConfig } from '@/types/holiday'
import { format } from 'date-fns'
import { computed, reactive, readonly, ref } from 'vue'

// 全局节假日配置
const holidayConfig = reactive<HolidayConfig>({
  showHolidays: true,
  showLegalHolidays: true,
  showTraditionalHolidays: true,
  showInternationalHolidays: true,
  showCustomHolidays: true,
  locale: 'zh',
})

// 自定义节假日存储
const customHolidays = ref<Holiday[]>([])

// 节假日缓存
const holidayCache = ref<Record<string, Holiday[]>>({})

// 2026年数据的懒加载
let allHolidays2026: Holiday[] = []
let holidaysByDate2026: Record<string, Holiday[]> = {}

// 加载2026年数据
const load2026Data = async () => {
  try {
    const module = await import('@/data/holidays')
    allHolidays2026 = module.allHolidays2026 || []
    holidaysByDate2026 = module.holidaysByDate2026 || {}
  } catch (error) {
    console.warn('Failed to load 2026 holiday data:', error)
  }
}

// 立即加载2026年数据
load2026Data()

export function useHolidays() {
  /**
   * 根据年份获取节假日数据
   */
  const getHolidayDataByYear = (year: number) => {
    switch (year) {
      case 2025:
        return { allHolidays: allHolidays2025, holidaysByDate: holidaysByDate2025 }
      case 2026:
        return { allHolidays: allHolidays2026, holidaysByDate: holidaysByDate2026 }
      default:
        return { allHolidays: allHolidays2025, holidaysByDate: holidaysByDate2025 }
    }
  }

  /**
   * 获取指定日期的节假日
   */
  const getHolidaysForDate = (date: Date): Holiday[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const year = date.getFullYear()

    // 从缓存中获取
    if (holidayCache.value[dateKey]) {
      return filterHolidaysByConfig(holidayCache.value[dateKey])
    }

    // 从数据源获取
    const { holidaysByDate } = getHolidayDataByYear(year)
    const holidays = holidaysByDate[dateKey] || []
    const customHolidaysForDate = customHolidays.value.filter((h) => h.date === dateKey)
    const allHolidaysForDate = [...holidays, ...customHolidaysForDate]

    // 缓存结果
    holidayCache.value[dateKey] = allHolidaysForDate

    return filterHolidaysByConfig(allHolidaysForDate)
  }

  /**
   * 根据配置过滤节假日
   */
  const filterHolidaysByConfig = (holidays: Holiday[]): Holiday[] => {
    if (!holidayConfig.showHolidays) {
      return []
    }

    return holidays.filter((holiday) => {
      switch (holiday.type) {
        case 'legal':
          return holidayConfig.showLegalHolidays
        case 'traditional':
          return holidayConfig.showTraditionalHolidays
        case 'international':
          return holidayConfig.showInternationalHolidays
        case 'custom':
          return holidayConfig.showCustomHolidays
        default:
          return true
      }
    })
  }

  /**
   * 获取指定月份的所有节假日
   */
  const getHolidaysForMonth = (year: number, month: number): Holiday[] => {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`
    const { allHolidays } = getHolidayDataByYear(year)

    return allHolidays
      .concat(customHolidays.value)
      .filter((holiday) => holiday.date.startsWith(monthKey))
      .filter((holiday) => filterHolidaysByConfig([holiday]).length > 0)
  }

  /**
   * 检查指定日期是否为节假日
   */
  const isHoliday = (date: Date): boolean => {
    return getHolidaysForDate(date).length > 0
  }

  /**
   * 检查指定日期是否为法定节假日
   */
  const isLegalHoliday = (date: Date): boolean => {
    return getHolidaysForDate(date).some((h) => h.type === 'legal' && h.isOfficial)
  }

  /**
   * 获取节假日显示名称
   */
  const getHolidayName = (holiday: Holiday): string => {
    if (holidayConfig.locale === 'en' && holiday.nameEn) {
      return holiday.nameEn
    }
    return holiday.name
  }

  /**
   * 添加自定义节假日
   */
  const addCustomHoliday = (holiday: Omit<Holiday, 'id' | 'type'>): void => {
    const newHoliday: Holiday = {
      ...holiday,
      id: `custom-${Date.now()}`,
      type: 'custom',
    }

    customHolidays.value.push(newHoliday)

    // 清除相关缓存
    delete holidayCache.value[holiday.date]

    // 保存到本地存储
    saveCustomHolidays()
  }

  /**
   * 删除自定义节假日
   */
  const removeCustomHoliday = (id: string): void => {
    const index = customHolidays.value.findIndex((h) => h.id === id)
    if (index > -1) {
      const holiday = customHolidays.value[index]
      customHolidays.value.splice(index, 1)

      // 清除相关缓存
      delete holidayCache.value[holiday.date]

      // 保存到本地存储
      saveCustomHolidays()
    }
  }

  /**
   * 更新节假日配置
   */
  const updateHolidayConfig = (config: Partial<HolidayConfig>): void => {
    Object.assign(holidayConfig, config)

    // 清除所有缓存，因为过滤条件可能已改变
    holidayCache.value = {}

    // 保存配置到本地存储
    saveHolidayConfig()
  }

  /**
   * 保存自定义节假日到本地存储
   */
  const saveCustomHolidays = (): void => {
    try {
      localStorage.setItem('custom-holidays', JSON.stringify(customHolidays.value))
    } catch (error) {
      console.warn('Failed to save custom holidays:', error)
    }
  }

  /**
   * 从本地存储加载自定义节假日
   */
  const loadCustomHolidays = (): void => {
    try {
      const saved = localStorage.getItem('custom-holidays')
      if (saved) {
        customHolidays.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load custom holidays:', error)
    }
  }

  /**
   * 保存节假日配置到本地存储
   */
  const saveHolidayConfig = (): void => {
    try {
      localStorage.setItem('holiday-config', JSON.stringify(holidayConfig))
    } catch (error) {
      console.warn('Failed to save holiday config:', error)
    }
  }

  /**
   * 从本地存储加载节假日配置
   */
  const loadHolidayConfig = (): void => {
    try {
      const saved = localStorage.getItem('holiday-config')
      if (saved) {
        const config = JSON.parse(saved)
        Object.assign(holidayConfig, config)
      }
    } catch (error) {
      console.warn('Failed to load holiday config:', error)
    }
  }

  // 初始化时加载数据
  loadCustomHolidays()
  loadHolidayConfig()

  return {
    // 状态
    holidayConfig: readonly(holidayConfig),
    customHolidays: readonly(customHolidays),

    // 方法
    getHolidaysForDate,
    getHolidaysForMonth,
    isHoliday,
    isLegalHoliday,
    getHolidayName,
    addCustomHoliday,
    removeCustomHoliday,
    updateHolidayConfig,

    // 计算属性
    isHolidayEnabled: computed(() => holidayConfig.showHolidays),
  }
}
