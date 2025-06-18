<template>
  <div class="relative flex-grow">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="t('askAiAssistant')"
      :disabled="isGenerating"
      class="w-full px-4 py-3 pr-12 md:px-3 md:py-2 md:pr-10 text-sm border border-input-border rounded-xl outline-none bg-input-bg text-text resize-none min-h-[44px] max-h-32 font-inherit leading-[1.5] overflow-y-auto focus:border-button-bg focus:shadow-[0_0_0_3px_rgba(121,180,166,0.1)] transition-all duration-200 placeholder:text-text-secondary md:text-[13px] md:min-h-[40px]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.enter.exact.prevent="$emit('send')"
      @keydown.enter.shift.exact="$emit('newline', $event)"
    />

    <!-- 优化表达按钮 -->
    <button
      v-if="modelValue.trim()"
      :disabled="isGenerating || isOptimizing"
      class="absolute bottom-2 right-2 md:bottom-1.5 md:right-1.5 w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-lg bg-button-bg/10 hover:bg-button-bg/20 text-button-bg hover:text-button-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-button-bg/10 disabled:hover:text-button-bg group"
      :title="isOptimizing ? t('optimizing') : t('optimize')"
      @click="$emit('optimize')"
    >
      <span
        class="text-base md:text-sm transition-transform duration-200 group-hover:scale-110"
        :class="{ 'animate-pulse': isOptimizing }"
      >
        ✨
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: string
  isGenerating: boolean
  isOptimizing: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
  (e: 'newline', event: KeyboardEvent): void
  (e: 'optimize'): void
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
  focus,
})

defineOptions({
  name: 'ChatTextarea',
})
</script>
