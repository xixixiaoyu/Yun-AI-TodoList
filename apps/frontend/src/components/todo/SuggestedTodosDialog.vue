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
                <button class="delete-btn" :title="t('delete')" @click="handleDeleteTodo(index)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-4 h-4">
                    <path d="M18 6L6 18" stroke-width="2" stroke-linecap="round" />
                    <path d="M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </TransitionGroup>

            <!-- 添加新建议按钮 -->
            <div class="add-suggestion-container">
              <button class="add-suggestion-btn" @click="handleAddTodo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-4 h-4">
                  <path d="M12 5v14" stroke-width="2" stroke-linecap="round" />
                  <path d="M5 12h14" stroke-width="2" stroke-linecap="round" />
                </svg>
                {{ t('addNewSuggestion', '添加新建议') }}
              </button>
            </div>
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
  (e: 'deleteTodo', index: number): void
  (e: 'addTodo'): void
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

const handleDeleteTodo = (index: number) => {
  emit('deleteTodo', index)
}

const handleAddTodo = () => {
  emit('addTodo')
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

/* 弹窗容器 - 小巧设计 */
.suggested-todos-dialog {
  @apply relative bg-white rounded-xl shadow-xl;
  @apply max-w-lg w-full max-h-[75vh] overflow-hidden;
  @apply transform transition-all duration-300;
  background: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  box-shadow:
    var(--card-shadow),
    0 12px 24px rgba(var(--primary-color-rgb), 0.06),
    0 4px 8px rgba(var(--primary-color-rgb), 0.03);
}

/* 头部 - 紧凑设计 */
.dialog-header {
  @apply flex items-center gap-3 p-4 pb-3;
  border-bottom: 1px solid var(--input-border-color);
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.01) 100%
  );
}

.header-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-lg;
  @apply flex items-center justify-center;
  background: var(--primary-color);
  color: var(--button-text-color);
  box-shadow: 0 2px 6px rgba(var(--primary-color-rgb), 0.15);
}

.header-content {
  @apply flex-1;
}

.dialog-title {
  @apply text-lg font-medium mb-0.5;
  @apply leading-tight;
  color: var(--text-color);
}

.dialog-subtitle {
  @apply text-xs;
  color: var(--text-secondary-color);
}

.close-btn {
  @apply flex-shrink-0 w-7 h-7 rounded-md;
  @apply flex items-center justify-center transition-all duration-200;
  color: var(--text-secondary-color);
  background: transparent;
}

.close-btn:hover {
  background: var(--hover-bg-color);
  color: var(--text-color);
}

/* 建议列表 - 紧凑空间 */
.suggestions-list {
  @apply p-4 pt-3 max-h-64 overflow-y-auto;
}

.suggestions-container {
  @apply space-y-3;
}

.suggestion-item {
  @apply flex items-center gap-3;
}

.suggestion-number {
  @apply flex-shrink-0 w-6 h-6 rounded-full;
  @apply flex items-center justify-center text-xs font-medium;
  @apply transition-all duration-200;
  background: var(--primary-color);
  color: var(--button-text-color);
  box-shadow: 0 1px 4px rgba(var(--primary-color-rgb), 0.12);
}

.suggestion-input {
  @apply flex-1 px-3 py-2 rounded-lg text-sm;
  @apply transition-all duration-200 focus:outline-none;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  color: var(--text-color);
}

.suggestion-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
}

.suggestion-input:hover {
  border-color: var(--primary-color);
}

.suggestion-input::placeholder {
  color: var(--text-secondary-color);
}

.delete-btn {
  @apply flex-shrink-0 w-7 h-7 rounded-md;
  @apply flex items-center justify-center transition-all duration-200;
  color: var(--text-secondary-color);
  background: transparent;
}

.delete-btn:hover {
  background: var(--error-color);
  color: white;
  transform: scale(1.05);
}

.add-suggestion-container {
  @apply mt-3 pt-3;
  border-top: 1px solid var(--input-border-color);
}

