<template>
  <div
    class="editable-todo-item"
    :class="{
      'is-editing': isEditing,
      'is-disabled': isBatchAnalyzing,
    }"
  >
    <!-- 编辑模式 -->
    <div v-if="isEditing" class="edit-mode" @click.stop>
      <div class="edit-content">
        <!-- 多行文本编辑器 -->
        <textarea
          ref="textareaRef"
          v-model="editText"
          class="edit-textarea"
          :placeholder="t('editTodoPlaceholder', '编辑待办事项...')"
          :maxlength="maxLength"
          @keydown="handleKeydown"
          @blur="handleBlur"
        />

        <!-- 字符计数 -->
        <div class="char-count">{{ editText.length }}/{{ maxLength }}</div>
      </div>

      <!-- 编辑操作按钮 -->
      <div class="edit-actions">
        <button class="save-btn" :disabled="!canSave" @click="handleSave">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
          {{ t('save', '保存') }}
        </button>

        <button class="cancel-btn" @click="handleCancel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {{ t('cancel', '取消') }}
        </button>
      </div>
    </div>

    <!-- 显示模式 -->
    <div v-else class="display-mode" @click.stop>
      <div class="todo-text-display" :title="todo.text" @dblclick.stop="startEdit">
        {{ todo.text }}
      </div>

      <!-- 编辑按钮 -->
      <button class="edit-btn" :title="t('editTodo', '编辑待办事项')" @click.stop="startEdit">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { Todo } from '@/types/todo'

interface Props {
  todo: Todo
  maxLength?: number
}

interface Emits {
  (e: 'update', text: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 500,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const { showError } = useErrorHandler()
const { isBatchAnalyzing } = useAIAnalysis()

// 编辑状态
const isEditing = ref(false)
const editText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 计算属性
const canSave = computed(() => {
  const trimmed = editText.value.trim()
  return trimmed.length > 0 && trimmed !== props.todo.text.trim()
})

// 开始编辑
const startEdit = () => {
  if (isBatchAnalyzing.value) {
    return
  }

  isEditing.value = true
  editText.value = props.todo.text

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.select()
      // 自动调整高度
      adjustTextareaHeight()
    }
  })
}

// 调整文本域高度
const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSave()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  } else if (event.key === 'Tab') {
    event.preventDefault()
    // 在光标位置插入制表符
    const start = textareaRef.value?.selectionStart || 0
    const end = textareaRef.value?.selectionEnd || 0
    editText.value = editText.value.substring(0, start) + '  ' + editText.value.substring(end)
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.selectionStart = textareaRef.value.selectionEnd = start + 2
      }
    })
  }

  // 实时调整高度
  nextTick(() => {
    adjustTextareaHeight()
  })
}

// 处理失焦事件
const handleBlur = () => {
  // 延迟处理，避免与按钮点击冲突
  setTimeout(() => {
    if (isEditing.value && !document.activeElement?.closest('.edit-actions')) {
      handleCancel()
    }
  }, 150)
}

// 保存编辑
const handleSave = () => {
  if (!canSave.value) {
    return
  }

  const trimmed = editText.value.trim()
  if (trimmed.length === 0) {
    showError(t('todoTextRequired', '待办事项内容不能为空'))
    return
  }

  if (trimmed.length > props.maxLength) {
    showError(t('todoTextTooLong', `待办事项内容不能超过 ${props.maxLength} 个字符`))
    return
  }

  emit('update', trimmed)
  isEditing.value = false
}

// 取消编辑
const handleCancel = () => {
  isEditing.value = false
  editText.value = props.todo.text
  emit('cancel')
}

// 监听编辑文本变化，实时调整高度
watch(editText, () => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

// 暴露方法给父组件
defineExpose({
  startEdit,
  isEditing: readonly(isEditing),
})
</script>

<style scoped>
.editable-todo-item {
  @apply w-full transition-all duration-300;
}

.editable-todo-item.is-disabled {
  @apply opacity-60 cursor-not-allowed;
  pointer-events: none;
}

/* 编辑模式样式 */
.edit-mode {
  @apply w-full;
}

.edit-content {
  @apply relative w-full;
}

.edit-textarea {
  @apply w-full min-h-12 max-h-32 px-3 py-2 text-sm resize-none;
  @apply bg-input-bg border border-input-border rounded-lg;
  @apply focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-primary focus:ring-opacity-20;
  @apply transition-all duration-200;
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
  line-height: 1.5;
}

.edit-textarea:focus {
  @apply shadow-sm;
}

.char-count {
  @apply absolute bottom-2 right-2 text-xs text-text-secondary opacity-60;
  pointer-events: none;
}

.edit-actions {
  @apply flex items-center gap-2 mt-2;
}

.save-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium;
  @apply bg-primary text-white rounded-md;
  @apply hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50;
  @apply transition-all duration-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary;
}

.save-btn:not(:disabled):hover {
  @apply transform scale-105 shadow-sm;
}

.cancel-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium;
  @apply bg-gray-100 text-gray-700 rounded-md;
  @apply hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50;
  @apply transition-all duration-200;
}

.cancel-btn:hover {
  @apply transform scale-105 shadow-sm;
}

/* 显示模式样式 */
.display-mode {
  @apply flex items-center gap-2 w-full;
}

.todo-text-display {
  @apply flex-1 cursor-pointer text-sm leading-relaxed;
  @apply transition-all duration-200;
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
  word-break: break-word;
  white-space: pre-wrap;
  padding: 0;
}

.edit-btn {
  @apply flex items-center justify-center w-7 h-7 opacity-0;
  @apply bg-transparent text-gray-500 rounded-md;
  @apply hover:bg-gray-100 hover:bg-opacity-30 hover:text-primary;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30;
  @apply transition-all duration-200;
}

.display-mode:hover .edit-btn {
  @apply opacity-100;
}

.edit-btn:hover {
  @apply transform scale-110;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-textarea {
    @apply text-base;
  }

  .edit-actions {
    @apply flex-col gap-2;
  }

  .save-btn,
  .cancel-btn {
    @apply w-full justify-center py-2;
  }

  .edit-btn {
    @apply opacity-70 w-8 h-8;
  }
}

@media (max-width: 480px) {
  .todo-text-display {
    @apply text-sm;
  }

  .edit-textarea {
    @apply text-sm px-2 py-1.5;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .cancel-btn {
    @apply bg-gray-700 text-gray-300 hover:bg-gray-600;
  }

  .edit-btn:hover {
    @apply bg-gray-800 bg-opacity-30;
  }
}
</style>
