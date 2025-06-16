<template>
  <div
    class="bg-card rounded-2xl shadow-card cursor-pointer transition-all-300 border-2 border-transparent overflow-hidden hover:transform-hover-up hover:border-button-bg hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
    @click="$emit('showPopover')"
  >
    <div
      class="p-5 md:p-6 sm:p-5 flex items-center justify-between gap-5 md:flex-col md:gap-6 md:text-center sm:gap-5"
    >
      <div class="flex-1">
        <div class="flex items-center gap-4 md:justify-center">
          <div
            class="w-4 h-4 rounded-full relative flex-shrink-0"
            :class="{
              'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(76,175,80,0.3)] before:absolute before:-top-0.75 before:-left-0.75 before:-right-0.75 before:-bottom-0.75 before:rounded-full before:bg-[radial-gradient(circle,rgba(76,175,80,0.2)_0%,transparent_70%)] before:animate-pulse':
                localApiKey,
              'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_2px_8px_rgba(244,67,54,0.3)] before:absolute before:-top-0.75 before:-left-0.75 before:-right-0.75 before:-bottom-0.75 before:rounded-full before:bg-[radial-gradient(circle,rgba(244,67,54,0.2)_0%,transparent_70%)] before:animate-pulse':
                !localApiKey
            }"
          />
          <div class="flex flex-col gap-1">
            <span class="text-[1.1rem] font-semibold text-text">{{
              localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured')
            }}</span>
            <span class="text-[0.9rem] text-text-secondary">{{
              localApiKey ? '密钥已安全保存' : '点击配置 API 密钥'
            }}</span>
          </div>
        </div>
      </div>
      <div class="flex-shrink-0 md:w-full">
        <button
          class="px-4 py-2.5 border-none rounded-lg bg-gradient-to-br from-button-bg to-button-hover text-white text-[0.8rem] md:text-[0.9rem] sm:text-[0.9rem] font-semibold cursor-pointer transition-all-300 whitespace-nowrap inline-flex items-center gap-1 shadow-[0_3px_8px_rgba(121,180,166,0.3)] relative overflow-hidden hover:transform-hover-up hover:shadow-[0_6px_20px_rgba(121,180,166,0.4)] active:translate-y-[-1px] md:w-full md:justify-center md:px-6 md:py-4 sm:px-5 sm:py-3.5 before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-[left_0.5s_ease] hover:before:left-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
            />
          </svg>
          {{ localApiKey ? t('reconfigure') : t('configure') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  localApiKey: string
}

interface Emits {
  (e: 'showPopover'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyCard'
})
</script>
