<template>
  <div
    class="loading-indicator flex items-center gap-3 p-4 rounded-xl bg-ai-message-bg border border-ai-message-border shadow-md"
  >
    <div class="loading-spinner">
      <svg
        class="spinner"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          class="spinner-path"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        ></circle>
      </svg>
    </div>
    <span class="text-sm text-primary-color font-medium">{{ t('aiAssistantLoading') }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineOptions({
  name: 'LoadingIndicator',
})
</script>

<style scoped>
.loading-indicator {
  background: var(--ai-message-bg);
  border-color: var(--ai-message-border);
  color: var(--primary-color);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: rotate 1s linear infinite;
  color: var(--primary-color);
}

.spinner-path {
  stroke-dasharray: 60;
  stroke-dashoffset: 30;
  transform-origin: center;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 60;
  }
  50% {
    stroke-dashoffset: 15;
    transform: rotate(180deg);
  }
  100% {
    stroke-dashoffset: 60;
    transform: rotate(360deg);
  }
}
</style>
