<template>
  <div class="flex flex-col h-full">
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-1">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg settings-section-icon"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M7 14c-1.66 0-3 1.34-3 3 0 1.31.84 2.41 2 2.83V22h2v-2.17c1.16-.42 2-1.52 2-2.83 0-1.66-1.34-3-3-3zM10.5 6L9 4.5c-.39-.39-1.02-.39-1.41 0L6.17 6.01c-.78.78-.78 2.05 0 2.83L12 14.66l5.83-5.82c.78-.78.78-2.05 0-2.83L16.41 4.5c-.39-.39-1.02-.39-1.41 0L13.5 6l-1.5 1.5L10.5 6z"
            />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-text">
          {{ t('apiKeyConfiguration') }}
        </h3>
      </div>
      <p class="text-xs text-text-secondary leading-snug">
        {{ t('configureDeepSeekApiKey') }}
      </p>
    </div>

    <div class="flex-1">
      <ApiKeyCard :local-api-key="localApiKey" @show-popover="showApiKeyPopover = true" />
    </div>

    <!-- 使用 Teleport 将弹窗渲染到 body 根部，避免父容器样式影响 -->
    <Teleport to="body">
      <div
        v-if="showApiKeyPopover"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-[overlayIn_0.3s_ease]"
        @click="showApiKeyPopover = false"
      />
      <ApiKeyPopover
        v-if="showApiKeyPopover"
        :local-api-key="localApiKey"
        :show-api-key="showApiKey"
        @update:local-api-key="localApiKey = $event"
        @update:show-api-key="showApiKey = $event"
        @close="showApiKeyPopover = false"
        @save="saveAndClosePopover"
        @clear="clearKey"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { clearApiKey, saveApiKey } from '../../services/configService'
import ApiKeyCard from './components/ApiKeyCard.vue'
import ApiKeyPopover from './components/ApiKeyPopover.vue'

interface Props {
  localApiKey: string
  showApiKey: boolean
  showApiKeyPopover: boolean
}

interface Emits {
  (e: 'update:localApiKey', value: string): void
  (e: 'update:showApiKey', value: boolean): void
  (e: 'update:showApiKeyPopover', value: boolean): void
  (e: 'showSuccessToast'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const localApiKey = computed({
  get: () => props.localApiKey,
  set: (value) => emit('update:localApiKey', value),
})

const showApiKey = computed({
  get: () => props.showApiKey,
  set: (value) => emit('update:showApiKey', value),
})

const showApiKeyPopover = computed({
  get: () => props.showApiKeyPopover,
  set: (value) => emit('update:showApiKeyPopover', value),
})

/**
 * 保存 API 密钥并关闭弹窗
 */
const saveAndClosePopover = () => {
  saveApiKey(localApiKey.value)
  emit('showSuccessToast')
  showApiKeyPopover.value = false
}

const clearKey = () => {
  clearApiKey()
  localApiKey.value = ''
}

defineOptions({
  name: 'ApiKeySection',
})
</script>

<style scoped>
.settings-section-icon {
  background: linear-gradient(
    135deg,
    var(--settings-primary) 0%,
    var(--settings-primary-dark) 100%
  );
  color: white;
}
</style>
