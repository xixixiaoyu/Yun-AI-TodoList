<template>
  <div class="chat-input">
    <ChatTextarea
      ref="inputRef"
      :model-value="modelValue"
      :is-generating="isGenerating"
      @update:model-value="$emit('update:modelValue', $event)"
      @send="$emit('send')"
      @newline="handleNewline"
    />

    <ChatInputControls
      :is-generating="isGenerating"
      :is-listening="isListening"
      :recognition-status="recognitionStatus"
      :last-error="lastError"
      :is-recognition-supported="isRecognitionSupported"
      @send="$emit('send')"
      @stop="$emit('stop')"
      @start-listening="startListening"
      @stop-listening="stopListening"
    />
  </div>
</template>

<script setup lang="ts">
import { useVoiceInput } from '../../composables/useVoiceInput'
import ChatTextarea from './ChatTextarea.vue'
import ChatInputControls from './ChatInputControls.vue'

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

const inputRef = ref<InstanceType<typeof ChatTextarea> | null>(null)

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
  stopListening
} = useVoiceInput(handleTranscript)

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

const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

defineExpose({
  focus
})

defineOptions({
  name: 'ChatInput'
})
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  position: sticky;
  bottom: 0;
  background-color: var(--bg-color);
  z-index: 10;
}

@media (max-width: 768px) {
  .chat-input {
    padding: 8px 12px;
  }
}
</style>
