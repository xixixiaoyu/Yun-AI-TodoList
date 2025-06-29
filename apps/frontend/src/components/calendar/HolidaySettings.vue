<template>
  <div class="holiday-settings">
    <div class="settings-header">
      <h3 class="settings-title">
        <i class="i-carbon-calendar-settings"></i>
        {{ t('holidaySettings') }}
      </h3>
      <button class="close-btn" @click="$emit('close')">
        <i class="i-carbon-close"></i>
      </button>
    </div>

    <div class="settings-content">
      <!-- 总开关 -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="i-carbon-view"></i>
          <span>{{ t('showHolidays') }}</span>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="config.showHolidays"
            @change="updateConfig({ showHolidays: $event.target.checked })"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- 节假日类型设置 -->
      <div v-if="config.showHolidays" class="settings-group">
        <h4 class="group-title">{{ t('holidayTypes') }}</h4>

        <div class="setting-item">
          <div class="setting-label">
            <div class="holiday-type-indicator legal"></div>
            <span>{{ t('legalHolidays') }}</span>
            <span class="setting-description">{{ t('legalHolidaysDesc') }}</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.showLegalHolidays"
              @change="updateConfig({ showLegalHolidays: $event.target.checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <div class="holiday-type-indicator traditional"></div>
            <span>{{ t('traditionalHolidays') }}</span>
            <span class="setting-description">{{ t('traditionalHolidaysDesc') }}</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.showTraditionalHolidays"
              @change="updateConfig({ showTraditionalHolidays: $event.target.checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <div class="holiday-type-indicator international"></div>
            <span>{{ t('internationalHolidays') }}</span>
            <span class="setting-description">{{ t('internationalHolidaysDesc') }}</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.showInternationalHolidays"
              @change="updateConfig({ showInternationalHolidays: $event.target.checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <div class="holiday-type-indicator custom"></div>
            <span>{{ t('customHolidays') }}</span>
            <span class="setting-description">{{ t('customHolidaysDesc') }}</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.showCustomHolidays"
              @change="updateConfig({ showCustomHolidays: $event.target.checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 语言设置 -->
      <div v-if="config.showHolidays" class="settings-group">
        <h4 class="group-title">{{ t('language') }}</h4>

        <div class="setting-item">
          <div class="setting-label">
            <i class="i-carbon-language"></i>
            <span>{{ t('holidayLanguage') }}</span>
          </div>
          <select
            :value="config.locale"
            class="language-select"
            @change="updateConfig({ locale: $event.target.value })"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <!-- 自定义节假日管理 -->
      <div v-if="config.showHolidays && config.showCustomHolidays" class="settings-group">
        <h4 class="group-title">自定义节假日</h4>

        <!-- 添加自定义节假日 -->
        <div class="custom-holiday-form">
          <div class="form-row">
            <input
              v-model="newHoliday.name"
              type="text"
              placeholder="节假日名称"
              class="form-input"
            />
            <input v-model="newHoliday.date" type="date" class="form-input" />
          </div>
          <div class="form-row">
            <input
              v-model="newHoliday.description"
              type="text"
              placeholder="描述（可选）"
              class="form-input"
            />
            <input
              v-model="newHoliday.icon"
              type="text"
              placeholder="图标（如🎉）"
              class="form-input icon-input"
            />
          </div>
          <div class="form-row">
            <input v-model="newHoliday.color" type="color" class="form-color" />
            <button class="add-btn" :disabled="!canAddHoliday" @click="addCustomHoliday">
              <i class="i-carbon-add"></i>
              添加
            </button>
          </div>
        </div>

        <!-- 自定义节假日列表 -->
        <div v-if="customHolidays.length > 0" class="custom-holidays-list">
          <div v-for="holiday in customHolidays" :key="holiday.id" class="custom-holiday-item">
            <div class="holiday-info">
              <div class="holiday-icon-display">
                <span v-if="holiday.icon">{{ holiday.icon }}</span>
                <div v-else class="holiday-dot" :style="{ backgroundColor: holiday.color }"></div>
              </div>
              <div class="holiday-details">
                <span class="holiday-name">{{ holiday.name }}</span>
                <span class="holiday-date">{{ formatHolidayDate(holiday.date) }}</span>
                <span v-if="holiday.description" class="holiday-desc">{{
                  holiday.description
                }}</span>
              </div>
            </div>
            <button class="remove-btn" @click="removeCustomHoliday(holiday.id)">
              <i class="i-carbon-trash-can"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 节假日预览 -->
      <div v-if="config.showHolidays" class="settings-group">
        <h4 class="group-title">{{ t('upcomingHolidays') }}</h4>
        <div class="holiday-preview">
          <div v-for="holiday in upcomingHolidays" :key="holiday.id" class="holiday-preview-item">
            <div class="holiday-date">{{ formatHolidayDate(holiday.date) }}</div>
            <div class="holiday-info">
              <span class="holiday-name">{{ getHolidayName(holiday) }}</span>
              <span class="holiday-type">{{ getHolidayTypeText(holiday.type) }}</span>
            </div>
            <div class="holiday-indicator-preview">
              <span v-if="holiday.icon" class="holiday-icon">{{ holiday.icon }}</span>
              <div v-else class="holiday-dot" :style="{ backgroundColor: holiday.color }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { format, isAfter, isBefore, addMonths } from 'date-fns'
