<template>
  <div
    class="flex items-center px-4 py-3.5 md:px-3 md:py-3 sm:px-3 sm:py-3 bg-gradient-to-r from-button-bg to-button-hover text-white shadow-lg backdrop-blur-[10px] sticky top-0 z-1000 border-b border-white/10"
  >
    <!-- 左侧：标题区域 -->
    <div class="flex items-center gap-3 sm:gap-2 flex-1">
      <div class="flex flex-col gap-0.5">
        <h2 class="m-0 text-lg md:text-base sm:text-sm font-semibold text-white leading-tight">
          {{ t('aiAssistant') }}
        </h2>
      </div>
    </div>

    <!-- 右侧：关闭按钮 -->
    <router-link
      to="/"
      class="flex items-center justify-center p-2 sm:p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 no-underline group mr-1"
      aria-label="关闭"
    >
      <CloseIcon class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import CloseIcon from '../common/icons/CloseIcon.vue'

const { t } = useI18n()

defineOptions({
  name: 'AIChatHeader'
})
</script>
