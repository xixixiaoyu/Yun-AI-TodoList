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
        'bg-button-bg text-white spacing-responsive-sm shadow-[0_2px_8px_rgba(121,180,166,0.3)] hover:shadow-[0_4px_12px_rgba(121,180,166,0.4)] leading-[1.4] font-medium text-responsive-base':
          message.role === 'user',
        'ai-message-container': message.role === 'assistant',
      }"
      dir="ltr"
    >
      <p v-if="message.role === 'user'" class="m-0 whitespace-pre-wrap break-words">
        {{ message.content }}
      </p>
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
}

interface Emits {
  (e: 'copy', text: string): void
  (e: 'copy-success', text: string): void
  (e: 'copy-error', error: Error): void
  (e: 'retry', messageIndex: number): void
  (e: 'generate-chart', content: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  isRetrying: false,
  retryCount: 0,
  hasError: false,
  messageIndex: 0,
})
const emit = defineEmits<Emits>()

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

defineOptions({
  name: 'ChatMessage',
})
</script>
