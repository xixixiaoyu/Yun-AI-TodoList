<template>
  <div
    class="fixed -left-75 md:-left-[85%] md:max-w-75 top-0 h-full w-75 bg-bg transition-transform duration-300 shadow-lg z-1000"
    :class="{ 'translate-x-75 md:translate-x-full': isOpen }"
  >
    <div class="h-full flex flex-col p-4">
      <div class="flex justify-between items-center mb-4 pb-3 border-b border-input-border">
        <h3 class="m-0 text-lg font-medium">
          {{ t('conversations') }}
        </h3>
        <div class="flex gap-2 items-center">
          <button
            class="bg-transparent border-none cursor-pointer p-1 text-text opacity-70 transition-all duration-200 flex items-center justify-center hover:opacity-100 hover:text-red-500"
            :title="t('clearAllConversations')"
            @click="$emit('clear')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path
                d="M15 2H9c-1.1 0-2 .9-2 2v2H3v2h2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8h2V6h-4V4c0-1.1-.9-2-2-2zm0 2v2H9V4h6zM7 8h10v12H7V8z"
              />
              <path d="M9 10h2v8H9zm4 0h2v8h-2z" />
            </svg>
          </button>
          <button
            class="bg-transparent border-none cursor-pointer p-1 text-text opacity-70 transition-all duration-200 flex items-center justify-center hover:opacity-100"
            @click="$emit('update:isOpen', false)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="flex-grow overflow-y-auto pr-2">
        <div
          v-for="conversation in conversations"
          :key="conversation.id"
          class="flex justify-between items-center px-3 py-2.5 mb-2 cursor-pointer rounded-lg bg-input-bg transition-all duration-200 hover:opacity-90"
          :class="{ 'bg-button-bg text-bg-card': currentConversationId === conversation.id }"
          @click.stop="$emit('switch', conversation.id)"
        >
          <span class="flex-grow whitespace-nowrap overflow-hidden text-ellipsis mr-2">{{
            conversation.title
          }}</span>
          <button
            class="bg-transparent border-none p-1 cursor-pointer opacity-70 transition-all duration-200 text-inherit hover:opacity-100"
            @click.stop="$emit('delete', conversation.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="isOpen"
    class="fixed top-0 left-0 w-full h-full bg-black/30 z-[999]"
    @click="$emit('update:isOpen', false)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Conversation } from '../../services/types'

defineProps<{
  isOpen: boolean
  conversations: Conversation[]
  currentConversationId: string | null
}>()

defineEmits<{
  'update:isOpen': [value: boolean]
  switch: [id: string]
  delete: [id: string]
  clear: []
}>()

const { t } = useI18n()
</script>
