<template>
  <div class="api-key-section">
    <div class="api-key-info" @click="showApiKeyPopover = true">
      <div class="api-key-status">
        <div class="status-icon" :class="{ 'not-configured': !localApiKey }"></div>
        <span>{{ localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured') }}</span>
      </div>
      <button class="configure-button">
        {{ localApiKey ? t('reconfigure') : t('configure') }}
      </button>
    </div>

    <!-- API 密钥配置弹窗 -->
    <div v-if="showApiKeyPopover" class="api-key-popover">
      <div class="popover-header">
        <h3>{{ t('settingsApiKey') }}</h3>
        <button class="close-button" @click="showApiKeyPopover = false">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
      <div class="popover-content">
        <div class="input-group">
          <input
            v-model="localApiKey"
            :type="showApiKey ? 'text' : 'password'"
            :placeholder="t('enterApiKey')"
            class="api-key-input"
          />
          <button class="toggle-button" @click="toggleShowApiKey">
            {{ showApiKey ? t('hide') : t('show') }}
          </button>
        </div>
        <div class="button-group">
          <button
            class="save-button"
            :disabled="!localApiKey"
            @click="saveAndClosePopover"
          >
            {{ t('save') }}
          </button>
          <button class="clear-button" :disabled="!localApiKey" @click="clearKey">
            {{ t('clear') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="showApiKeyPopover"
      class="popover-overlay"
      @click="showApiKeyPopover = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { saveApiKey, clearApiKey } from '../../services/configService'

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
 * 切换 API 密钥显示状态
 */
const toggleShowApiKey = () => {
  showApiKey.value = !showApiKey.value
}

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
</script>

<script lang="ts">
import { computed } from 'vue'

export default {
  name: 'ApiKeySection',
}
</script>

<style scoped>
.api-key-section {
  width: 100%;
  margin: 0;
  margin-left: 1rem;
}

.api-key-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background-color: var(--card-bg-color);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.api-key-info:hover {
  transform: translateY(-2px);
  border-color: var(--button-bg-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.api-key-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 500;
  margin-right: 1rem;
}

.status-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4caf50;
  position: relative;
}

.status-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.2);
  animation: pulse 2s infinite;
}

.status-icon.not-configured {
  background-color: #f44336;
}

.status-icon.not-configured::after {
  background-color: rgba(244, 67, 54, 0.2);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.configure-button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  background-color: var(--button-bg-color);
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.configure-button:hover {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.configure-button:active {
  transform: translateY(0);
}

.api-key-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 480px;
  background-color: var(--card-bg-color);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: popoverIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.popover-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--card-bg-color);
}

.popover-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: var(--hover-bg-color);
}

.popover-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
}

.api-key-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 4rem;
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  height: 42px;
}

.api-key-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 2px rgba(var(--button-bg-color-rgb), 0.1);
}

.toggle-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--button-bg-color);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.toggle-button:hover {
  color: var(--button-hover-bg-color);
  background-color: rgba(var(--button-bg-color-rgb), 0.1);
}

.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.save-button,
.clear-button {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 42px;
  min-width: unset;
}

.save-button {
  background-color: var(--button-bg-color);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.clear-button {
  background-color: var(--danger-color, #dc3545);
  color: white;
}

.clear-button:hover:not(:disabled) {
  background-color: var(--danger-hover-color, #c82333);
  transform: translateY(-1px);
}

.save-button:disabled,
.clear-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .api-key-popover {
    width: calc(100% - 1rem);
    max-width: none;
    border-radius: 16px;
  }

  .popover-header {
    padding: 1rem 1.25rem;
  }

  .popover-header h3 {
    font-size: 1.1rem;
  }

  .popover-content {
    padding: 1.25rem;
    gap: 1rem;
  }

  .api-key-input {
    padding: 0.7rem 0.875rem;
    padding-right: 3.75rem;
    font-size: 0.9rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .save-button,
  .clear-button {
    padding: 0.7rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .api-key-section {
    margin-left: 1rem;
  }

  .api-key-info {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .api-key-status {
    margin-right: 0;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .api-key-info {
    padding: 0.875rem;
  }

  .configure-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
