<template>
  <div class="section-header">
    <div class="header-content">
      <h3 class="section-title">{{ t('systemPrompt') }}</h3>
      <p class="section-description">自定义 AI 助手的行为和回复风格</p>
    </div>
    <div class="header-actions">
      <button
        class="fullscreen-button"
        :title="isFullscreen ? t('exitFullscreen') : t('enterFullscreen')"
        @click="$emit('toggleFullscreen')"
      >
        <ExpandIcon v-if="!isFullscreen" />
        <CompressIcon v-else />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ExpandIcon from '../common/icons/ExpandIcon.vue'
import CompressIcon from '../common/icons/CompressIcon.vue'

interface Props {
  isFullscreen: boolean
}

interface Emits {
  (e: 'toggleFullscreen'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'SystemPromptHeader'
})
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-content {
  flex: 1;
}

.section-title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.section-description {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
  line-height: 1.5;
}

.header-actions {
  flex-shrink: 0;
}

.fullscreen-button {
  background: none;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--input-bg-color);
}

.fullscreen-button:hover {
  border-color: var(--button-bg-color);
  background-color: var(--button-bg-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--button-bg-color-rgb), 0.3);
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .section-title {
    font-size: 1rem;
  }

  .section-description {
    font-size: 0.75rem;
  }

  .fullscreen-button {
    align-self: flex-end;
  }
}
</style>
