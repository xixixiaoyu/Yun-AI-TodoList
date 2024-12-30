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
          <div class="prompt-controls">
            <div class="prompt-template-selector">
              <select v-model="selectedPromptTemplate" @change="handleTemplateChange">
                <option value="my">{{ t('defaultPrompt') }}</option>
                <option value="study">{{ t('studyPrompt') }}</option>
                <option value="studentStudy">{{ t('studentStudyPrompt') }}</option>
                <optgroup :label="t('customPrompts')" v-if="customPrompts.length > 0">
                  <option
                    v-for="prompt in customPrompts"
                    :key="prompt.id"
                    :value="prompt.id"
                  >
                    {{ prompt.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="prompt-actions">
              <button
                v-if="selectedPromptTemplate.startsWith('custom_')"
                class="delete-prompt-button"
                @click.stop="confirmDeletePrompt"
                :title="t('deleteCustomPrompt')"
              >
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
                {{ t('deleteCustomPrompt') }}
              </button>
              <button class="add-prompt-button" @click="showAddPromptPopover = true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                {{ t('addPrompt') }}
              </button>
            </div>
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

    <div v-if="showAddPromptPopover" class="api-key-popover">
      <div class="popover-header">
        <h3>{{ t('addNewPrompt') }}</h3>
        <button class="close-button" @click="showAddPromptPopover = false">
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
          <label>{{ t('enterPromptName') }}</label>
          <input
            v-model="newPromptName"
            type="text"
            :placeholder="t('enterPromptName')"
            class="prompt-name-input"
          />
        </div>
        <div class="input-group">
          <label>{{ t('enterPromptContent') }}</label>
          <textarea
            v-model="newPromptContent"
            :placeholder="t('enterPromptContent')"
            class="prompt-content-input"
            rows="6"
          />
        </div>
        <div class="button-group">
          <button
            class="save-button"
            :disabled="!newPromptName || !newPromptContent"
            @click="saveNewPrompt"
          >
            {{ t('save') }}
          </button>
          <button class="clear-button" @click="showAddPromptPopover = false">
            {{ t('cancel') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showAddPromptPopover"
      class="popover-overlay"
      @click="showAddPromptPopover = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiKey, saveApiKey, clearApiKey } from '../services/configService'
import { promptsConfig } from '../config/prompts'

interface CustomPrompt {
  id: string
  name: string
  content: string
}

type PromptTemplate = 'my' | 'study' | 'studentStudy' | string

const { t } = useI18n()
const showApiKey = ref(false)
const showApiKeyPopover = ref(false)
const showAddPromptPopover = ref(false)
const localApiKey = ref('')
const localSystemPrompt = ref('')
const showSuccessMessage = ref(false)
const isFullscreen = ref(false)
const selectedPromptTemplate = ref<PromptTemplate>('my')
const newPromptName = ref('')
const newPromptContent = ref('')
const customPrompts = ref<CustomPrompt[]>([])

onMounted(() => {
  localApiKey.value = apiKey.value
  // 加载自定义提示词
  const savedCustomPrompts = localStorage.getItem('customPrompts')
  if (savedCustomPrompts) {
    customPrompts.value = JSON.parse(savedCustomPrompts)
  }

  // 从 localStorage 加载系统提示词和上次选择的模板
  const savedSystemPrompt = localStorage.getItem('systemPrompt')
  const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')

  if (lastSelectedTemplate) {
    selectedPromptTemplate.value = lastSelectedTemplate
    // 根据模板类型加载对应的内容
    if (
      lastSelectedTemplate === 'my' ||
      lastSelectedTemplate === 'study' ||
      lastSelectedTemplate === 'studentStudy'
    ) {
      // 如果是预设模板，直接使用配置内容
      localSystemPrompt.value = promptsConfig[lastSelectedTemplate].content
    } else {
      // 如果是自定义模板，从自定义提示词中查找
      const customPrompt = customPrompts.value.find((p) => p.id === lastSelectedTemplate)
      if (customPrompt) {
        localSystemPrompt.value = customPrompt.content
      } else if (savedSystemPrompt) {
        // 如果找不到自定义模板但有保存的内容，使用保存的内容
        localSystemPrompt.value = savedSystemPrompt
      }
    }
  } else {
    // 没有上次选择的模板，使用默认模板
    selectedPromptTemplate.value = 'my'
    localSystemPrompt.value = promptsConfig.my.content
  }
})

const handleTemplateChange = () => {
  const template = selectedPromptTemplate.value
  if (template === 'my' || template === 'study' || template === 'studentStudy') {
    localSystemPrompt.value = promptsConfig[template].content
  } else {
    const customPrompt = customPrompts.value.find((p) => p.id === template)
    if (customPrompt) {
      localSystemPrompt.value = customPrompt.content
    }
  }
  // 保存当前选择的模板
  localStorage.setItem('lastSelectedTemplate', template)
}

const saveNewPrompt = () => {
  const newPrompt: CustomPrompt = {
    id: `custom_${Date.now()}`,
    name: newPromptName.value,
    content: newPromptContent.value,
  }
  customPrompts.value.push(newPrompt)
  localStorage.setItem('customPrompts', JSON.stringify(customPrompts.value))
  selectedPromptTemplate.value = newPrompt.id
  localSystemPrompt.value = newPrompt.content
  showAddPromptPopover.value = false
  newPromptName.value = ''
  newPromptContent.value = ''
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
}

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
  // 如果当前不是自定义模板，保存时创建一个新的自定义模板
  if (!selectedPromptTemplate.value.startsWith('custom_')) {
    const newPrompt: CustomPrompt = {
      id: `custom_${Date.now()}`,
      name: t('customPrompt'),
      content: localSystemPrompt.value,
    }
    customPrompts.value.push(newPrompt)
    localStorage.setItem('customPrompts', JSON.stringify(customPrompts.value))
    selectedPromptTemplate.value = newPrompt.id
    // 保存当前选择的模板
    localStorage.setItem('lastSelectedTemplate', newPrompt.id)
  }
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
}

const resetSystemPrompt = () => {
  selectedPromptTemplate.value = 'my'
  localSystemPrompt.value = promptsConfig.my.content
  localStorage.removeItem('systemPrompt')
  localStorage.removeItem('lastSelectedTemplate')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const confirmDeletePrompt = () => {
  if (window.confirm(t('confirmDeletePrompt'))) {
    const updatedPrompts = customPrompts.value.filter(
      (p) => p.id !== selectedPromptTemplate.value
    )
    customPrompts.value = updatedPrompts
    localStorage.setItem('customPrompts', JSON.stringify(updatedPrompts))

    // Reset to default prompt after deletion
    selectedPromptTemplate.value = 'my'
    localSystemPrompt.value = promptsConfig.my.content
    localStorage.setItem('lastSelectedTemplate', 'my')

    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 2000)
  }
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
  max-height: 90vh;
  background-color: var(--card-bg-color);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: popoverIn 0.3s ease;
  display: flex;
  flex-direction: column;
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
  padding: 1.25rem;
  border-bottom: 1px solid var(--input-border-color);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popover-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
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
  margin: -0.5rem -0.5rem -0.5rem 0;
}

.close-button:hover {
  opacity: 1;
}

.popover-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prompt-name-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.prompt-content-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  min-height: 120px;
  max-height: 300px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.prompt-name-input:focus,
.prompt-content-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.button-group button {
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
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-header {
  width: 100%;
  max-width: 900px;
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
  max-width: 900px;
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
  max-width: 900px;
  display: flex;
  gap: 1.5rem;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1rem;
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
  .settings-container {
    padding: 1rem;
  }

  .settings-grid {
    gap: 1rem;
  }

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

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .prompt-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .prompt-template-selector {
    width: 100%;
  }

  .prompt-template-selector select {
    width: 100%;
    min-width: unset;
  }

  .prompt-actions {
    width: 100%;
    margin-right: 0;
    justify-content: space-between;
  }

  .add-prompt-button,
  .delete-prompt-button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .fullscreen-button {
    display: none !important;
  }

  .settings-section.fullscreen {
    position: relative;
    padding: 1rem;
    max-width: 100%;
  }

  .settings-section.fullscreen .section-header {
    margin-bottom: 1rem;
  }

  .settings-section.fullscreen .section-header h3 {
    font-size: 1rem;
  }

  .settings-section.fullscreen .system-prompt-input {
    max-width: 100%;
    font-size: 0.95rem;
  }

  .prompt-actions {
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .settings-container {
    padding: 0.75rem;
  }

  .api-key-info {
    padding: 0.875rem;
  }

  .configure-button {
    width: 100%;
    justify-content: center;
  }

  .api-key-popover {
    width: calc(100% - 1rem);
    max-width: none;
  }

  .popover-content {
    padding: 1rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .button-group button {
    width: 100%;
  }

  .toast-message {
    width: calc(100% - 2rem);
    white-space: normal;
    text-align: center;
    justify-content: center;
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

.prompt-template-selector select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  min-width: 200px;
}

.prompt-template-selector select:hover {
  border-color: var(--button-bg-color);
}

.prompt-template-selector select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.prompt-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prompt-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 3rem;
}

.add-prompt-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: auto;
  height: auto;
}

.add-prompt-button:hover {
  border-color: var(--button-bg-color);
  background-color: var(--button-bg-color);
  color: white;
}

.delete-prompt-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: auto;
  height: auto;
}

.delete-prompt-button:hover {
  border-color: #dc3545;
  background-color: #dc3545;
  color: white;
}

.prompt-name-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  margin-bottom: 1rem;
}

.prompt-content-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  min-height: 120px;
  max-height: 300px;
}

.prompt-name-input:focus,
.prompt-content-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

@media (max-height: 600px) {
  .api-key-popover {
    max-height: 95vh;
  }

  .prompt-content-input {
    min-height: 80px;
    max-height: 200px;
  }
}
</style>