import type { HolidayConfig } from '@/types/holiday'
import { useHolidays } from '@/composables/useHolidays'

// Props
interface Props {
  show: boolean
}

defineProps<Props>()

// Events
defineEmits<{
  close: []
}>()

// 国际化
const { t } = useI18n()

// 节假日管理
const {
  holidayConfig,
  updateHolidayConfig,
  getHolidaysForMonth,
  getHolidayName,
  customHolidays,
  addCustomHoliday: addHoliday,
  removeCustomHoliday: removeHoliday,
} = useHolidays()

// 新节假日表单数据
const newHoliday = ref({
  name: '',
  date: '',
  description: '',
  icon: '',
  color: '#ff6b6b',
})

// 计算属性
const config = computed(() => holidayConfig)

// 获取未来3个月的节假日
const upcomingHolidays = computed(() => {
  const now = new Date()
  const threeMonthsLater = addMonths(now, 3)

  const holidays = []
  for (let i = 0; i < 3; i++) {
    const targetDate = addMonths(now, i)
    const monthHolidays = getHolidaysForMonth(targetDate.getFullYear(), targetDate.getMonth() + 1)
    holidays.push(...monthHolidays)
  }

  return holidays
    .filter((holiday) => {
      const holidayDate = new Date(holiday.date)
      return isAfter(holidayDate, now) && isBefore(holidayDate, threeMonthsLater)
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) // 只显示前5个
})

// 方法
const updateConfig = (updates: Partial<HolidayConfig>) => {
  updateHolidayConfig(updates)
}

// 检查是否可以添加节假日
const canAddHoliday = computed(() => {
  return newHoliday.value.name.trim() && newHoliday.value.date
})

// 添加自定义节假日
const addCustomHoliday = () => {
  if (!canAddHoliday.value) return

  addHoliday({
    name: newHoliday.value.name.trim(),
    nameEn: newHoliday.value.name.trim(),
    date: newHoliday.value.date,
    description: newHoliday.value.description.trim() || undefined,
    icon: newHoliday.value.icon.trim() || undefined,
    importance: 'medium', // 固定为中等重要程度
    color: newHoliday.value.color,
    isOfficial: false,
  })

  // 重置表单
  newHoliday.value = {
    name: '',
    date: '',
    description: '',
    icon: '',
    color: '#ff6b6b',
  }
}

// 删除自定义节假日
const removeCustomHoliday = (id: string) => {
  removeHoliday(id)
}

// 格式化节假日日期
const formatHolidayDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return format(date, 'MM月dd日')
  } catch {
    return dateStr
  }
}

const getHolidayTypeText = (type: string) => {
  const typeMap = {
    legal: t('legal'),
    traditional: t('traditional'),
    international: t('international'),
    custom: t('custom'),
  }
  return typeMap[type] || type
}

defineOptions({
  name: 'HolidaySettings',
})
</script>

<style scoped>
.holiday-settings {
  @apply bg-white rounded-lg border border-gray-200 shadow-2xl;
  @apply max-w-2xl w-full max-h-[80vh] overflow-hidden;
}

