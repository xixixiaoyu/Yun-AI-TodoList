<template>
  <div
    class="flex gap-3 px-6 py-2 md:px-4 md:py-3 sticky bottom-0 bg-bg z-10 border-t border-input-border/50"
  >
    <ChatTextarea
      ref="inputRef"
      :model-value="modelValue"
      :is-generating="isGenerating"
      :is-optimizing="isOptimizing"
      @update:model-value="$emit('update:modelValue', $event)"
      @send="$emit('send')"
      @newline="handleNewline"
      @optimize="$emit('optimize')"
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
import ChatInputControls from './ChatInputControls.vue'
import ChatTextarea from './ChatTextarea.vue'

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
  stopListening,
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
  focus,
})

defineOptions({
  name: 'ChatInput',
})
</script>
