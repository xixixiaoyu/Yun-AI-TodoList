<template>
  <!-- 背景遮罩 -->
  <Transition name="overlay" appear>
    <div v-if="show" class="dialog-overlay" @click="$emit('cancel')">
      <!-- 对话框主体 -->
      <Transition name="dialog" appear>
        <div v-if="show" class="suggested-todos-dialog" @click.stop>
          <!-- 对话框头部 -->
          <div class="dialog-header">
            <div class="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-6 h-6">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
              </svg>
            </div>
            <div class="header-content">
              <h3 class="dialog-title">{{ t('suggestedTodos') }}</h3>
              <p class="dialog-subtitle">{{ t('confirmOrModify') }}</p>
            </div>
            <button class="close-btn" @click="$emit('cancel')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 建议列表 -->
          <div class="suggestions-list">
            <TransitionGroup name="suggestion" tag="div" class="suggestions-container">
              <div
                v-for="(todo, index) in suggestedTodos"
                :key="`suggestion-${index}`"
                class="suggestion-item"
              >
                <div class="suggestion-number">{{ index + 1 }}</div>
                <div class="suggestion-input-wrapper">
                  <input
                    :value="todo"
                    class="suggestion-input"
                    :placeholder="t('addTodo')"
                    @input="handleTodoUpdate(index, $event)"
                  />
                  <div class="input-border" />
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- 对话框操作按钮 -->
          <div class="dialog-actions">
            <button class="action-btn cancel-btn" @click="$emit('cancel')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
              <span>{{ t('cancel') }}</span>
            </button>
            <button class="action-btn confirm-btn" @click="$emit('confirm')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{{ t('confirmAdd') }}</span>
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
}

interface Emits {
  (e: 'updateTodo', index: number, value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleTodoUpdate = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateTodo', index, target.value)
}

defineOptions({
  name: 'SuggestedTodosDialog'
})
</script>

<style scoped>
/* 背景遮罩 */
.dialog-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-1000;
  @apply flex items-center justify-center p-4;
}

/* 对话框主体 */
.suggested-todos-dialog {
  @apply relative w-full max-w-lg max-h-90vh;
  @apply bg-bg-card rounded-2xl shadow-custom border border-white/10;
  @apply backdrop-blur-20 overflow-hidden;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
}

/* 对话框头部 */
.dialog-header {
  @apply flex items-center gap-4 p-6 pb-4;
  @apply border-b border-white/5;
  background: linear-gradient(135deg, rgba(255, 126, 103, 0.05) 0%, transparent 100%);
}

.header-icon {
  @apply flex-shrink-0 w-12 h-12 rounded-xl;
  @apply bg-gradient-to-br from-orange-400/20 to-orange-500/20;
  @apply flex items-center justify-center text-orange-400;
  @apply border border-orange-400/20;
}

.header-content {
  @apply flex-1;
}

.dialog-title {
  @apply text-xl font-semibold text-text mb-1;
  @apply bg-gradient-to-r from-text to-text-secondary bg-clip-text;
}

.dialog-subtitle {
  @apply text-sm text-text-secondary opacity-80;
}

.close-btn {
  @apply flex-shrink-0 w-8 h-8 rounded-lg;
  @apply flex items-center justify-center text-text-secondary;
  @apply hover:bg-white/5 hover:text-text transition-all-300;
  @apply hover:transform-hover-up-1;
}

/* 建议列表 */
.suggestions-list {
  @apply p-6 pt-4 max-h-60 overflow-y-auto scrollbar-thin;
}

.suggestions-container {
  @apply space-y-4;
}

.suggestion-item {
  @apply flex items-center gap-4 group;
}

.suggestion-number {
  @apply flex-shrink-0 w-8 h-8 rounded-full;
  @apply bg-gradient-to-br from-primary/20 to-primary/10;
  @apply flex items-center justify-center text-sm font-medium text-primary;
  @apply border border-primary/20 transition-all-300;
  @apply group-hover:scale-110 group-hover:border-primary/30;
}

.suggestion-input-wrapper {
  @apply flex-1 relative;
}

.suggestion-input {
  @apply w-full px-4 py-3 rounded-xl text-sm;
  @apply bg-input-bg border-2 border-input-border text-text;
  @apply transition-all-300 focus:outline-none;
  @apply focus:border-primary focus:shadow-input-focus;
  @apply hover:border-input-border/60;
}

.input-border {
  @apply absolute inset-0 rounded-xl pointer-events-none;
  @apply border-2 border-transparent transition-all-300;
  background: linear-gradient(135deg, transparent, rgba(121, 180, 166, 0.1), transparent);
  opacity: 0;
}

.suggestion-input:focus + .input-border {
  @apply opacity-100;
}

/* 对话框操作按钮 */
.dialog-actions {
  @apply flex gap-3 p-6 pt-4;
  @apply border-t border-white/5;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
}

.action-btn {
  @apply flex-1 flex items-center justify-center gap-2.5 px-6 py-3;
  @apply rounded-xl font-medium text-sm transition-all-300;
  @apply hover:transform-hover-up-1 active:scale-95;
}

.btn-icon {
  @apply w-4 h-4 stroke-2;
}

.cancel-btn {
  @apply bg-gray-100/10 text-text-secondary border border-gray-200/20;
  @apply hover:bg-gray-100/20 hover:text-text hover:border-gray-200/30;
}

.confirm-btn {
  @apply bg-gradient-to-r from-primary to-primary-hover text-white;
  @apply border border-primary/20 shadow-button;
  @apply hover:shadow-hover hover:from-primary-hover hover:to-primary;
}

/* 过渡动画 */
.overlay-enter-active,
.overlay-leave-active {
  @apply transition-all-300;
}

.overlay-enter-from,
.overlay-leave-to {
  @apply opacity-0;
}

.dialog-enter-active,
.dialog-leave-active {
  @apply transition-all-300;
}

.dialog-enter-from,
.dialog-leave-to {
  @apply opacity-0 scale-95 translate-y-4;
}

.suggestion-enter-active,
.suggestion-leave-active {
  @apply transition-all-300;
}

.suggestion-enter-from,
.suggestion-leave-to {
  @apply opacity-0 translate-x-4;
}

.suggestion-move {
  @apply transition-transform-300;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-overlay {
    @apply p-3;
  }

  .suggested-todos-dialog {
    @apply max-w-full;
  }

  .dialog-header {
    @apply p-5 pb-3;
  }

  .dialog-title {
    @apply text-lg;
  }

  .dialog-subtitle {
    @apply text-xs;
  }

  .suggestions-list {
    @apply p-5 pt-3;
  }

  .suggestion-input {
    @apply py-2.5 text-xs;
  }

  .dialog-actions {
    @apply p-5 pt-3 flex-col gap-2.5;
  }

  .action-btn {
    @apply py-2.5 text-xs;
  }
}

@media (max-width: 480px) {
  .dialog-overlay {
    @apply p-2;
  }

  .suggested-todos-dialog {
    @apply rounded-xl;
  }

  .dialog-header {
    @apply p-4 pb-2;
  }

  .header-icon {
    @apply w-10 h-10;
  }

  .dialog-title {
    @apply text-base;
  }

  .suggestions-list {
    @apply p-4 pt-2;
  }

  .suggestion-number {
    @apply w-7 h-7 text-xs;
  }

  .suggestion-input {
    @apply px-3 py-2 text-xs;
  }

  .dialog-actions {
    @apply p-4 pt-2;
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
  @apply bg-white/10 rounded-full;
}

.suggestions-list::-webkit-scrollbar-thumb:hover {
  @apply bg-white/20;
}
</style>
