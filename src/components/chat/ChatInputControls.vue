<template>
  <div class="input-controls">
    <button v-if="!isGenerating" @click="$emit('send')">
      <SendIcon />
      {{ t('send') }}
    </button>
    <button v-else class="stop-btn" @click="$emit('stop')">
      <StopIcon />
      {{ t('stop') }}
    </button>
    <button
      class="voice-btn"
      :class="{
        'is-listening': isListening,
        'is-error': recognitionStatus === 'error',
        'is-processing': recognitionStatus === 'processing'
      }"
      :disabled="!isRecognitionSupported"
      :title="lastError || t(isListening ? 'stopListening' : 'startListening')"
      @click="isListening ? $emit('stopListening') : $emit('startListening')"
    >
      <MicrophoneIcon />
      <span>{{ isListening ? t('stopListening') : t('startListening') }}</span>
      <span v-if="lastError" class="error-message">{{ lastError }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SendIcon from '../common/icons/SendIcon.vue'
import StopIcon from '../common/icons/StopIcon.vue'
import MicrophoneIcon from '../common/icons/MicrophoneIcon.vue'

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
  name: 'ChatInputControls'
})
</script>

<style scoped>
.input-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-controls button {
  padding: 0 12px;
  font-size: 13px;
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 36px;
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.input-controls button:hover:not(:disabled) {
  opacity: 0.9;
}

.input-controls button:disabled {
  background-color: var(--input-border-color);
  cursor: not-allowed;
  opacity: 0.7;
}

.input-controls button :deep(svg) {
  width: 18px;
  height: 18px;
}

.stop-btn {
  background-color: var(--button-hover-bg-color) !important;
}

.voice-btn {
  position: relative;
  padding: 0 16px;
  font-size: 14px;
  background-color: var(--input-bg-color) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--input-border-color) !important;
  border-radius: 10px;
  cursor: pointer;
  height: 40px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color) !important;
  color: var(--card-bg-color) !important;
}

.voice-btn.is-listening {
  background-color: var(--button-bg-color) !important;
  color: var(--card-bg-color) !important;
  animation: pulse 1.5s infinite;
}

.voice-btn.is-error {
  background-color: #ff4d4f !important;
  color: white !important;
  border-color: #ff4d4f !important;
}

.voice-btn.is-processing {
  background-color: var(--button-hover-bg-color) !important;
  color: var(--card-bg-color) !important;
}

.error-message {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  color: #ff4d4f;
  background-color: var(--bg-color);
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .input-controls {
    gap: 6px;
  }

  .input-controls button {
    padding: 0 12px;
    height: 36px;
    min-width: 70px;
    font-size: 13px;
  }

  .voice-btn {
    padding: 0 14px;
    font-size: 13px;
    height: 36px;
    min-width: 70px;
    border-radius: 8px;
  }
}
</style>
