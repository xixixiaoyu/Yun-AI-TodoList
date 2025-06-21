<template>
  <div
    class="flex items-center justify-center px-4 py-3.5 md:px-3 md:py-3 sm:px-3 sm:py-3 bg-gradient-to-r from-button-bg to-button-hover text-white shadow-lg backdrop-blur-[10px] border-b border-white/10 rounded-t-xl md:rounded-t-lg"
  >
    <div class="flex items-center gap-3 sm:gap-2">
      <!-- AI 神经网络图标 -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="flex-shrink-0"
      >
        <!-- 中心节点 -->
        <circle cx="12" cy="12" r="2" fill="currentColor" />

        <!-- 外围节点 -->
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        <circle cx="6" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" />

        <!-- 连接线 -->
        <path d="M7.5 7.5L10 10" stroke="currentColor" opacity="0.6" />
        <path d="M16.5 7.5L14 10" stroke="currentColor" opacity="0.6" />
        <path d="M7.5 16.5L10 14" stroke="currentColor" opacity="0.6" />
        <path d="M16.5 16.5L14 14" stroke="currentColor" opacity="0.6" />

        <!-- 脉冲效果线条 -->
        <path d="M12 8V6" stroke="currentColor" opacity="0.4" />
        <path d="M12 18V16" stroke="currentColor" opacity="0.4" />
        <path d="M8 12H6" stroke="currentColor" opacity="0.4" />
        <path d="M18 12H16" stroke="currentColor" opacity="0.4" />
      </svg>

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
