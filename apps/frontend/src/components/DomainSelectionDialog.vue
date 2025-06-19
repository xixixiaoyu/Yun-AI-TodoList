<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] shadow-xl">
      <!-- 头部 -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('selectDomain') }}
        </h3>
        <button
          @click="$emit('cancel')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- 描述 -->
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        {{ t('selectDomainDescription') }}
      </p>

      <!-- 领域选择 -->
      <div class="space-y-2 mb-6">
        <!-- 预设选项 -->
        <label
          v-for="domain in domains"
          :key="domain"
          class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{
            'border-blue-500 bg-blue-50 dark:bg-blue-900/20':
              selectedDomain === domain && !showCustomInput,
            'border-gray-200 dark:border-gray-600': selectedDomain !== domain || showCustomInput,
          }"
        >
          <input
            type="radio"
            :value="domain"
            v-model="selectedDomain"
            @change="showCustomInput = false"
            class="mr-3 text-blue-600"
          />
          <span class="text-gray-900 dark:text-white">
            {{ t(`domain.${domain}`) }}
          </span>
        </label>

        <!-- 自定义输入选项 -->
        <label
          class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{
            'border-blue-500 bg-blue-50 dark:bg-blue-900/20': showCustomInput,
            'border-gray-200 dark:border-gray-600': !showCustomInput,
          }"
        >
          <input
            type="radio"
            value="custom"
            @change="handleCustomSelection"
            :checked="showCustomInput"
            class="mr-3 text-blue-600"
          />
          <span class="text-gray-900 dark:text-white">
            {{ t('domain.custom') }}
          </span>
        </label>

        <!-- 自定义输入框 -->
        <div v-if="showCustomInput" class="ml-6 mt-2">
          <input
            v-model="customDomain"
            type="text"
            :placeholder="t('customDomainPlaceholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @focus="showCustomInput = true"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          {{ t('cancelSelection') }}
        </button>
        <button
          @click="handleConfirm"
          :disabled="!selectedDomain && (!showCustomInput || !customDomain.trim())"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ t('confirmSelection') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
}

interface Emits {
  confirm: [domain: string]
  cancel: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const selectedDomain = ref('')
const customDomain = ref('')
const showCustomInput = ref(false)

const domains = ['work', 'study', 'life']

const handleCustomSelection = () => {
  showCustomInput.value = true
  selectedDomain.value = ''
}

const handleConfirm = () => {
  // 检查是否选择了自定义领域
  if (selectedDomain.value === 'custom' || showCustomInput.value) {
    const trimmedCustomDomain = customDomain.value.trim()
    if (!trimmedCustomDomain) {
      return
    }
    emit('confirm', trimmedCustomDomain)
    resetForm()
  } else if (selectedDomain.value && selectedDomain.value !== 'custom') {
    emit('confirm', selectedDomain.value)
    resetForm()
  }
}

const resetForm = () => {
  selectedDomain.value = ''
  customDomain.value = ''
  showCustomInput.value = false
}
</script>
