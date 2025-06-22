<template>
  <div v-if="show" class="charts-dialog-overlay" @click="$emit('close')">
    <div class="charts-dialog-content" @click.stop>
      <button class="charts-dialog-close" :aria-label="t('close')" @click="$emit('close')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="md:w-4 md:h-4 sm:w-3.5 sm:h-3.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2 class="charts-dialog-title">
        {{ t('productivityInsights') }}
      </h2>

      <TodoCompletionChart />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TodoCompletionChart from './TodoCompletionChart.vue'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ChartsDialog',
})
</script>

<style scoped>
.charts-dialog-overlay {
  @apply fixed inset-0 z-1000 flex items-center justify-center p-4;
  background: rgba(71, 85, 105, 0.4);
  backdrop-filter: blur(12px);
  animation: overlayIn 0.3s ease-out;
}

[data-theme='dark'] .charts-dialog-overlay {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
}

.charts-dialog-content {
  @apply relative w-full max-w-[1200px] max-h-[98vh] overflow-y-auto;
  @apply rounded-3xl p-8;
  @apply md:p-6 sm:p-4 sm:rounded-2xl sm:max-h-full;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: contentIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-theme='dark'] .charts-dialog-content {
  background: linear-gradient(135deg, rgba(37, 43, 50, 0.95) 0%, rgba(47, 53, 61, 0.9) 100%);
  border-color: rgba(121, 180, 166, 0.2);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(121, 180, 166, 0.1);
}

.charts-dialog-close {
  @apply absolute top-4 right-4 w-9 h-9 p-2 rounded-xl;
  @apply flex items-center justify-center cursor-pointer;
  @apply transition-all duration-300 ease-out;
  @apply md:top-3 md:right-3 md:w-8 md:h-8 md:p-1.5;
  @apply sm:top-2 sm:right-2 sm:w-7 sm:h-7 sm:p-1;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%);
  color: var(--text-secondary-color, #64748b);
  border: 1px solid rgba(16, 185, 129, 0.15);
  backdrop-filter: blur(8px);
}

.charts-dialog-close:hover {
  @apply scale-105;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--text-color, #1e293b);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

[data-theme='dark'] .charts-dialog-close {
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.1) 0%, rgba(104, 162, 149, 0.15) 100%);
  color: var(--text-secondary-color, #a0aec0);
  border-color: rgba(121, 180, 166, 0.2);
}

[data-theme='dark'] .charts-dialog-close:hover {
  background: linear-gradient(135deg, rgba(121, 180, 166, 0.2) 0%, rgba(104, 162, 149, 0.25) 100%);
  border-color: rgba(121, 180, 166, 0.35);
  color: var(--text-color, #f7fafc);
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.25);
}

.charts-dialog-title {
  @apply m-0 mb-8 text-2xl font-bold text-center pr-12;
  @apply md:text-xl md:mb-6 md:pr-10;
  @apply sm:text-lg sm:mb-4 sm:pr-8;
  color: var(--text-color, #1e293b);
  background: linear-gradient(135deg, var(--primary-color, #79b4a6), #68a295);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .charts-dialog-title {
  background: linear-gradient(135deg, var(--primary-color, #79b4a6), #8cc8b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes overlayIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

@keyframes contentIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .charts-dialog-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
}

@media (max-width: 640px) {
  .charts-dialog-overlay {
    padding: 0.5rem;
  }

  .charts-dialog-content {
    margin: 0;
    border-radius: 1rem;
    max-height: 100vh;
  }
}
</style>
