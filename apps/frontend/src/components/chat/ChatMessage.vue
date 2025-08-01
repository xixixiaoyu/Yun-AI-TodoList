<template>
  <div
    class="relative opacity-100 translate-y-0 transition-all-300 m-0 group"
    :class="{
      'user-message-responsive': message.role === 'user',
      'ai-message-responsive self-start': message.role === 'assistant',
    }"
  >
    <div
      class="rounded-xl leading-6 ltr relative transition-all duration-300 tracking-[0.2px] word-break-break-word"
      :class="{
        'bg-button-bg text-white spacing-responsive-sm shadow-[0_2px_8px_rgba(121,180,166,0.3)] hover:shadow-[0_4px_12px_rgba(121,180,166,0.4)] leading-[1.3] font-medium text-responsive-sm':
          message.role === 'user',
        'ai-message-container': message.role === 'assistant',
      }"
      dir="ltr"
    >
      <!-- 用户消息内容 -->
      <div v-if="message.role === 'user'" class="relative">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="edit-mode">
          <textarea
            ref="editTextareaRef"
            v-model="editContent"
            class="w-full min-h-[80px] p-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-button-bg/50 focus:border-button-bg/50 transition-all duration-200"
            :placeholder="t('editMessage')"
            @keydown="handleEditKeydown"
          />
          <div class="flex items-center justify-end gap-2 mt-2">
            <button
              class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200"
              @click="cancelEdit"
            >
              {{ t('cancel') }}
            </button>
            <button
              class="px-3 py-1.5 text-sm rounded-lg bg-button-bg hover:bg-button-bg/90 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!editContent.trim() || isRegenerating"
              @click="saveEdit"
            >
              <LoadingIcon v-if="isRegenerating" class="w-4 h-4 mr-1" />
              {{ isRegenerating ? t('regenerating') : t('saveAndRegenerate') }}
            </button>
          </div>
        </div>
        <!-- 显示模式 -->
        <div v-else>
          <p class="m-0 whitespace-pre-wrap break-words">
            {{ message.content }}
          </p>
          <!-- 用户消息悬浮操作按钮 -->
          <div
            v-if="!isStreaming"
            class="floating-action-buttons absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div
              class="flex items-center gap-1 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg p-1"
            >
              <!-- 编辑按钮 -->
              <button
                class="edit-button p-2 rounded-lg cursor-pointer bg-gray-100/80 hover:bg-gray-200/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 border border-gray-300/50 hover:border-gray-400/70 dark:border-gray-600/50 dark:hover:border-gray-500/70 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-sm hover:shadow-md"
                :title="t('editMessage')"
                @click="startEdit"
              >
                <EditIcon class="w-4 h-4" />
              </button>
              <!-- 复制按钮 -->
              <EnhancedCopyButton
                :text="message.content"
                size="sm"
                variant="minimal"
                @copy-success="handleCopySuccess"
                @copy-error="handleCopyError"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="relative">
        <div
          class="ai-message-prose ai-message-headings ai-message-paragraphs ai-message-lists ai-message-code-inline ai-message-code-block ai-message-blockquote ai-message-table ai-message-links break-words"
          v-html="message.sanitizedContent"
        />
        <!-- 悬浮操作按钮 -->
        <div
          v-if="!isStreaming"
          class="floating-action-buttons absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <div
            class="flex items-center gap-1 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg p-1"
          >
            <!-- 复制按钮 -->
            <EnhancedCopyButton
              :text="message.content"
              size="sm"
              variant="minimal"
              @copy-success="handleCopySuccess"
              @copy-error="handleCopyError"
            />
            <!-- 生成图表按钮 -->
            <button
              v-if="message.role === 'assistant'"
              class="flex items-center justify-center w-8 h-8 rounded-md bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 transition-all duration-200 group/chart"
              :title="'生成图表'"
              @click="handleGenerateChart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-gray-600 dark:text-gray-400 group-hover/chart:text-blue-600 dark:group-hover/chart:text-blue-400 transition-colors duration-200"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </button>
            <!-- 重试按钮 -->
            <RetryButton
              v-if="message.role === 'assistant'"
              :is-retrying="props.isRetrying"
              :retry-count="props.retryCount"
              :has-error="props.hasError"
              size="sm"
              variant="minimal"
              @retry="handleRetry"
              @retry-start="handleRetry"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import EditIcon from '../common/icons/EditIcon.vue'
import LoadingIcon from '../common/icons/LoadingIcon.vue'
import EnhancedCopyButton from './EnhancedCopyButton.vue'
import RetryButton from './RetryButton.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sanitizedContent?: string
}

interface Props {
  message: Message
  isStreaming?: boolean
  isRetrying?: boolean
  retryCount?: number
  hasError?: boolean
  messageIndex?: number
  isRegenerating?: boolean
}

interface Emits {
  (e: 'copy', text: string): void
  (e: 'copy-success', text: string): void
  (e: 'copy-error', error: Error): void
  (e: 'retry', messageIndex: number): void
  (e: 'generate-chart', content: string): void
  (e: 'edit-message', messageIndex: number, newContent: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  isRetrying: false,
  retryCount: 0,
  hasError: false,
  messageIndex: 0,
  isRegenerating: false,
})
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 编辑相关状态
const isEditing = ref(false)
const editContent = ref('')
const editTextareaRef = ref<HTMLTextAreaElement | null>(null)

const handleCopySuccess = (text: string) => {
  emit('copy', text)
  emit('copy-success', text)
}

const handleCopyError = (error: Error) => {
  emit('copy-error', error)
}

const handleRetry = () => {
  if (props.messageIndex !== undefined) {
    emit('retry', props.messageIndex)
  }
}

const handleGenerateChart = () => {
  emit('generate-chart', props.message.content)
}

// 编辑功能方法
const startEdit = async () => {
  isEditing.value = true
  editContent.value = props.message.content
  await nextTick()
  if (editTextareaRef.value) {
    editTextareaRef.value.focus()
    // 自动调整高度
    adjustTextareaHeight()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editContent.value = ''
}

const saveEdit = () => {
  if (!editContent.value.trim()) return

  emit('edit-message', props.messageIndex, editContent.value.trim())
  isEditing.value = false
}

const handleEditKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    cancelEdit()
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    saveEdit()
  }
  // 自动调整高度
  nextTick(() => adjustTextareaHeight())
}

const adjustTextareaHeight = () => {
  if (editTextareaRef.value) {
    editTextareaRef.value.style.height = 'auto'
    editTextareaRef.value.style.height = `${Math.max(80, editTextareaRef.value.scrollHeight)}px`
  }
}

defineOptions({
  name: 'ChatMessage',
})
</script>
