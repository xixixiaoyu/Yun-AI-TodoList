<template>
  <div class="settings-container">
    <h2>{{ t('settings') }}</h2>
    <div class="settings-section">
      <h3>{{ t('settingsApiKey') }}</h3>
      <div class="input-group">
        <input
          v-model="localApiKey"
          :type="showApiKey ? 'text' : 'password'"
          :placeholder="t('enterApiKey')"
          class="api-key-input"
        >
        <button
          class="toggle-button"
          @click="toggleShowApiKey"
        >
          {{ showApiKey ? t('hide') : t('show') }}
        </button>
      </div>
      <div class="button-group">
        <button
          class="save-button"
          :disabled="!localApiKey"
          @click="saveKey"
        >
          {{ t('save') }}
        </button>
        <button
          class="clear-button"
          :disabled="!localApiKey"
          @click="clearKey"
        >
          {{ t('clear') }}
        </button>
      </div>
    </div>
    <transition name="toast">
      <div
        v-if="showSuccessMessage"
        class="toast-message"
      >
        <span class="toast-icon">✓</span>
        {{ t('settingsSaved') }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiKey, saveApiKey, clearApiKey } from '../services/configService'

const { t } = useI18n()
const showApiKey = ref(false)
const localApiKey = ref('')
const showSuccessMessage = ref(false)

onMounted(() => {
	localApiKey.value = apiKey.value
})

const toggleShowApiKey = () => {
	showApiKey.value = !showApiKey.value
}

const saveKey = () => {
	saveApiKey(localApiKey.value)
	showSuccessMessage.value = true
	setTimeout(() => {
		showSuccessMessage.value = false
	}, 2000)
}

const clearKey = () => {
	clearApiKey()
	localApiKey.value = ''
}

defineOptions({
	name: 'AppSettings',
})
</script>

<style scoped>
.settings-container {
	padding: 3rem;
	max-width: 1000px;
	margin: 0 auto;
}

.settings-section {
	background-color: var(--card-bg-color);
	border-radius: 16px;
	padding: 2.5rem;
	margin-top: 2rem;
	box-shadow: var(--card-shadow);
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease;
}

.settings-section:hover {
	transform: translateY(-3px);
	box-shadow:
		var(--card-shadow),
		0 12px 24px rgba(0, 0, 0, 0.12);
}

h2 {
	color: var(--text-color);
	margin-bottom: 2rem;
	font-size: 1.8rem;
	font-weight: 600;
}

h3 {
	color: var(--text-color);
	margin-bottom: 1.5rem;
	font-size: 1.2rem;
	font-weight: 500;
}

.input-group {
	display: flex;
	gap: 1.5rem;
	margin-bottom: 2rem;
	max-width: 900px;
}

.api-key-input {
	flex: 1;
	padding: 0.75rem 1.25rem;
	border: 2px solid var(--input-border-color);
	border-radius: 12px;
	font-size: 0.95rem;
	background-color: var(--input-bg-color);
	color: var(--text-color);
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;
}

.api-key-input:focus {
	outline: none;
	border-color: var(--button-bg-color);
	box-shadow: 0 0 0 4px rgba(var(--button-bg-color-rgb), 0.2);
}

.button-group {
	display: flex;
	gap: 1.5rem;
}

button {
	padding: 0.75rem 1.25rem;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-size: 0.95rem;
	font-weight: 600;
	transition: all 0.2s ease;
}

button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none !important;
}

.toggle-button {
	background-color: var(--language-toggle-bg);
	color: var(--language-toggle-color);
	min-width: 100px;
}

.save-button {
	background-color: var(--button-bg-color);
	color: white;
	min-width: 120px;
}

.clear-button {
	background-color: #f44336;
	color: white;
	min-width: 120px;
}

.toggle-button:hover:not(:disabled) {
	background-color: var(--language-toggle-hover-bg);
	transform: translateY(-1px);
}

.save-button:hover:not(:disabled) {
	background-color: var(--button-hover-bg-color);
	transform: translateY(-1px);
}

.clear-button:hover:not(:disabled) {
	background-color: #d32f2f;
	transform: translateY(-1px);
}

button:active:not(:disabled) {
	transform: translateY(1px);
}

.toast-message {
	position: fixed;
	top: 2rem;
	right: 2rem;
	padding: 1rem 1.5rem;
	background-color: #4caf50;
	color: white;
	border-radius: 8px;
	font-size: 0.95rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 1000;
}

.toast-icon {
	font-size: 1.1rem;
	font-weight: bold;
}

.toast-enter-active,
.toast-leave-active {
	transition: all 0.3s ease;
}

.toast-enter-from {
	opacity: 0;
	transform: translateX(30px);
}

.toast-leave-to {
	opacity: 0;
	transform: translateX(30px);
}
</style>
