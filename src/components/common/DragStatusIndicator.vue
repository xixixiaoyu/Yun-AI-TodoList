<template>
  <Transition name="fade">
    <div v-if="show" class="drag-status-indicator" :class="statusClass">
      <div class="indicator-content">
        <div class="indicator-icon">
          <svg
            v-if="status === 'dragging'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12h18m-9-9v18" />
          </svg>
          <svg
            v-else-if="status === 'processing'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <svg
            v-else-if="status === 'success'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
          <svg
            v-else-if="status === 'error'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div class="indicator-text">
          {{ statusText }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  status: 'dragging' | 'processing' | 'success' | 'error' | 'idle'
  show?: boolean
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  message: '',
})

const { t } = useI18n()

const statusClass = computed(() => {
  return `status-${props.status}`
})

const statusText = computed(() => {
  if (props.message) {
    return props.message
  }

  switch (props.status) {
    case 'dragging':
      return t('dragStatusDragging', 'Dragging item...')
    case 'processing':
      return t('dragStatusProcessing', 'Updating order...')
    case 'success':
      return t('dragStatusSuccess', 'Order updated!')
    case 'error':
      return t('dragStatusError', 'Failed to update order')
    default:
      return ''
  }
})
</script>

<style scoped>
.drag-status-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--card-bg-color, white);
  border: 1px solid var(--input-border-color, #ddd);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  backdrop-filter: blur(10px);
  min-width: 200px;
  text-align: center;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.indicator-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.indicator-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

/* 状态样式 */
.status-dragging {
  border-color: var(--button-bg-color, #007bff);
  background: linear-gradient(
    135deg,
    var(--button-bg-color, #007bff) 0%,
    rgba(0, 123, 255, 0.1) 100%
  );
}

.status-dragging .indicator-icon {
  color: var(--button-bg-color, #007bff);
}

.status-processing {
  border-color: #ffc107;
  background: linear-gradient(135deg, #ffc107 0%, rgba(255, 193, 7, 0.1) 100%);
}

.status-processing .indicator-icon {
  color: #ffc107;
}

.status-success {
  border-color: #28a745;
  background: linear-gradient(135deg, #28a745 0%, rgba(40, 167, 69, 0.1) 100%);
}

.status-success .indicator-icon {
  color: #28a745;
}

.status-error {
  border-color: #dc3545;
  background: linear-gradient(135deg, #dc3545 0%, rgba(220, 53, 69, 0.1) 100%);
}

.status-error .indicator-icon {
  color: #dc3545;
}

/* 动画 */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .drag-status-indicator {
    background: var(--card-bg-color, #2d3748);
    border-color: var(--input-border-color, #4a5568);
  }

  .indicator-text {
    color: var(--text-color, #e2e8f0);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .drag-status-indicator {
    min-width: 180px;
    padding: 0.75rem 1.25rem;
  }

  .indicator-content {
    gap: 0.5rem;
  }

  .indicator-text {
    font-size: 0.8rem;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
