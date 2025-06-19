<template>
  <div class="relative flex-grow">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="t('askAiAssistant')"
      :disabled="isGenerating"
      class="w-full px-4 py-3 text-sm border border-input-border rounded-xl outline-none bg-input-bg text-text resize-none min-h-[80px] max-h-48 font-inherit leading-[1.6] overflow-y-auto focus:border-button-bg focus:shadow-[0_0_0_3px_rgba(121,180,166,0.1)] transition-all duration-200 placeholder:text-text-secondary md:text-[13px] md:min-h-[72px]"
      :style="{ paddingRight: '56px' }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.enter.exact.prevent="$emit('send')"
      @keydown.enter.shift.exact="$emit('newline', $event)"
    />

    <!-- AI增强按钮 -->
    <button
      :disabled="isGenerating || isOptimizing || !modelValue.trim()"
      class="enhance-btn"
      :title="isOptimizing ? t('optimizing') : t('optimize')"
      @click="$emit('optimize')"
    >
      <div class="enhance-btn-tooltip">{{ isOptimizing ? t('optimizing') : t('optimize') }}</div>
      <svg v-if="isOptimizing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
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

    // 先重置高度为 auto 以获取正确的 scrollHeight
    textarea.style.height = 'auto'

    // 计算内容所需的高度，限制在最小和最大高度之间
    const minHeight = 90 // 对应 min-h-[80px]
    const maxHeight = 192 // 对应 max-h-48 (12rem = 192px)
    const contentHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))

    // 设置新高度
    textarea.style.height = `${contentHeight}px`

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
  },
  { immediate: true }
)

// 组件挂载后初始化高度
onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

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

<style scoped>
/* AI增强按钮样式 */
.enhance-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(
    135deg,
    var(--primary-color, #79b4a6) 0%,
    rgba(121, 180, 166, 0.8) 100%
  );
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(121, 180, 166, 0.15);
  z-index: 10;
  transform: scale(1);
  opacity: 0.8;
}

.enhance-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(121, 180, 166, 0.25);
  background: linear-gradient(
    135deg,
    rgba(121, 180, 166, 0.9) 0%,
    var(--primary-color, #79b4a6) 100%
  );
  opacity: 1;
}

.enhance-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(121, 180, 166, 0.3);
}

.enhance-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: scale(1);
  box-shadow: 0 1px 2px rgba(121, 180, 166, 0.05);
}

/* 悬浮提示样式 */
.enhance-btn-tooltip {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transform: translateY(2px);
  transition: all 0.15s ease;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.enhance-btn-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  right: 8px;
  border: 3px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}

.enhance-btn:hover .enhance-btn-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  animation: fadeInUp 0.2s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .enhance-btn {
    bottom: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .enhance-btn svg {
    width: 12px;
    height: 12px;
  }

  .enhance-btn-tooltip {
    font-size: 10px;
    padding: 3px 6px;
    margin-bottom: 4px;
  }

  .enhance-btn-tooltip::after {
    border-width: 2px;
    right: 6px;
  }
}
</style>
