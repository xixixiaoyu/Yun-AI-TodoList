<template>
  <div class="relative flex-grow">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="t('askAiAssistant')"
      class="w-full px-4 py-3 text-sm border border-input-border rounded-xl outline-none bg-input-bg text-text resize-none min-h-[80px] max-h-48 font-inherit leading-[1.6] overflow-y-auto focus:border-button-bg focus:shadow-[0_0_0_3px_rgba(121,180,166,0.1)] transition-all duration-200 placeholder:text-text-secondary md:text-[13px] md:min-h-[72px] max-[639px]:min-h-[40px] max-[639px]:py-1 max-[639px]:px-3 max-[639px]:text-[13px]"
      :style="{ paddingRight: '72px' }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.enter.exact.prevent="$emit('send')"
      @keydown.enter.shift.exact="$emit('newline', $event)"
    />

    <!-- 文件上传按钮 -->
    <button
      :disabled="isGenerating || isOptimizing"
      class="file-upload-btn"
      :title="t('uploadFile')"
      @click="triggerFileUpload"
    >
      <div class="file-upload-btn-tooltip">{{ t('uploadFile') }}</div>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
    </button>

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

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="acceptedFileTypes"
      @change="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { parseFile } from '@/utils/fileParser'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
  (e: 'file-upload', file: File, content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 支持的文件类型 - 包括 PDF、DOC、DOCX、Excel 和文本文件
const acceptedFileTypes = computed(() => {
  return [
    // PDF 文件
    '.pdf',
    'application/pdf',
    // DOC 文件
    '.doc',
    'application/msword',
    // DOCX 文件
    '.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel 文件
    '.xlsx',
    '.xls',
    '.csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    // 文本文件
    '.txt',
    '.md',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.vue',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.xml',
    '.yaml',
    '.yml',
    '.log',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.sql',
    '.sh',
    '.bat',
    '.ps1',
    'text/*',
  ].join(',')
})

// 触发文件上传
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    // 直接解析文件内容用于聊天
    const content = await parseFile(file)
    emit('file-upload', file, content)

    // 清空文件输入框
    target.value = ''
  } catch (error) {
    console.error('文件处理失败:', error)
    alert(error instanceof Error ? error.message : t('fileReadError'))
  }
}

// 注意：readFileContent 函数已被 parseFile 工具替代，支持更多文件类型

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    const textarea = textareaRef.value
    const cursorPosition = textarea.selectionStart

    // 先重置高度为 auto 以获取正确的 scrollHeight
    textarea.style.height = 'auto'

    // 计算内容所需的高度，限制在最小和最大高度之间
    // 检查是否为移动端设备
    const isMobile = window.innerWidth <= 639
    // 设置最小高度：移动端 40px，桌面端 90px
    const minHeight = isMobile ? 40 : 90
    // 设置最大高度：移动端 96px (6rem)，桌面端 192px (12rem)
    const maxHeight = isMobile ? 96 : 192
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
/* 文件上传按钮样式 */
.file-upload-btn {
  position: absolute;
  bottom: 12px;
  right: 52px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1 0%, rgba(99, 102, 241, 0.8) 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.15);
  z-index: 10;
  transform: scale(1);
  opacity: 0.8;
}

.file-upload-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, #6366f1 100%);
  opacity: 1;
}

.file-upload-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.3);
}

.file-upload-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: scale(1);
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.05);
}

/* 文件上传按钮悬浮提示样式 */
.file-upload-btn-tooltip {
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

.file-upload-btn-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  right: 8px;
  border: 3px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}

.file-upload-btn:hover .file-upload-btn-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  animation: fadeInUp 0.2s ease;
}

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

/* 移动端优化样式 */
@media (max-width: 639px) {
  .relative.flex-grow {
    display: flex;
    flex-direction: column;
  }

  textarea {
    flex: 1;
    min-height: 2rem !important;
    max-height: 4rem !important;
    padding: 0.5rem 0.75rem !important;
    font-size: 0.875rem !important;
    line-height: 1.25 !important;
    border-radius: 0.75rem !important;
    background: rgba(var(--input-bg-color-rgb), 0.95) !important;
    backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(var(--primary-color-rgb), 0.15) !important;
  }

  textarea:focus {
    border-color: rgba(var(--primary-color-rgb), 0.3) !important;
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1) !important;
  }

  /* 移动端隐藏文件上传和 AI 增强按钮 */
  .file-upload-btn,
  .enhance-btn {
    display: none !important;
  }

  /* 隐藏移动端的工具提示 */
  .file-upload-btn-tooltip,
  .enhance-btn-tooltip {
    display: none;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .file-upload-btn,
  .enhance-btn {
    min-width: 1.75rem;
    min-height: 1.75rem;
    border-radius: 0.375rem;
  }

  .file-upload-btn {
    right: 2.5rem;
  }

  .enhance-btn {
    right: 0.5rem;
  }

  textarea {
    padding-right: 3rem !important;
    min-height: 2.5rem !important;
    font-size: 0.875rem !important;
    padding: 0.25rem 3rem 0.25rem 0.75rem;
    line-height: 1.4 !important;
  }

  /* 增强触摸反馈 */
  .file-upload-btn:active,
  .enhance-btn:active {
    transform: scale(0.9);
    transition: transform 0.1s ease;
  }
}

/* 平板端适配 */
@media (min-width: 640px) and (max-width: 1024px) {
  .file-upload-btn {
    bottom: 0.75rem;
    right: 3rem;
    width: 1.75rem;
    height: 1.75rem;
  }

  .enhance-btn {
    bottom: 0.75rem;
    right: 0.75rem;
    width: 1.75rem;
    height: 1.75rem;
  }

  textarea {
    padding-right: 5.5rem !important;
  }
}
</style>
