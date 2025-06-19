<template>
  <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">
          <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div class="dialog-title-group">
          <h3 class="dialog-title">{{ title }}</h3>
          <p v-if="message" class="dialog-message">{{ message }}</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button type="button" @click="$emit('close')" class="btn-secondary" :disabled="isLoading">
          {{ t('cancel') }}
        </button>
        <button type="button" @click="handleConfirm" class="btn-danger" :disabled="isLoading">
          <svg v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
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
          {{ confirmText || t('confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  title: string
  message?: string
  confirmText?: string
  isLoading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

withDefaults(defineProps<Props>(), {
  message: '',
  confirmText: '',
  isLoading: false,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}

// 处理遮罩点击
const handleOverlayClick = () => {
  emit('close')
}

defineOptions({
  name: 'ConfirmDialog',
})
</script>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.dialog-container {
  @apply bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden;
  animation: slideIn 0.3s ease-out;
}

.dialog-header {
  @apply flex items-start gap-4 p-6;
}

.dialog-icon {
  @apply flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center;
}

.dialog-title-group {
  @apply flex-1 min-w-0;
}

.dialog-title {
  @apply text-lg font-semibold text-text mb-1;
}

.dialog-message {
  @apply text-sm text-text-secondary leading-relaxed;
}

.dialog-actions {
  @apply flex gap-3 justify-end p-6 pt-0;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200;
  background-color: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-danger {
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center;
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.btn-danger:disabled {
  @apply opacity-50 cursor-not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
