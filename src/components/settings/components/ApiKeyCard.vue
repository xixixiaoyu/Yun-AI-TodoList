<template>
  <div
    class="bg-bg-card rounded-xl border border-input-border/30 cursor-pointer transition-all-300 hover:border-primary/50 hover:bg-primary/5 hover:transform-hover-up-1"
    @click="$emit('showPopover')"
  >
    <div class="p-4">
      <!-- 状态指示器和标题 -->
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-3 h-3 rounded-full relative flex-shrink-0"
          :class="{
            'bg-green-500 shadow-[0_0_8px_rgba(76,175,80,0.4)]': localApiKey,
            'bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.3)]': !localApiKey
          }"
        />
        <div class="flex-1">
          <div class="text-sm font-medium text-text">
            {{ localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured') }}
          </div>
          <div class="text-xs text-text-secondary mt-0.5">
            {{ localApiKey ? '密钥已安全保存' : '点击配置 API 密钥' }}
          </div>
        </div>
      </div>

      <!-- 配置按钮 -->
      <button
        class="w-full bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium transition-all-300 hover:bg-primary-hover hover:transform-hover-up-1 flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
          />
        </svg>
        {{ localApiKey ? t('reconfigure') : t('configure') }}
      </button>
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
