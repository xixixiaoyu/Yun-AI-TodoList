<template>
  <div class="api-key-popover">
    <div class="popover-header">
      <div class="header-content">
        <div class="header-icon">
          <KeyIcon />
        </div>
        <div class="header-text">
          <h3>{{ t('settingsApiKey') }}</h3>
          <p>{{ t('secureConfigureApiKey') }}</p>
        </div>
      </div>
      <button class="close-button" @click="$emit('close')">
        <CloseIcon />
      </button>
    </div>

    <div class="popover-content">
      <!-- 安全信息 -->
      <div class="security-info">
        <div class="info-item">
          <CheckIcon />
          <span>{{ t('apiKeyStoredLocally') }}</span>
        </div>
        <div class="info-item">
          <LockIcon />
          <span>{{ t('noUploadToServer') }}</span>
        </div>
      </div>

      <!-- API Key 输入 -->
      <div class="input-section">
        <div class="input-group">
          <input
            :value="localApiKey"
            :type="showApiKey ? 'text' : 'password'"
            :placeholder="t('enterApiKey')"
            class="api-key-input"
            autocomplete="off"
            spellcheck="false"
            @input="$emit('update:localApiKey', ($event.target as HTMLInputElement).value)"
          />
          <button class="toggle-button" @click="toggleShowApiKey">
            <EyeOffIcon v-if="showApiKey" />
            <EyeIcon v-else />
          </button>
        </div>
        <div class="input-hint">
          {{ t('getApiKeyVisitConsole') }}
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            DeepSeek Console
          </a>
        </div>
      </div>

      <!-- 保存按钮 -->
      <button class="save-button" :disabled="!localApiKey.trim()" @click="$emit('save')">
        <CheckIcon />
        {{ t('save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KeyIcon from '../../common/icons/KeyIcon.vue'
import CloseIcon from '../../common/icons/CloseIcon.vue'
import CheckIcon from '../../common/icons/CheckIcon.vue'
import LockIcon from '../../common/icons/LockIcon.vue'
import EyeIcon from '../../common/icons/EyeIcon.vue'
import EyeOffIcon from '../../common/icons/EyeOffIcon.vue'

interface Props {
  localApiKey: string
  showApiKey: boolean
}

interface Emits {
  (e: 'update:localApiKey', value: string): void
  (e: 'update:showApiKey', value: boolean): void
  (e: 'close'): void
  (e: 'save'): void
  (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const toggleShowApiKey = () => {
  emit('update:showApiKey', !props.showApiKey)
}

defineOptions({
  name: 'ApiKeyPopover',
})
</script>

<style scoped>
.api-key-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 2rem));
  background: var(--card-bg-color);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 9999;
  animation: popoverIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.popover-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--button-bg-color), var(--button-hover-bg-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-text h3 {
  margin: 0 0 0.125rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

.header-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  line-height: 1.3;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: rgba(var(--text-color-rgb), 0.1);
  color: var(--text-color);
}

.popover-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(var(--button-bg-color-rgb), 0.03);
  border-radius: 12px;
  border: 1px solid rgba(var(--border-color-rgb), 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
}

.info-item :deep(svg) {
  color: var(--button-bg-color);
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.api-key-input {
  width: 100%;
  padding: 0.875rem 1rem;
  padding-right: 3rem;
  border: 1.5px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 0.875rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  letter-spacing: 0.25px;
}

.api-key-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.1);
}

.api-key-input::placeholder {
  color: rgba(var(--text-color-rgb), 0.4);
  font-family: inherit;
}

.toggle-button {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.5));
  padding: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-button:hover {
  color: var(--button-bg-color);
  background-color: rgba(var(--button-bg-color-rgb), 0.1);
}

.input-hint {
  font-size: 0.8125rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  line-height: 1.4;
}

.input-hint a {
  color: var(--button-bg-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.input-hint a:hover {
  color: var(--button-hover-bg-color);
  text-decoration: underline;
}

.save-button {
  width: 100%;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  background: var(--button-bg-color);
  color: white;
}

.save-button:hover:not(:disabled) {
  background: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

@keyframes popoverIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@media (max-width: 640px) {
  .api-key-popover {
    width: calc(100vw - 1rem);
    border-radius: 16px;
  }

  .popover-header {
    padding: 1.25rem 1.25rem 0;
  }

  .popover-content {
    padding: 1.25rem;
    gap: 1.25rem;
  }
}
</style>
