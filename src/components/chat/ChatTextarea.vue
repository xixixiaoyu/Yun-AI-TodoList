<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :placeholder="t('askAiAssistant')"
    :disabled="isGenerating"
    class="chat-textarea"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    @keydown.enter.exact.prevent="$emit('send')"
    @keydown.enter.shift.exact="$emit('newline', $event)"
  />
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: string
  isGenerating: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
  (e: 'newline', event: KeyboardEvent): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    const textarea = textareaRef.value
    const cursorPosition = textarea.selectionStart

    const dummyElement = document.createElement('div')
    dummyElement.style.cssText = window.getComputedStyle(textarea).cssText
    dummyElement.style.height = 'auto'
    dummyElement.style.position = 'absolute'
    dummyElement.style.visibility = 'hidden'
    dummyElement.style.whiteSpace = 'pre-wrap'
    dummyElement.textContent = textarea.value
    document.body.appendChild(dummyElement)

    const newHeight = Math.min(dummyElement.scrollHeight, 200)
    document.body.removeChild(dummyElement)

    if (Math.abs(parseInt(textarea.style.height) - newHeight) > 2) {
      textarea.style.height = `${newHeight}px`
    }

    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const cursorDummy = document.createElement('div')
    cursorDummy.style.cssText = window.getComputedStyle(textarea).cssText
    cursorDummy.style.height = 'auto'
    cursorDummy.style.position = 'absolute'
    cursorDummy.style.visibility = 'hidden'
    cursorDummy.style.whiteSpace = 'pre-wrap'
    cursorDummy.textContent = textBeforeCursor
    document.body.appendChild(cursorDummy)

    const cursorTop = cursorDummy.offsetHeight
    document.body.removeChild(cursorDummy)

    const scrollTop = Math.max(0, cursorTop - textarea.clientHeight + 20)
    textarea.scrollTop = scrollTop

    textarea.setSelectionRange(cursorPosition, cursorPosition)
  }
}

watch(
  () => props.modelValue,
  () => {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }
)

const focus = () => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

defineExpose({
  focus
})

defineOptions({
  name: 'ChatTextarea'
})
</script>

<style scoped>
.chat-textarea {
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

.chat-textarea:focus {
  border-color: var(--button-bg-color);
}

@media (max-width: 768px) {
  .chat-textarea {
    padding: 6px 10px;
    font-size: 13px;
    min-height: 32px;
  }
}
</style>
