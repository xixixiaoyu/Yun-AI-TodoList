<template>
  <div
    class="flex items-center justify-center px-4 py-3.5 md:px-3 md:py-3 sm:px-3 sm:py-3 bg-gradient-to-r from-button-bg to-button-hover text-white shadow-lg backdrop-blur-[10px] border-b border-white/10 rounded-t-xl md:rounded-t-lg"
  >
    <div class="flex items-center gap-3 sm:gap-2">
      <div class="flex flex-col gap-0.5">
        <h2 class="m-0 text-lg md:text-base sm:text-sm font-semibold text-white leading-tight">
          {{ t('aiAssistant') }}
        </h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineOptions({
  name: 'AIChatHeader',
})
</script>