.add-suggestion-btn {
  @apply w-full flex items-center justify-center gap-2 px-3 py-2;
  @apply rounded-lg text-sm font-medium transition-all duration-200;
  @apply border border-dashed hover:transform hover:scale-105;
  background: var(--input-bg-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.add-suggestion-btn:hover {
  background: rgba(var(--primary-color-rgb), 0.05);
  border-color: var(--button-hover-bg-color);
  color: var(--button-hover-bg-color);
}

/* 操作按钮 - 紧凑设计 */
.dialog-actions {
  @apply flex gap-3 p-4 pt-3;
  border-top: 1px solid var(--input-border-color);
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.005) 100%
  );
}

.action-btn {
  @apply flex items-center justify-center gap-1.5 px-4 py-2;
  @apply rounded-lg font-medium text-sm transition-all duration-200;
  @apply hover:transform hover:scale-105 active:scale-95;
}

.btn-icon {
  @apply w-4 h-4;
}

.cancel-btn {
  @apply flex-1 border transition-all duration-200;
  background: var(--card-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-secondary-color);
}

.cancel-btn:hover {
  background: var(--hover-bg-color);
  border-color: var(--primary-color);
  color: var(--text-color);
}

.confirm-btn {
  @apply flex-1 shadow-sm;
  background: var(--primary-color);
  color: var(--button-text-color);
  border: 1px solid var(--primary-color);
}

.confirm-btn:hover {
  background: var(--button-hover-bg-color);
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2);
  transform: translateY(-1px) scale(1.02);
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
    background: var(--card-bg-color);
    border-color: var(--input-border-color);
    box-shadow:
      var(--card-shadow),
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .dialog-header {
    border-bottom-color: var(--input-border-color);
    background: linear-gradient(
      135deg,
      var(--card-bg-color) 0%,
      rgba(var(--primary-color-rgb), 0.02) 100%
    );
  }

  .header-icon {
    background: var(--primary-color);
    color: var(--button-text-color);
  }

  .dialog-title {
    color: var(--text-color);
  }

  .dialog-subtitle {
    color: var(--text-secondary-color);
  }

  .close-btn {
    color: var(--text-secondary-color);
  }

  .close-btn:hover {
    background: var(--hover-bg-color);
    color: var(--text-color);
  }

  .suggestion-number {
    background: var(--primary-color);
    color: var(--button-text-color);
  }

  .suggestion-input {
    background: var(--input-bg-color);
    border-color: var(--input-border-color);
    color: var(--text-color);
  }

  .suggestion-input:focus {
    border-color: var(--primary-color);
  }

  .suggestion-input:hover {
    border-color: var(--primary-color);
  }

  .suggestion-input::placeholder {
    color: var(--text-secondary-color);
  }

  .dialog-actions {
    border-top-color: var(--input-border-color);
    background: linear-gradient(
      135deg,
      var(--card-bg-color) 0%,
      rgba(var(--primary-color-rgb), 0.01) 100%
    );
  }

  .cancel-btn {
    background: var(--card-bg-color);
    color: var(--text-secondary-color);
    border-color: var(--input-border-color);
  }

  .cancel-btn:hover {
    background: var(--hover-bg-color);
    color: var(--text-color);
    border-color: var(--primary-color);
  }

  .confirm-btn {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }

  .confirm-btn:hover {
    background: var(--button-hover-bg-color);
  }

  .suggestions-list::-webkit-scrollbar-thumb {
    background: rgba(var(--text-secondary-color-rgb), 0.3);
  }

  .suggestions-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--text-secondary-color-rgb), 0.5);
  }

  .delete-btn {
    color: var(--text-secondary-color);
  }

  .delete-btn:hover {
    background: var(--error-color);
    color: white;
  }

  .add-suggestion-container {
    border-top-color: var(--input-border-color);
  }

  .add-suggestion-btn {
    background: var(--input-bg-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .add-suggestion-btn:hover {
    background: rgba(var(--primary-color-rgb), 0.05);
    border-color: var(--button-hover-bg-color);
    color: var(--button-hover-bg-color);
  }
}
</style>
