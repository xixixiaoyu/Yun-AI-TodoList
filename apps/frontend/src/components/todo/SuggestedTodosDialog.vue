<template>
  <Transition name="overlay" appear>
    <div v-if="show" class="dialog-overlay" @click="$emit('cancel')">
      <Transition name="dialog" appear>
        <div v-if="show" class="suggested-todos-dialog" @click.stop>
          <!-- 简化的头部 -->
          <div class="dialog-header">
            <div class="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5">
                <path
                  d="M9 12l2 2 4-4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="12" r="9" stroke-width="1.5" />
              </svg>
            </div>
            <div class="header-content">
              <h3 class="dialog-title">{{ t('suggestedTodos') }}</h3>
              <p class="dialog-subtitle">{{ getSubtitleText() }}</p>
            </div>
            <button class="close-btn" @click="$emit('cancel')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-4 h-4">
                <path d="M18 6L6 18" stroke-width="2" stroke-linecap="round" />
                <path d="M6 6l12 12" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- 简化的建议列表 -->
          <div class="suggestions-list">
            <TransitionGroup name="suggestion" tag="div" class="suggestions-container">
              <div
                v-for="(todo, index) in suggestedTodos"
                :key="`suggestion-${index}`"
                class="suggestion-item"
              >
                <div class="suggestion-number">{{ index + 1 }}</div>
                <input
                  :value="todo"
                  class="suggestion-input"
                  :placeholder="t('addTodo')"
                  @input="handleTodoUpdate(index, $event)"
                />
              </div>
            </TransitionGroup>
          </div>

          <!-- 简化的操作按钮 -->
          <div class="dialog-actions">
            <button class="action-btn cancel-btn" @click="$emit('cancel')">
              {{ t('cancel') }}
            </button>
            <button class="action-btn confirm-btn" @click="$emit('confirm')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ t('confirmAdd') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  suggestedTodos: string[]
  hasCompletedHistory?: boolean
}

