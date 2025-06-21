<template>
  <div v-if="config.showDialog" class="fixed inset-0 z-[9999] flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
      @click="handleCancel"
    ></div>

    <!-- 对话框内容 -->
    <div
      class="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-hidden"
    >
      <!-- 头部 -->
      <div class="px-8 py-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">AI 任务拆分建议</h3>
          <button @click="handleCancel" class="text-gray-400 hover:text-gray-600 transition-colors">
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
      </div>

      <!-- 内容区域 -->
      <div class="px-8 py-6 max-h-[60vh] overflow-y-auto">
        <!-- 原始任务 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">原始任务：</h4>
          <div class="bg-gray-50 rounded-lg p-3 text-gray-800">
            {{ config.originalTask }}
          </div>
        </div>

        <!-- AI 分析理由 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">AI 分析：</h4>
          <div class="bg-blue-50 rounded-lg p-3 text-blue-800 text-sm">
            {{ config.reasoning }}
          </div>
        </div>

        <!-- 建议的子任务 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">建议拆分为以下子任务：</h4>
          <div class="space-y-2">
            <div
              v-for="(subtask, index) in selectedSubtasks"
              :key="index"
              class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <input
                :id="`subtask-${index}`"
                v-model="subtask.selected"
                type="checkbox"
                class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label :for="`subtask-${index}`" class="flex-1 text-sm text-gray-800 cursor-pointer">
                {{ subtask.text }}
              </label>
            </div>
          </div>
        </div>

        <!-- 操作提示 -->
        <div class="bg-yellow-50 rounded-lg p-3 text-yellow-800 text-sm">
          <div class="flex items-start space-x-2">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <div>
              <p class="font-medium">选择操作：</p>
              <p>• 选择「使用拆分」：将添加选中的子任务到列表</p>
              <p>• 选择「保持原样」：添加原始任务到列表</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="px-8 py-6 border-t border-gray-200 flex justify-end space-x-4">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          保持原样
        </button>
        <button
          @click="handleConfirm"
          :disabled="!hasSelectedSubtasks"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          使用拆分 ({{ selectedCount }}个)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SubtaskSelectionConfig } from '@/types/todo'

interface Props {
  config: SubtaskSelectionConfig
}

interface Emits {
  confirm: [subtasks: string[]]
  cancel: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 子任务选择状态
interface SelectableSubtask {
  text: string
  selected: boolean
}

const selectedSubtasks = ref<SelectableSubtask[]>([])

// 监听配置变化，初始化选择状态
watch(
  () => props.config.subtasks,
  (newSubtasks) => {
    selectedSubtasks.value = newSubtasks.map((text) => ({
      text,
      selected: true, // 默认全选
    }))
  },
  { immediate: true }
)

// 计算属性
const hasSelectedSubtasks = computed(() => {
  return selectedSubtasks.value.some((subtask) => subtask.selected)
})

const selectedCount = computed(() => {
  return selectedSubtasks.value.filter((subtask) => subtask.selected).length
})

// 事件处理
function handleConfirm() {
  const selected = selectedSubtasks.value
    .filter((subtask) => subtask.selected)
    .map((subtask) => subtask.text)

  emit('confirm', selected)
}

function handleCancel() {
  emit('cancel')
}
</script>
