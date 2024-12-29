<template>
  <div class="settings-container">
    <h2>{{ t('settings') }}</h2>
    <div class="settings-grid">
      <div class="api-key-section">
        <div class="api-key-info" @click="showApiKeyPopover = true">
          <div class="api-key-status">
            <div class="status-icon" :class="{ 'not-configured': !localApiKey }"></div>
            <span>{{
              localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured')
            }}</span>
          </div>
          <button class="configure-button">
            {{ localApiKey ? t('reconfigure') : t('configure') }}
          </button>
        </div>

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
      </div>

      <div class="settings-section" :class="{ fullscreen: isFullscreen }">
        <div class="section-header">
          <h3>{{ t('systemPrompt') }}</h3>
          <button class="fullscreen-button" @click="toggleFullscreen">
            <svg
              v-if="!isFullscreen"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
              />
            </svg>
          </button>
        </div>
        <textarea
          v-model="localSystemPrompt"
          :placeholder="t('enterSystemPrompt')"
          class="system-prompt-input"
          rows="10"
        />
        <div class="button-group">
          <button
            class="save-button"
            :disabled="!localSystemPrompt"
            @click="saveSystemPrompt"
          >
            {{ t('save') }}
          </button>
          <button class="reset-button" @click="resetSystemPrompt">
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="showSuccessMessage" class="toast-message">
        <span class="toast-icon">✓</span>
        {{ t('settingsSaved') }}
      </div>
    </transition>

    <div
      v-if="showApiKeyPopover"
      class="popover-overlay"
      @click="showApiKeyPopover = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiKey, saveApiKey, clearApiKey } from '../services/configService'
import { promptsConfig } from '../config/prompts'

const { t } = useI18n()
const showApiKey = ref(false)
const showApiKeyPopover = ref(false)
const localApiKey = ref('')
const localSystemPrompt = ref('')
const showSuccessMessage = ref(false)
const isFullscreen = ref(false)

onMounted(() => {
  localApiKey.value = apiKey.value
  // 从 localStorage 加载系统提示词，如果没有则使用默认值
  const savedSystemPrompt = localStorage.getItem('systemPrompt')
  localSystemPrompt.value = savedSystemPrompt || promptsConfig.my.content
})

const toggleShowApiKey = () => {
  showApiKey.value = !showApiKey.value
}

const saveAndClosePopover = () => {
  saveApiKey(localApiKey.value)
  showSuccessMessage.value = true
  showApiKeyPopover.value = false
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
}

const clearKey = () => {
  clearApiKey()
  localApiKey.value = ''
}

const saveSystemPrompt = () => {
  localStorage.setItem('systemPrompt', localSystemPrompt.value)
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
}

const resetSystemPrompt = () => {
  localSystemPrompt.value = promptsConfig.my.content
  localStorage.removeItem('systemPrompt')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

defineOptions({
  name: 'AppSettings',
})
</script>

<style scoped>
.settings-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
  gap: 2rem;
  width: 100%;
  align-items: start;
}

.api-key-section {
  width: 100%;
  margin: 0;
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
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: popoverIn 0.3s ease;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid var(--input-border-color);
}

.popover-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.7;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  opacity: 1;
}

.popover-content {
  padding: 1.5rem;
}

.input-group {
  position: relative;
  margin-bottom: 1rem;
  width: 100%;
}

.api-key-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  padding-right: 5rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  box-sizing: border-box;
  line-height: 1.5;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.api-key-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow:
    0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toggle-button {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  height: calc(100% - 4px);
  border-radius: 0 10px 10px 0;
  min-width: auto;
  width: 4rem;
  padding: 0;
  background: none;
  border-left: 2px solid var(--input-border-color);
  color: var(--text-color);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: none;
  user-select: none;
}

.toggle-button:hover {
  background-color: var(--input-border-color);
}

.toggle-button:active {
  background-color: var(--input-border-color);
}

.popover-content .button-group {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.popover-content .button-group button {
  min-width: 5rem;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  border-radius: 8px;
  flex: 0 0 auto;
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
  }
  to {
    opacity: 1;
  }
}

.settings-section {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: var(--card-shadow);
  width: 100%;
  min-width: 200px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.settings-section:hover:not(.fullscreen) {
  transform: translateY(-2px);
  border-color: var(--button-bg-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.section-header {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin-bottom: 1.5rem;
  padding: 0;
}

.section-header h3 {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  color: var(--text-color);
}

.system-prompt-input {
  width: 100%;
  max-width: 800px;
  padding: 1rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 200px;
  max-height: 500px;
  font-family: inherit;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.system-prompt-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow:
    0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.button-group {
  width: 100%;
  max-width: 800px;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;
  margin-top: 0;
}

.settings-section.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  z-index: 1000;
  border-radius: 0;
  padding: 2rem;
  border: none;
  transform: none !important;
}

.settings-section.fullscreen:hover {
  box-shadow: none;
}

.settings-section.fullscreen .section-header {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto 2rem auto;
}

.settings-section.fullscreen .section-header h3 {
  font-size: 1.5rem;
}

.settings-section.fullscreen .system-prompt-input {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  max-height: none;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .settings-section {
    padding: 1rem;
  }

  .section-header h3 {
    font-size: 0.95rem;
  }

  .system-prompt-input {
    min-height: 180px;
    padding: 0.875rem;
    font-size: 0.9rem;
  }

  .button-group {
    flex-wrap: wrap;
  }

  .button-group button {
    flex: 1;
    min-width: 100px;
    padding: 0.6rem 1rem;
  }
}

@media (max-width: 480px) {
  .settings-section {
    padding: 0.875rem;
  }

  .section-header h3 {
    font-size: 0.9rem;
  }

  .system-prompt-input {
    min-height: 150px;
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 42px;
  min-width: 120px;
  white-space: nowrap;
  user-select: none;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.save-button {
  background-color: var(--button-bg-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clear-button,
.reset-button {
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clear-button:hover:not(:disabled),
.reset-button:hover:not(:disabled) {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.clear-button:active:not(:disabled),
.reset-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toast-message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.875rem 1.5rem;
  background-color: var(--button-bg-color);
  color: white;
  border-radius: 12px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  white-space: nowrap;
}

.toast-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 1rem);
}

.fullscreen-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  margin-top: -0.3rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.7;
  transition: all 0.2s ease;
  min-width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-button:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}
</style>
