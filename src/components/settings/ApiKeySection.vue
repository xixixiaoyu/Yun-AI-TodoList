<template>
  <div class="api-key-section">
    <!-- 区域标题 -->
    <div class="section-header">
      <h3 class="section-title">{{ t('apiKeyConfiguration') }}</h3>
      <p class="section-description">配置您的 OpenAI API 密钥以启用 AI 功能</p>
    </div>

    <!-- API 密钥状态卡片 -->
    <ApiKeyCard :local-api-key="localApiKey" @show-popover="showApiKeyPopover = true" />

    <!-- API 密钥配置弹窗 -->
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

    <!-- 遮罩层 -->
    <div v-if="showApiKeyPopover" class="popover-overlay" @click="showApiKeyPopover = false" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveApiKey, clearApiKey } from '../../services/configService'
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

// 计算属性和方法
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

/**
 * 清除 API 密钥
 */
const clearKey = () => {
  clearApiKey()
  localApiKey.value = ''
}

defineOptions({
  name: 'ApiKeySection'
})
</script>

<style scoped>
.api-key-section {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  text-align: center;
  margin-bottom: 0.25rem;
}

.section-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.section-description {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
  line-height: 1.4;
}

.popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: overlayIn 0.3s ease;
}

@keyframes overlayIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

@media (max-width: 768px) {
  .api-key-section {
    max-width: 100%;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .section-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.2rem;
  }

  .section-description {
    font-size: 0.85rem;
  }
}
</style>
