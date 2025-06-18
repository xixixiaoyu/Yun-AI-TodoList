<template>
  <div class="flex gap-3 px-6 md:px-4 md:gap-2">
    <button
      class="px-4 py-2.5 text-sm bg-input-bg text-text border border-input-border rounded-lg cursor-pointer flex items-center gap-2 transition-all duration-200 h-10 hover:bg-button-hover hover:text-white hover:border-button-bg hover:shadow-[0_2px_8px_rgba(121,180,166,0.2)] md:px-3 md:py-2 md:text-[13px] md:h-9"
      @click="$emit('new')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        class="md:w-3.5 md:h-3.5"
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
      {{ t('newConversation') }}
    </button>

    <button
      class="px-3 py-2.5 text-sm bg-input-bg text-text border border-input-border rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 h-10 w-10 hover:bg-button-hover hover:text-white hover:border-button-bg hover:shadow-[0_2px_8px_rgba(121,180,166,0.2)] md:py-2 md:h-9 md:w-9"
      @click="$emit('toggleDrawer')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        class="md:w-3.5 md:h-3.5"
      >
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{}>()

defineEmits<{
  (e: 'new'): void
  (e: 'toggleDrawer'): void
}>()

const { t } = useI18n()
</script>
