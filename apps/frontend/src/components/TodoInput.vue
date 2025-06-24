<template>
  <form class="add-todo-form" @submit.prevent="addTodo">
    <div class="input-wrapper" :class="{ 'has-error': hasError }">
      <input
        ref="inputRef"
        v-model.trim="newTodo"
        class="todo-input"
        :class="{ 'error-state': hasError }"
        :placeholder="placeholder"
        :maxlength="maxLength"
        @input="clearError"
        @focus="showErrorTooltip = true"
        @blur="showErrorTooltip = false"
      />
      <!-- 错误图标 -->
      <div
        v-if="hasError"
        class="error-icon"
        @mouseenter="showErrorTooltip = true"
        @mouseleave="showErrorTooltip = false"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" />
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>

      <!-- 浮动错误提示 -->
      <Teleport to="body">
        <div
          v-if="hasError && showErrorTooltip"
          ref="tooltipRef"
          class="error-tooltip"
          :style="tooltipStyle"
        >
          <div class="error-tooltip-content">
            {{ currentErrorMessage }}
          </div>
          <div class="error-tooltip-arrow"></div>
        </div>
      </Teleport>
    </div>
    <button type="submit" class="add-btn" :disabled="props.isLoading">
      <template v-if="props.isLoading">
        <span class="loading-spinner"></span>
        <span class="ml-2">{{ t('aiAnalyzing') }}</span>
      </template>
      <span v-else>{{ t('add') }}</span>
    </button>
  </form>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    maxLength?: number
    duplicateError?: string
    placeholder?: string
    isLoading?: boolean
  }>(),
  {
    maxLength: 50,
    duplicateError: '',
    placeholder: '添加新的待办事项...',
    isLoading: false,
  }
)

const emit = defineEmits(['add', 'clearDuplicateError'])

const { t } = useI18n()

const newTodo = ref('')
const errorMessage = ref('')
const showErrorTooltip = ref(false)
const inputRef = ref<HTMLInputElement>()
const tooltipRef = ref<HTMLDivElement>()

// 计算属性
const hasError = computed(() => !!(errorMessage.value || props.duplicateError))
const currentErrorMessage = computed(() => errorMessage.value || props.duplicateError)

// 错误提示框位置计算
const tooltipStyle = ref({})

const updateTooltipPosition = () => {
  if (!inputRef.value || !tooltipRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()

  // 计算提示框位置（显示在输入框下方）
  const top = inputRect.bottom + 8
  const left = Math.max(8, inputRect.left - (tooltipRect.width - inputRect.width) / 2)

  // 确保提示框不超出视窗右边界
  const maxLeft = window.innerWidth - tooltipRect.width - 8
  const finalLeft = Math.min(left, maxLeft)

  tooltipStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${finalLeft}px`,
    zIndex: 9999,
  }
}

// 监听错误状态变化，更新提示框位置
watch([hasError, showErrorTooltip], () => {
  if (hasError.value && showErrorTooltip.value) {
    nextTick(() => {
      updateTooltipPosition()
    })
  }
})

// 监听 duplicateError 变化，立即显示错误状态
watch(
  () => props.duplicateError,
  (newError) => {
    if (newError) {
      showErrorTooltip.value = true
      nextTick(() => {
        updateTooltipPosition()
      })
    }
  },
  { immediate: true }
)

// 清除错误状态
const clearError = () => {
  errorMessage.value = ''
  showErrorTooltip.value = false
  // 通知父组件清除重复错误
  emit('clearDuplicateError')
}

const addTodo = async () => {
  const trimmedTodo = newTodo.value.trim()
  if (trimmedTodo.length === 0) {
    errorMessage.value = t('emptyTodoError')
    showErrorTooltip.value = true
    setTimeout(() => {
      errorMessage.value = ''
      showErrorTooltip.value = false
    }, 3000)
    return
  }
  if (trimmedTodo.length > props.maxLength) {
    errorMessage.value = t('maxLengthError', { maxLength: props.maxLength })
    showErrorTooltip.value = true
    setTimeout(() => {
      errorMessage.value = ''
      showErrorTooltip.value = false
    }, 3000)
    return
  }
  if (props.isLoading) {
    return
  }

  emit('add', trimmedTodo, [])
  newTodo.value = ''
  errorMessage.value = ''
  showErrorTooltip.value = false
}
</script>

<style scoped>
.add-todo-form {
  @apply font-sans flex mb-6 flex-wrap gap-3 p-4 rounded;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  align-items: center;
}

.input-wrapper {
  @apply flex gap-3 relative flex-grow;
  min-width: 250px;
  position: relative;
}

.input-wrapper.has-error .todo-input {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.08);
}

@media (max-width: 480px) {
  .input-wrapper {
    min-width: unset;
    width: 100%;
  }
}

.todo-input {
  @apply flex-grow text-base outline-none transition-all-300;
  padding: 0.875rem 1rem;
  background-color: var(--input-bg-color);
  border: 2px solid var(--input-border-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: 48px;
  box-sizing: border-box;
}

.todo-input:focus {
  border-color: var(--input-focus-color);
  box-shadow:
    0 0 8px rgba(121, 180, 166, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.todo-input.error-state {
  border-color: #f87171;
  background-color: rgba(248, 113, 113, 0.03);
}

.todo-input.error-state:focus {
  border-color: #f87171;
  box-shadow:
    0 0 8px rgba(248, 113, 113, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* 错误图标样式 */
.error-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: all 0.2s ease;
}

.error-icon:hover {
  color: #ef4444;
  transform: translateY(-50%) scale(1.1);
}

/* 浮动错误提示框样式 */
.error-tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 300px;
  animation: fadeInUp 0.2s ease-out;
}

.error-tooltip-content {
  background: #f87171;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  position: relative;
}

.error-tooltip-arrow {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #f87171;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-btn {
  @apply text-button-text border-none rounded cursor-pointer transition-all-300 font-semibold;
  padding: 0.875rem 1.25rem;
  font-size: 0.95rem;
  background-color: var(--button-bg-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  letter-spacing: 0.3px;
  height: 48px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .add-todo-form {
    @apply flex-col;
  }

  .input-wrapper {
    @apply mb-2 w-full;
    min-width: unset;
  }

  .add-btn {
    @apply w-full py-2 px-4;
  }
}
</style>
