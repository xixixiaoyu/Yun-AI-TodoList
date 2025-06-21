<template>
  <div class="flex flex-col gap-0">
    <!-- 文件上传状态显示 -->
    <div v-if="hasUploadedFile" class="uploaded-file-container">
      <div class="uploaded-file-content">
        <div class="file-icon-wrapper">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="16"
              y1="17"
              x2="8"
              y2="17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="10,9 9,9 8,9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="file-info">
          <span class="file-label">已上传文件</span>
          <div class="file-details">
            <span class="file-name">{{ uploadedFileName }}</span>
            <span v-if="uploadedFileSize" class="file-size"
              >({{ formatFileSize(uploadedFileSize) }})</span
            >
          </div>
        </div>
        <button @click="$emit('clear-file')" class="clear-file-btn" :title="'移除文件'">
          <svg
            class="clear-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

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
        @file-upload="handleFileUpload"
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
  </div>
</template>

<script setup lang="ts">
import { formatFileSize } from '@yun-ai-todolist/shared/utils'
import { useVoiceInput } from '../../composables/useVoiceInput'
import ChatInputControls from './ChatInputControls.vue'
import ChatTextarea from './ChatTextarea.vue'

const props = defineProps<{
  modelValue: string
  isGenerating: boolean
  isOptimizing: boolean
  hasUploadedFile?: boolean
  uploadedFileName?: string
  uploadedFileSize?: number
}>()

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'optimize'): void
  (e: 'file-upload', payload: { file: File; content: string }): void
  (e: 'clear-file'): void
}

const emit = defineEmits<Emits>()

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

// 处理文件上传
const handleFileUpload = (file: File, content: string) => {
  // 发送文件上传事件，传递文件和内容信息
  emit('file-upload', { file, content })
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

<style scoped>
/* 文件上传状态容器 */
.uploaded-file-container {
  @apply px-4 py-1 md:px-3;
  animation: slideInFromTop 0.3s ease-out;
}

.uploaded-file-content {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg relative overflow-hidden;
  background: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--card-shadow);
}

.uploaded-file-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--primary-color-rgb), 0.15) 50%,
    transparent 100%
  );
}

.uploaded-file-content:hover {
  background: var(--hover-bg-color);
  border-color: rgba(var(--primary-color-rgb), 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.1);
}

/* 文件图标样式 */
.file-icon-wrapper {
  @apply flex items-center justify-center w-7 h-7 rounded-md relative;
  background: rgba(var(--primary-color-rgb), 0.1);
  border: 1px solid rgba(var(--primary-color-rgb), 0.15);
}

.file-icon {
  @apply w-4 h-4;
  color: var(--primary-color);
  filter: drop-shadow(0 1px 2px rgba(var(--primary-color-rgb), 0.2));
}

/* 文件信息样式 */
.file-info {
  @apply flex flex-col flex-1 min-w-0;
}

.file-label {
  @apply text-xs font-medium opacity-75 mb-0.5;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-details {
  @apply flex items-center gap-2;
}

.file-name {
  @apply text-sm font-medium truncate;
  color: var(--text-color);
  max-width: 160px;
}

.file-size {
  @apply text-xs font-normal;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

/* 清除按钮样式 */
.clear-file-btn {
  @apply flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.clear-file-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.clear-file-btn:active {
  transform: scale(0.95);
}

.clear-icon {
  @apply w-3 h-3;
  transition: transform 0.2s ease;
}

.clear-file-btn:hover .clear-icon {
  transform: rotate(90deg);
}

/* 动画定义 */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色主题适配 */
[data-theme='dark'] .uploaded-file-content {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.12) 0%,
    rgba(var(--primary-color-rgb), 0.18) 100%
  );
  border-color: rgba(var(--primary-color-rgb), 0.25);
}

[data-theme='dark'] .uploaded-file-content:hover {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.18) 0%,
    rgba(var(--primary-color-rgb), 0.25) 100%
  );
  border-color: rgba(var(--primary-color-rgb), 0.35);
}

[data-theme='dark'] .file-icon-wrapper {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color-rgb), 0.2) 0%,
    rgba(var(--primary-color-rgb), 0.3) 100%
  );
  border-color: rgba(var(--primary-color-rgb), 0.3);
}

[data-theme='dark'] .clear-file-btn {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.25);
  color: #f87171;
}

[data-theme='dark'] .clear-file-btn:hover {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.35);
}
</style>
