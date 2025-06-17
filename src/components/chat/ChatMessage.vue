<template>
  <div
    class="max-w-[95%] md:max-w-[96%] relative opacity-100 translate-y-0 transition-all-300 m-0 group"
    :class="{
      'max-w-[92%] md:max-w-[94%] self-end': message.role === 'user',
      'self-start': message.role === 'assistant',
    }"
  >
    <div
      class="rounded-xl leading-6 text-[15px] ltr relative transition-all duration-300 tracking-[0.2px] word-break-break-word"
      :class="{
        'bg-button-bg text-white px-4 py-3 md:px-3.5 md:py-2.5 shadow-[0_2px_8px_rgba(121,180,166,0.3)] hover:shadow-[0_4px_12px_rgba(121,180,166,0.4)] leading-[1.4] font-medium':
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
        <button
          v-if="!isStreaming"
          class="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-1.5 sm:px-3 sm:py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-md sm:rounded-lg cursor-pointer text-primary opacity-0 invisible transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium group-hover:opacity-90 group-hover:visible hover:!opacity-100 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-sm hover:shadow-md"
          title="复制回答内容"
          @click="$emit('copy', message.content)"
        >
          <CopyIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span class="hidden sm:inline">复制</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyIcon from '../common/icons/CopyIcon.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sanitizedContent?: string
}

interface Props {
  message: Message
  isStreaming?: boolean
}

interface Emits {
  (e: 'copy', text: string): void
}

defineProps<Props>()
defineEmits<Emits>()

defineOptions({
  name: 'ChatMessage',
})
</script>