interface Emits {
  (e: 'updateTodo', index: number, value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleTodoUpdate = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateTodo', index, target.value)
}

const getSubtitleText = () => {
  if (props.hasCompletedHistory) {
    return t('confirmOrModifyWithHistory')
  }
  return t('confirmOrModify')
}

defineOptions({
  name: 'SuggestedTodosDialog',
})
</script>

<style scoped>
/* 遮罩层 - 更轻盈 */
.dialog-overlay {
  @apply fixed inset-0 bg-black/30 backdrop-blur-sm z-1000;
  @apply flex items-center justify-center p-6;
}

/* 主对话框 - 清爽简洁 */
.suggested-todos-dialog {
  @apply relative w-full max-w-md max-h-85vh;
  @apply bg-white/95 rounded-2xl shadow-xl border border-gray-200/50;
  @apply backdrop-blur-20 overflow-hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 头部 - 简化设计 */
.dialog-header {
  @apply flex items-center gap-3 p-5 pb-4;
  @apply border-b border-gray-100/80;
}

.header-icon {
  @apply flex-shrink-0 w-9 h-9 rounded-xl;
  @apply bg-gradient-to-br from-blue-50 to-blue-100;
  @apply flex items-center justify-center text-blue-600;
  @apply border border-blue-200/50;
}

.header-content {
  @apply flex-1;
}

.dialog-title {
  @apply text-lg font-semibold text-gray-800 mb-0.5;
  @apply leading-tight;
}

.dialog-subtitle {
  @apply text-sm text-gray-500;
}

.close-btn {
  @apply flex-shrink-0 w-7 h-7 rounded-lg;
  @apply flex items-center justify-center text-gray-400;
  @apply hover:bg-gray-100 hover:text-gray-600 transition-all duration-200;
}

/* 建议列表 - 更清爽 */
.suggestions-list {
  @apply p-5 pt-3 max-h-60 overflow-y-auto;
}

.suggestions-container {
  @apply space-y-3;
}

.suggestion-item {
  @apply flex items-center gap-3;
}

.suggestion-number {
  @apply flex-shrink-0 w-7 h-7 rounded-full;
  @apply bg-gradient-to-br from-gray-100 to-gray-200;
  @apply flex items-center justify-center text-sm font-medium text-gray-600;
  @apply border border-gray-200/80 transition-all duration-200;
}

.suggestion-input {
  @apply flex-1 px-3 py-2.5 rounded-xl text-sm;
  @apply bg-gray-50/80 border border-gray-200/60 text-gray-700;
  @apply transition-all duration-200 focus:outline-none;
  @apply focus:border-blue-300 focus:bg-white focus:shadow-sm;
  @apply hover:border-gray-300/80 hover:bg-gray-50;
  @apply placeholder:text-gray-400;
}

/* 操作按钮 - 简洁设计 */
.dialog-actions {
  @apply flex gap-3 p-5 pt-4;
  @apply border-t border-gray-100/80;
  @apply bg-gray-50/30;
}

.action-btn {
  @apply flex items-center justify-center gap-2 px-4 py-2.5;
  @apply rounded-xl font-medium text-sm transition-all duration-200;
  @apply hover:transform hover:scale-105 active:scale-95;
}

.btn-icon {
  @apply w-4 h-4;
}

.cancel-btn {
  @apply flex-1 bg-white text-gray-600 border border-gray-200;
  @apply hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300;
}

.confirm-btn {
  @apply flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white;
  @apply border border-blue-500/20 shadow-sm;
  @apply hover:from-blue-600 hover:to-blue-700 hover:shadow-md;
}

/* 动画效果 */
.overlay-enter-active,
.overlay-leave-active {
  @apply transition-all duration-300;
}

.overlay-enter-from,
.overlay-leave-to {
  @apply opacity-0;
}

.dialog-enter-active,
.dialog-leave-active {
  @apply transition-all duration-300;
}

.dialog-enter-from,
.dialog-leave-to {
  @apply opacity-0 scale-95 translate-y-2;
}

.suggestion-enter-active,
.suggestion-leave-active {
  @apply transition-all duration-200;
}

.suggestion-enter-from,
.suggestion-leave-to {
  @apply opacity-0 translate-x-2;
}

.suggestion-move {
  @apply transition-transform duration-200;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-overlay {
    @apply p-4;
  }

  .suggested-todos-dialog {
    @apply max-w-full;
  }

  .dialog-header {
    @apply p-4 pb-3;
  }

  .dialog-title {
    @apply text-base;
  }

  .dialog-subtitle {
    @apply text-xs;
  }

  .suggestions-list {
    @apply p-4 pt-3;
  }

  .suggestion-input {
    @apply py-2 text-xs;
  }

  .dialog-actions {
    @apply p-4 pt-3 flex-col gap-2;
  }

  .action-btn {
    @apply py-2.5 text-xs;
  }
}

@media (max-width: 480px) {
  .dialog-overlay {
    @apply p-3;
  }

  .suggested-todos-dialog {
    @apply rounded-xl;
  }

  .dialog-header {
    @apply p-3 pb-2;
  }

  .header-icon {
    @apply w-8 h-8;
  }

  .dialog-title {
    @apply text-sm;
  }

  .suggestions-list {
    @apply p-3 pt-2;
  }

  .suggestion-number {
    @apply w-6 h-6 text-xs;
  }

  .suggestion-input {
    @apply px-2.5 py-2 text-xs;
  }

  .dialog-actions {
    @apply p-3 pt-2;
  }

  .action-btn {
    @apply py-2 text-xs;
  }

  .btn-icon {
    @apply w-3.5 h-3.5;
  }
}

/* 滚动条样式 */
.suggestions-list::-webkit-scrollbar {
  @apply w-1;
}

.suggestions-list::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.suggestions-list::-webkit-scrollbar-thumb {
  @apply bg-gray-300/50 rounded-full;
}

.suggestions-list::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400/60;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .suggested-todos-dialog {
    @apply bg-gray-800/95 border-gray-700/50;
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(31, 41, 55, 0.95) 100%);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .dialog-header {
    @apply border-gray-700/80;
  }

  .header-icon {
    @apply bg-gradient-to-br from-blue-900/50 to-blue-800/50;
    @apply text-blue-400 border-blue-700/50;
  }

  .dialog-title {
    @apply text-gray-100;
  }

  .dialog-subtitle {
    @apply text-gray-400;
  }

  .close-btn {
    @apply text-gray-400 hover:bg-gray-700 hover:text-gray-200;
  }

  .suggestion-number {
    @apply bg-gradient-to-br from-gray-700 to-gray-800;
    @apply text-gray-300 border-gray-600/80;
  }

  .suggestion-input {
    @apply bg-gray-700/50 border-gray-600/60 text-gray-200;
    @apply focus:border-blue-500 focus:bg-gray-700;
    @apply hover:border-gray-500/80 hover:bg-gray-700/60;
    @apply placeholder:text-gray-500;
  }

  .dialog-actions {
    @apply border-gray-700/80 bg-gray-800/30;
  }

  .cancel-btn {
    @apply bg-gray-700 text-gray-200 border-gray-600;
    @apply hover:bg-gray-600 hover:text-gray-100 hover:border-gray-500;
  }

  .confirm-btn {
    @apply from-blue-600 to-blue-700 border-blue-600/20;
    @apply hover:from-blue-700 hover:to-blue-800;
  }

  .suggestions-list::-webkit-scrollbar-thumb {
    @apply bg-gray-600/50;
  }

  .suggestions-list::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500/60;
  }
}
</style>