.settings-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
  @apply bg-gray-50;
}

.settings-title {
  @apply text-lg font-semibold text-gray-900 flex items-center gap-2;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-gray-200 transition-colors;
  @apply text-gray-600 hover:text-gray-900;
}

.settings-content {
  @apply p-4 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)];
  @apply bg-white;
}

.settings-group {
  @apply space-y-3;
}

.group-title {
  @apply text-sm font-medium text-gray-700 uppercase tracking-wide;
}

.setting-item {
  @apply flex items-center justify-between gap-4 p-3 rounded-lg;
  @apply hover:bg-gray-50 transition-colors;
}

.setting-label {
  @apply flex items-center gap-3 flex-1;
  @apply text-gray-900;
}

.setting-description {
  @apply text-xs text-gray-600 block mt-1;
}

.holiday-type-indicator {
  @apply w-3 h-3 rounded-full border border-white shadow-sm;
}

.holiday-type-indicator.legal {
  @apply bg-red-500;
}

.holiday-type-indicator.traditional {
  @apply bg-orange-500;
}

.holiday-type-indicator.international {
  @apply bg-blue-500;
}

.holiday-type-indicator.custom {
  @apply bg-purple-500;
}

.toggle-switch {
  @apply relative inline-block w-12 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0;
  @apply bg-gray-300 rounded-full transition-all duration-300;
}

.toggle-slider:before {
  @apply absolute content-[''] h-4 w-4 left-1 bottom-1;
  @apply bg-white rounded-full transition-all duration-300 shadow-sm;
}

input:checked + .toggle-slider {
  @apply bg-green-500;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.language-select {
  @apply px-3 py-2 rounded-lg border border-gray-300;
  @apply bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

/* 自定义节假日表单 */
.custom-holiday-form {
  @apply space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.form-row {
  @apply flex gap-2;
}

.form-input {
  @apply flex-1 px-3 py-2 rounded-lg border border-gray-300;
  @apply bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.icon-input {
  @apply max-w-20 text-center;
}

.form-color {
  @apply w-12 h-10 rounded-lg border border-gray-300 cursor-pointer;
}

.add-btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg;
  @apply hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed;
  @apply flex items-center gap-2 transition-colors;
}

/* 自定义节假日列表 */
.custom-holidays-list {
  @apply space-y-2 mt-4;
}

.custom-holiday-item {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200;
  @apply hover:bg-gray-100 transition-colors;
}

.holiday-info {
  @apply flex items-center gap-3 flex-1;
}

.holiday-icon-display {
  @apply flex items-center justify-center w-8 h-8;
}

.holiday-details {
  @apply flex flex-col;
}

.holiday-name {
  @apply font-medium text-gray-900;
}

.holiday-date {
  @apply text-sm text-gray-600;
}

.holiday-desc {
  @apply text-xs text-gray-500;
}

.remove-btn {
  @apply p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg;
  @apply transition-colors;
}

.holiday-preview {
  @apply space-y-2 max-h-40 overflow-y-auto;
}

.holiday-preview-item {
  @apply flex items-center gap-3 p-2 rounded-lg bg-bg-secondary;
}

.holiday-date {
  @apply text-sm font-medium text-text-secondary min-w-[40px];
}

.holiday-info {
  @apply flex-1;
}

.holiday-name {
  @apply text-sm font-medium text-text block;
}

.holiday-type {
  @apply text-xs text-text-secondary;
}

.holiday-indicator-preview {
  @apply flex items-center justify-center;
}

.holiday-icon {
  @apply text-sm;
}

.holiday-dot {
  @apply w-3 h-3 rounded-full border border-white shadow-sm;
}

/* 深色主题 */
[data-theme='dark'] .holiday-settings {
  @apply bg-card border-border;
}

[data-theme='dark'] .settings-header {
  @apply border-border;
}

[data-theme='dark'] .toggle-slider {
  @apply bg-bg-tertiary;
}

[data-theme='dark'] .language-select {
  @apply bg-card border-border;
}

[data-theme='dark'] .holiday-preview-item {
  @apply bg-bg-tertiary;
}
</style>
