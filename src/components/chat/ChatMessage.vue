<template>
  <div
    class="max-w-[95%] md:max-w-[96%] relative opacity-100 translate-y-0 transition-all-300 m-0 group"
    :class="{
      'max-w-[92%] md:max-w-[94%] self-end': message.role === 'user',
      'self-start': message.role === 'assistant'
    }"
  >
    <div
      class="px-4 py-3 md:px-3.5 md:py-2.5 rounded-xl leading-6 text-[15px] ltr relative transition-all duration-200 shadow-sm tracking-[0.2px] word-break-break-word"
      :class="{
        'bg-button-bg text-white px-4 py-3 md:px-3.5 md:py-2.5 shadow-[0_2px_8px_rgba(121,180,166,0.3)] hover:shadow-[0_4px_12px_rgba(121,180,166,0.4)] leading-[1.4] font-medium':
          message.role === 'user',
        'bg-input-bg text-text hover:shadow-md border border-input-border px-8 py-6 md:px-6 md:py-5':
          message.role === 'assistant'
      }"
      dir="ltr"
    >
      <p v-if="message.role === 'user'" class="m-0 whitespace-pre-wrap break-words">
        {{ message.content }}
      </p>
      <div v-else class="relative pb-3 md:pb-10">
        <div
          class="prose prose-sm max-w-none break-words leading-relaxed text-text [&>*]:mb-3 [&>*:last-child]:mb-0 [&>p]:leading-7 [&>ul]:my-3 [&>ol]:my-3 [&>li]:my-1 [&>h1]:text-lg [&>h1]:font-semibold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>code]:bg-input-bg [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono [&>pre]:bg-input-bg [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-3 [&>blockquote]:border-l-4 [&>blockquote]:border-button-bg [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-3 [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>th]:border [&>th]:border-input-border [&>th]:p-2 [&>th]:bg-input-bg [&>th]:font-semibold [&>td]:border [&>td]:border-input-border [&>td]:p-2"
          v-html="message.sanitizedContent"
        />
        <button
          v-if="!isStreaming"
          class="absolute right-0 bottom-0 px-2.5 py-1.5 bg-transparent border-none cursor-pointer text-text-secondary opacity-0 invisible transition-all duration-200 flex items-center gap-1 text-xs group-hover:opacity-70 group-hover:visible hover:!opacity-100 hover:text-text md:opacity-0 md:invisible md:group-hover:opacity-80 md:group-hover:visible md:px-3 md:py-1.5 md:text-[13px] md:bg-button-bg md:rounded-md md:bottom-1 md:right-1 md:text-white md:shadow-sm md:hover:!opacity-100 active:md:opacity-100 active:md:scale-95 active:md:shadow-none"
          title="复制原始内容"
          @click="$emit('copy', message.content)"
        >
          <CopyIcon class="w-3.5 h-3.5 md:w-[13px] md:h-[13px]" />
          复制
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
  name: 'ChatMessage'
})
</script>
