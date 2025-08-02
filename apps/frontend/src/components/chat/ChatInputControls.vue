<template>
  <div class="flex flex-col gap-2 md:gap-2 mobile-controls">
    <button
      v-if="!isGenerating"
      class="send-btn w-10 h-10 bg-button-bg text-white border-none rounded-xl cursor-pointer flex items-center justify-center hover:bg-button-hover hover:shadow-[0_4px_12px_rgba(121,180,166,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
      :title="t('send')"
      @click="$emit('send')"
    >
      <SendIcon class="w-5 h-5" />
    </button>
    <button
      v-else
      class="stop-btn w-10 h-10 bg-red-300 text-white border-none rounded-xl cursor-pointer flex items-center justify-center hover:bg-red-400 hover:shadow-[0_4px_12px_rgba(252,165,165,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
      :title="t('stop')"
      @click="$emit('stop')"
    >
      <StopIcon class="w-5 h-5" />
    </button>
    <button
      class="voice-btn relative w-10 h-10 bg-input-bg text-text border border-input-border rounded-xl cursor-pointer flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-button-hover hover:text-white hover:border-button-bg"
      :class="{
        'bg-button-bg text-white border-button-bg animate-pulse shadow-[0_4px_12px_rgba(121,180,166,0.3)]':
          isListening,
        'bg-red-300 text-white border-red-300 shadow-[0_4px_12px_rgba(252,165,165,0.3)]':
          recognitionStatus === 'error',
        'bg-button-hover text-white border-button-hover': recognitionStatus === 'processing',
      }"
      :disabled="!isRecognitionSupported"
      :title="lastError || t(isListening ? 'stopListening' : 'listening')"
      @click="isListening ? $emit('stopListening') : $emit('startListening')"
    >
      <MicrophoneIcon class="w-5 h-5" />
      <span
        v-if="lastError"
        class="error-tooltip absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-red-400 bg-bg px-3 py-1.5 rounded-lg shadow-lg border border-red-100"
      >
        {{ lastError }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MicrophoneIcon from '../common/icons/MicrophoneIcon.vue'
import SendIcon from '../common/icons/SendIcon.vue'
import StopIcon from '../common/icons/StopIcon.vue'

interface Props {
  isGenerating: boolean
  isListening: boolean
  recognitionStatus: string
  lastError: string | null
  isRecognitionSupported: boolean
}

interface Emits {
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'startListening'): void
  (e: 'stopListening'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ChatInputControls',
})
</script>

<style scoped>
/* 移动端优化样式 */
@media (max-width: 639px) {
  .mobile-controls {
    gap: 0;
  }

  .send-btn,
  .stop-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
    border-radius: 0.75rem !important;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(var(--primary-color-rgb), 0.15);
    flex-shrink: 0;
  }

  .send-btn svg,
  .stop-btn svg {
    width: 1rem !important;
    height: 1rem !important;
  }

  /* 移动端隐藏语音输入按钮 */
  .voice-btn {
    display: none !important;
  }

  .send-btn {
    background: linear-gradient(
      135deg,
      var(--button-bg) 0%,
      rgba(121, 180, 166, 0.9) 100%
    ) !important;
    box-shadow: 0 2px 12px rgba(121, 180, 166, 0.2);
  }

  .send-btn:hover {
    background: linear-gradient(135deg, var(--button-hover) 0%, var(--button-bg) 100%) !important;
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(121, 180, 166, 0.3);
  }

  .stop-btn {
    background: linear-gradient(135deg, #ef4444 0%, rgba(239, 68, 68, 0.9) 100%) !important;
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.2);
  }

  .stop-btn:hover {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
  }

  .voice-btn {
    background: rgba(var(--input-bg-color-rgb), 0.9) !important;
    backdrop-filter: blur(8px);
  }

  .voice-btn:hover:not(:disabled) {
    background: linear-gradient(
      135deg,
      var(--button-hover) 0%,
      rgba(121, 180, 166, 0.9) 100%
    ) !important;
    transform: scale(1.05);
    border-color: var(--button-bg) !important;
  }

  .voice-btn.bg-button-bg {
    background: linear-gradient(
      135deg,
      var(--button-bg) 0%,
      rgba(121, 180, 166, 0.9) 100%
    ) !important;
  }

  .voice-btn.bg-red-300 {
    background: linear-gradient(135deg, #ef4444 0%, rgba(239, 68, 68, 0.9) 100%) !important;
  }

  .voice-btn.bg-button-hover {
    background: linear-gradient(
      135deg,
      var(--button-hover) 0%,
      rgba(121, 180, 166, 0.9) 100%
    ) !important;
  }

  .send-btn svg,
  .stop-btn svg,
  .voice-btn svg {
    width: 1.25rem !important;
    height: 1.25rem !important;
  }

  /* 隐藏移动端的错误提示 */
  .error-tooltip {
    display: none;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .send-btn,
  .stop-btn,
  .voice-btn {
    min-width: 2.5rem;
    min-height: 2.5rem;
    border-radius: 0.75rem;
  }

  .mobile-controls {
    gap: 1rem;
  }

  /* 增强触摸反馈 */
  .send-btn:active,
  .stop-btn:active,
  .voice-btn:active {
    transform: scale(0.9);
    transition: transform 0.1s ease;
  }

  .send-btn svg,
  .stop-btn svg,
  .voice-btn svg {
    width: 1.25rem !important;
    height: 1.25rem !important;
  }
}

/* 平板端适配 */
@media (min-width: 640px) and (max-width: 1024px) {
  .send-btn,
  .stop-btn,
  .voice-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
    border-radius: 0.75rem !important;
  }

  .send-btn svg,
  .stop-btn svg,
  .voice-btn svg {
    width: 1.25rem !important;
    height: 1.25rem !important;
  }
}

/* 移动端优化 */
@media (max-width: 639px) {
  .mobile-controls {
    gap: 0.5rem;
  }

  .send-btn,
  .stop-btn,
  .voice-btn {
    width: 2.25rem !important;
    height: 2.25rem !important;
    border-radius: 0.625rem !important;
    padding: 0.375rem !important;
  }

  .send-btn svg,
  .stop-btn svg,
  .voice-btn svg {
    width: 1.125rem !important;
    height: 1.125rem !important;
  }
}
</style>
