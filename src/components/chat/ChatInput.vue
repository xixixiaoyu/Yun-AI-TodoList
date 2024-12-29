<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useVoiceInput } from '../../composables/useVoiceInput'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  isGenerating: boolean
  isOptimizing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'optimize'): void
}>()

const { t } = useI18n()
const inputRef = ref<HTMLTextAreaElement | null>(null)

// 处理语音输入
const handleTranscript = (text: string) => {
  const currentText = props.modelValue.trim()
  emit('update:modelValue', currentText + (currentText ? ' ' : '') + text)
}

const {
  isListening,
  recognitionStatus,
  lastError,
  isRecognitionSupported,
  startListening,
  stopListening,
} = useVoiceInput(handleTranscript)

// 自动调整输入框高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    const textarea = inputRef.value
    const cursorPosition = textarea.selectionStart

    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 200)
    textarea.style.height = `${newHeight}px`

    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const dummyElement = document.createElement('div')
    dummyElement.style.cssText = window.getComputedStyle(textarea).cssText
    dummyElement.style.height = 'auto'
    dummyElement.style.position = 'absolute'
    dummyElement.style.visibility = 'hidden'
    dummyElement.style.whiteSpace = 'pre-wrap'
    dummyElement.textContent = textBeforeCursor
    document.body.appendChild(dummyElement)

    const cursorTop = dummyElement.offsetHeight
    document.body.removeChild(dummyElement)

    const scrollTop = Math.max(0, cursorTop - textarea.clientHeight + 20)
    textarea.scrollTop = scrollTop

    textarea.setSelectionRange(cursorPosition, cursorPosition)
  }
}

// 监听输入内容变化
watch(
  () => props.modelValue,
  () => {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }
)

// 处理换行
const handleNewline = (event: KeyboardEvent) => {
  event.preventDefault()
  const textarea = event.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const newValue = value.substring(0, start) + '\n' + value.substring(end)
  emit('update:modelValue', newValue)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
    textarea.scrollTop = textarea.scrollHeight
  })
}

// 聚焦输入框
const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

defineExpose({
  focus,
})
</script>

<template>
  <div class="chat-input">
    <textarea
      ref="inputRef"
      :value="modelValue"
      :placeholder="t('askAiAssistant')"
      :disabled="isGenerating"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.enter.exact.prevent="$emit('send')"
      @keydown.enter.shift.exact="handleNewline"
    />
    <div class="input-controls">
      <button v-if="!isGenerating" @click="$emit('send')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
        {{ t('send') }}
      </button>
      <button v-else class="stop-btn" @click="$emit('stop')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M6 6h12v12H6z" />
        </svg>
        {{ t('stop') }}
      </button>
      <button
        class="voice-btn"
        :class="{
          'is-listening': isListening,
          'is-error': recognitionStatus === 'error',
          'is-processing': recognitionStatus === 'processing',
        }"
        :disabled="!isRecognitionSupported"
        :title="lastError || t(isListening ? 'stopListening' : 'startListening')"
        @click="isListening ? stopListening() : startListening()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path
            d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"
          />
        </svg>
        <span>{{ isListening ? t('stopListening') : t('startListening') }}</span>
        <span v-if="lastError" class="error-message">{{ lastError }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  position: sticky;
  bottom: 0;
  background-color: var(--bg-color);
  z-index: 10;
}

.chat-input textarea {
  flex-grow: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  outline: none;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  resize: none;
  min-height: 36px;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
  overflow-y: auto;
}

.chat-input textarea:focus {
  border-color: var(--button-bg-color);
}

.input-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input button {
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

.chat-input button:hover:not(:disabled) {
  opacity: 0.9;
}

.chat-input button:disabled {
  background-color: var(--input-border-color);
  cursor: not-allowed;
  opacity: 0.7;
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
  .chat-input {
    padding: 8px 12px;
  }

  .chat-input textarea {
    padding: 6px 10px;
    font-size: 13px;
    min-height: 32px;
  }

  .input-controls {
    gap: 6px;
  }

  .chat-input button {
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
