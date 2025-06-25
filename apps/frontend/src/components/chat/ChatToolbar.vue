<template>
  <div class="flex gap-3 px-6 md:px-4 md:gap-2">
    <button
      :disabled="isGenerating"
      :class="[
        'px-4 py-2.5 text-sm border rounded-lg flex items-center gap-2 transition-all duration-200 h-10 md:px-3 md:py-2 md:text-[13px] md:h-9',
        isGenerating
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
          : 'bg-input-bg text-text border-input-border cursor-pointer hover:bg-button-hover hover:text-white hover:border-button-bg hover:shadow-[0_2px_8px_rgba(121,180,166,0.2)]',
      ]"
      @click="!isGenerating && $emit('new')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        class="md:w-3.5 md:h-3.5"
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
      {{ t('newConversation') }}
    </button>

    <!-- Todo 任务助手按钮 -->
    <button
      :disabled="isGenerating || isGeneratingPrompt"
      :class="[
        'px-4 py-2.5 text-sm border rounded-lg flex items-center gap-2 transition-all duration-200 h-10 md:px-3 md:py-2 md:text-[13px] md:h-9',
        isGenerating || isGeneratingPrompt
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
          : isTodoAssistantActive
            ? 'bg-button-bg text-white border-button-bg shadow-[0_2px_8px_rgba(121,180,166,0.3)]'
            : 'bg-input-bg text-text border-input-border cursor-pointer hover:bg-button-hover hover:text-white hover:border-button-bg hover:shadow-[0_2px_8px_rgba(121,180,166,0.2)]',
      ]"
      :title="getButtonTitle()"
      @click="handleTodoAssistant"
    >
      <svg
        v-if="isGeneratingPrompt"
        class="w-4 h-4 animate-spin md:w-3.5 md:h-3.5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <!-- 现代化的 AI 助手图标 -->
      <svg
        v-else
        class="w-4 h-4 md:w-3.5 md:h-3.5"
        :class="isTodoAssistantActive ? 'text-white' : 'text-current'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <!-- 智能芯片/处理器图标 -->
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
        <!-- 添加一些表示智能的装饰线条 -->
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6" opacity="0.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 8h2" opacity="0.3" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 16h4" opacity="0.3" />
      </svg>
      <span class="hidden sm:inline">{{
        isGeneratingPrompt
          ? t('generating')
          : isTodoAssistantActive
            ? t('todoAssistantActive')
            : t('todoAssistant')
      }}</span>
    </button>

    <button
      class="px-3 py-2.5 text-sm bg-input-bg text-text border border-input-border rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 h-10 w-10 hover:bg-button-hover hover:text-white hover:border-button-bg hover:shadow-[0_2px_8px_rgba(121,180,166,0.2)] md:py-2 md:h-9 md:w-9"
      @click="$emit('toggleDrawer')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        class="md:w-3.5 md:h-3.5"
      >
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTodoSystemPrompt } from '@/composables/useSmartQuestion'
import { useTodos } from '@/composables/useTodos'
import { useI18n } from 'vue-i18n'

defineProps<{
  isGenerating?: boolean
}>()

defineEmits<{
  (e: 'new'): void
  (e: 'toggleDrawer'): void
}>()

const { t } = useI18n()
const { todos } = useTodos()
const {
  isGenerating: isGeneratingPrompt,
  generateAndActivateTodoPrompt,
  deactivateTodoPrompt,
  isTodoPromptActive: isTodoAssistantActive,
} = useTodoSystemPrompt()

/**
 * 处理 Todo 任务助手按钮点击
 */
const handleTodoAssistant = async () => {
  try {
    if (isTodoAssistantActive.value) {
      // 如果已激活，则停用
      await deactivateTodoPrompt()
    } else {
      // 如果未激活，则激活
      await generateAndActivateTodoPrompt(todos.value)
    }
  } catch (error) {
    console.error('Todo 任务助手操作失败:', error)
  }
}

/**
 * 获取按钮标题
 */
const getButtonTitle = (): string => {
  if (isGeneratingPrompt.value) {
    return t('generating')
  }
  return isTodoAssistantActive.value
    ? t('todoAssistantActiveTitle', '点击停用 Todo 任务助手')
    : t('todoAssistantTitle', '点击激活 Todo 任务助手，AI 将了解您的所有任务信息')
}
</script>
