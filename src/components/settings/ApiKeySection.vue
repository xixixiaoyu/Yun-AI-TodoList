<template>
  <div class="api-key-section">
    <!-- 区域标题 -->
    <div class="section-header">
      <h3 class="section-title">{{ t('apiKeyConfiguration') }}</h3>
      <p class="section-description">配置您的 OpenAI API 密钥以启用 AI 功能</p>
    </div>

    <!-- API 密钥状态卡片 -->
    <div class="api-key-card" @click="showApiKeyPopover = true">
      <div class="card-content">
        <div class="status-section">
          <div class="status-indicator">
            <div
              class="status-icon"
              :class="{ configured: localApiKey, 'not-configured': !localApiKey }"
            ></div>
            <div class="status-text">
              <span class="status-label">{{
                localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured')
              }}</span>
              <span class="status-detail">{{
                localApiKey ? '密钥已安全保存' : '点击配置 API 密钥'
              }}</span>
            </div>
          </div>
        </div>
        <div class="action-section">
          <button class="configure-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
              />
            </svg>
            {{ localApiKey ? t('reconfigure') : t('configure') }}
          </button>
        </div>
      </div>
    </div>

    <!-- API 密钥配置弹窗 -->
    <div v-if="showApiKeyPopover" class="api-key-popover">
      <!-- 弹窗头部 -->
      <div class="popover-header">
        <div class="header-content">
          <div class="header-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3s3 1.34 3 3s-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1zm12.93-3.94l-3.99 4.99c-.14.17-.35.26-.56.26s-.42-.09-.56-.26l-2.24-2.8c-.31-.39-.25-.96.14-1.27c.39-.31.96-.25 1.27.14l1.68 2.1l3.43-4.29c.31-.39.88-.45 1.27-.14c.39.31.45.88.14 1.27z"
              />
            </svg>
          </div>
          <div class="header-text">
            <h3>{{ t('settingsApiKey') }}</h3>
            <p>安全配置您的 DeepSeek API 密钥</p>
          </div>
        </div>
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

      <!-- 弹窗内容 -->
      <div class="popover-content">
        <!-- 输入提示信息 -->
        <div class="input-info">
          <div class="info-item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            <span>密钥将安全存储在本地浏览器中</span>
          </div>
          <div class="info-item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"
              />
            </svg>
            <span>不会上传到任何服务器</span>
          </div>
        </div>

        <!-- API 密钥输入区域 -->
        <div class="input-section">
          <label class="input-label">DeepSeek API Key</label>
          <div class="input-group">
            <input
              v-model="localApiKey"
              :type="showApiKey ? 'text' : 'password'"
              :placeholder="t('enterApiKey')"
              class="api-key-input"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="toggle-button" @click="toggleShowApiKey">
              <svg
                v-if="showApiKey"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 7c2.76 0 5 2.24 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28l.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22L21 20.73L3.27 3L2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65c0 1.66 1.34 3 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53c-2.76 0-5-2.24-5-5c0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15l.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3s3-1.34 3-3s-1.34-3-3-3z"
                />
              </svg>
            </button>
          </div>
          <div class="input-hint">
            <span
              >获取 API Key：访问
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                >DeepSeek 控制台</a
              ></span
            >
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group">
          <button
            class="save-button"
            :disabled="!localApiKey.trim()"
            @click="saveAndClosePopover"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41z"
              />
            </svg>
            {{ t('save') }}
          </button>
          <button class="clear-button" :disabled="!localApiKey" @click="clearKey">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
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

.api-key-card {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  overflow: hidden;
}

.api-key-card:hover {
  transform: translateY(-4px);
  border-color: var(--button-bg-color);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.status-section {
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.status-detail {
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
}

.action-section {
  flex-shrink: 0;
}

.status-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.status-icon.configured {
  background: linear-gradient(135deg, #4caf50, #45a049);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.status-icon.configured::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, transparent 70%);
  animation: pulse 2s infinite;
}

.status-icon.not-configured {
  background: linear-gradient(135deg, #f44336, #e53935);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.status-icon.not-configured::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(244, 67, 54, 0.2) 0%, transparent 70%);
  animation: pulse 2s infinite;
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
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--button-bg-color),
    var(--button-hover-bg-color)
  );
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 3px 8px rgba(var(--button-bg-color-rgb), 0.3);
  position: relative;
  overflow: hidden;
}

.configure-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.configure-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--button-bg-color-rgb), 0.4);
}

.configure-button:hover::before {
  left: 100%;
}

.configure-button:active {
  transform: translateY(-1px);
}

.api-key-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 520px;
  background-color: var(--card-bg-color);
  border-radius: 24px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 1001;
  animation: popoverIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.popover-header {
  padding: 2rem 2rem 1rem 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(
    135deg,
    rgba(var(--button-bg-color-rgb), 0.05) 0%,
    rgba(var(--button-bg-color-rgb), 0.02) 100%
  );
  position: relative;
}

