<template>
  <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">
          <svg class="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <button type="button" class="btn-secondary" :disabled="isLoading" @click="$emit('close')">
          {{ t('cancel') }}
        </button>
        <button type="button" class="btn-danger" :disabled="isLoading" @click="handleConfirm">
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
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-out;
}

.dialog-container {
  @apply rounded-3xl shadow-2xl max-w-md w-full overflow-hidden;
  background: linear-gradient(145deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-header {
  @apply flex items-start gap-4 p-6;
  background: linear-gradient(135deg, rgba(254, 250, 250, 0.8) 0%, rgba(253, 246, 246, 0.6) 100%);
}

.dialog-icon {
  @apply flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, #fef7f7 0%, #fed7d7 50%, #feb2b2 100%);
  border: 2px solid rgba(251, 113, 133, 0.15);
  box-shadow: 0 4px 12px rgba(251, 113, 133, 0.12);
}

.dialog-icon svg {
  @apply w-6 h-6;
  color: #f87171;
  filter: drop-shadow(0 1px 2px rgba(248, 113, 113, 0.15));
}

.dialog-title-group {
  @apply flex-1 min-w-0;
}

.dialog-title {
  @apply text-lg font-semibold mb-1;
  color: #1f2937;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dialog-message {
  @apply text-sm leading-relaxed;
  color: #6b7280;
}

.dialog-actions {
  @apply flex gap-3 justify-end p-6 pt-4;
  background: linear-gradient(180deg, transparent 0%, rgba(249, 250, 251, 0.5) 100%);
}

.btn-secondary {
  @apply px-5 py-2.5 text-sm font-medium rounded-xl border transition-all duration-300;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-color: #e5e7eb;
  color: #374151;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-color: #d1d5db;
  color: #1f2937;
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-danger {
  @apply px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 flex items-center;
  background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%);
  color: white;
  border: 1px solid rgba(220, 38, 38, 0.25);
  box-shadow:
    0 2px 8px rgba(248, 113, 113, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
  border-color: rgba(185, 28, 28, 0.3);
  transform: translateY(-1px);
  box-shadow:
    0 4px 16px rgba(248, 113, 113, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
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
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
