<template>
  <div class="w-full max-w-[900px] mx-auto flex flex-col gap-4 md:max-w-full">
    <div class="text-center mb-1">
      <h3 class="m-0 mb-1 text-xl md:text-[1.3rem] sm:text-[1.2rem] font-semibold text-text">
        {{ t('apiKeyConfiguration') }}
      </h3>
      <p
        class="m-0 text-[0.85rem] md:text-[0.9rem] sm:text-[0.85rem] text-text-secondary leading-[1.4]"
      >
        配置您的 OpenAI API 密钥以启用 AI 功能
      </p>
    </div>

    <ApiKeyCard :local-api-key="localApiKey" @show-popover="showApiKeyPopover = true" />

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

    <div
      v-if="showApiKeyPopover"
      class="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-1000 animate-[overlayIn_0.3s_ease]"
      @click="showApiKeyPopover = false"
    />
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
  set: value => emit('update:localApiKey', value)
})

const showApiKey = computed({
  get: () => props.showApiKey,
  set: value => emit('update:showApiKey', value)
})

const showApiKeyPopover = computed({
  get: () => props.showApiKeyPopover,
  set: value => emit('update:showApiKeyPopover', value)
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
  name: 'ApiKeySection'
})
</script>