.popover-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 2rem;
  right: 2rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--border-color-rgb), 0.3) 50%,
    transparent 100%
  );
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    var(--button-bg-color),
    var(--button-hover-bg-color)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(var(--button-bg-color-rgb), 0.3);
  flex-shrink: 0;
}

.header-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
}

.header-text p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: rgba(var(--text-color-rgb), 0.1);
  opacity: 1;
  transform: scale(1.05);
}

.popover-content {
  padding: 1rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 输入提示信息样式 */
.input-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(var(--button-bg-color-rgb), 0.03) 0%,
    rgba(var(--button-bg-color-rgb), 0.01) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(var(--border-color-rgb), 0.2);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
}

.info-item svg {
  color: var(--button-bg-color);
  flex-shrink: 0;
}

/* 输入区域样式 */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.api-key-input {
  width: 100%;
  padding: 1rem 1.25rem;
  padding-right: 3.5rem;
  border: 2px solid var(--input-border-color);
  border-radius: 16px;
  font-size: 0.95rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
}

.api-key-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow:
    0 0 0 4px rgba(var(--button-bg-color-rgb), 0.1),
    0 2px 8px rgba(var(--button-bg-color-rgb), 0.15);
  transform: translateY(-1px);
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
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-button:hover {
  color: var(--button-bg-color);
  background-color: rgba(var(--button-bg-color-rgb), 0.1);
  transform: scale(1.05);
}

.input-hint {
  font-size: 0.85rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  line-height: 1.4;
}

.input-hint a {
  color: var(--button-bg-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.input-hint a:hover {
  color: var(--button-hover-bg-color);
  text-decoration: underline;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.save-button,
.clear-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.save-button {
  background: linear-gradient(
    135deg,
    var(--button-bg-color),
    var(--button-hover-bg-color)
  );
  color: white;
  box-shadow: 0 4px 16px rgba(var(--button-bg-color-rgb), 0.3);
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(var(--button-bg-color-rgb), 0.4);
}

.save-button:hover:not(:disabled)::before {
  left: 100%;
}

.clear-button {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
}

.clear-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.clear-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(220, 53, 69, 0.4);
}

.clear-button:hover:not(:disabled)::before {
  left: 100%;
}

.save-button:disabled,
.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.save-button:active:not(:disabled),
.clear-button:active:not(:disabled) {
  transform: translateY(-1px);
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

/* 动画效果 */
@keyframes popoverIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.9);
    filter: blur(10px);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -48%) scale(1.02);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    filter: blur(0);
  }
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

/* 响应式设计 */
@media (max-width: 768px) {
  .api-key-popover {
    width: calc(100% - 1rem);
    max-width: none;
    border-radius: 20px;
  }

  .popover-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }

  .header-content {
    gap: 0.75rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .header-text h3 {
    font-size: 1.2rem;
  }

  .header-text p {
    font-size: 0.85rem;
  }

  .popover-content {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    gap: 1.5rem;
  }

  .input-info {
    padding: 0.875rem;
  }

  .info-item {
    font-size: 0.85rem;
  }

  .api-key-input {
    padding: 0.875rem 1rem;
    padding-right: 3rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }

  .button-group {
    gap: 0.75rem;
  }

  .save-button,
  .clear-button {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .api-key-popover {
    width: calc(100% - 0.75rem);
    border-radius: 16px;
  }

  .popover-header {
    padding: 1.25rem 1.25rem 0.75rem 1.25rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .header-text h3 {
    font-size: 1.1rem;
  }

  .header-text p {
    font-size: 0.8rem;
  }

  .popover-content {
    padding: 0.75rem 1.25rem 1.25rem 1.25rem;
    gap: 1.25rem;
  }

  .input-info {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .info-item {
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .api-key-input {
    padding: 0.75rem 0.875rem;
    padding-right: 2.75rem;
    font-size: 0.85rem;
    border-radius: 10px;
  }

  .toggle-button {
    right: 0.5rem;
    padding: 0.375rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .save-button,
  .clear-button {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    border-radius: 10px;
  }

  .input-hint {
    font-size: 0.8rem;
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

  .card-content {
    padding: 1.5rem;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .status-indicator {
    justify-content: center;
  }

  .action-section {
    width: 100%;
  }

  .configure-button {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.2rem;
  }

  .section-description {
    font-size: 0.85rem;
  }

  .card-content {
    padding: 1.25rem;
    gap: 1.25rem;
  }

  .status-label {
    font-size: 1rem;
  }

  .status-detail {
    font-size: 0.85rem;
  }

  .configure-button {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
