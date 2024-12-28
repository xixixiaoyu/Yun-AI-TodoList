<template>
	<div class="settings-container">
		<h2>{{ t('settings') }}</h2>
		<div class="settings-section">
			<h3>{{ t('settingsApiKey') }}</h3>
			<div class="input-group">
				<input
					:type="showApiKey ? 'text' : 'password'"
					v-model="localApiKey"
					:placeholder="t('enterApiKey')"
					class="api-key-input"
				/>
				<button @click="toggleShowApiKey" class="toggle-button">
					{{ showApiKey ? t('hide') : t('show') }}
				</button>
			</div>
			<div class="button-group">
				<button @click="saveKey" class="save-button" :disabled="!localApiKey">
					{{ t('save') }}
				</button>
				<button @click="clearKey" class="clear-button" :disabled="!localApiKey">
					{{ t('clear') }}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiKey, saveApiKey, clearApiKey } from '../services/configService'

const { t } = useI18n()
const showApiKey = ref(false)
const localApiKey = ref('')

onMounted(() => {
	localApiKey.value = apiKey.value
})

const toggleShowApiKey = () => {
	showApiKey.value = !showApiKey.value
}

const saveKey = () => {
	saveApiKey(localApiKey.value)
}

const clearKey = () => {
	clearApiKey()
	localApiKey.value = ''
}
</script>

<style scoped>
.settings-container {
	padding: 20px;
	max-width: 600px;
	margin: 0 auto;
}

.settings-section {
	background-color: var(--card-bg-color);
	border-radius: 8px;
	padding: 20px;
	margin-top: 20px;
	box-shadow: var(--card-shadow);
}

h2 {
	color: var(--text-color);
	margin-bottom: 20px;
}

h3 {
	color: var(--text-color);
	margin-bottom: 15px;
}

.input-group {
	display: flex;
	gap: 10px;
	margin-bottom: 15px;
}

.api-key-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--input-border-color);
	border-radius: 4px;
	font-size: 14px;
	background-color: var(--input-bg-color);
	color: var(--text-color);
}

.button-group {
	display: flex;
	gap: 10px;
}

button {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	transition: all 0.3s ease;
}

button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.toggle-button {
	background-color: var(--language-toggle-bg);
	color: var(--language-toggle-color);
}

.save-button {
	background-color: var(--button-bg-color);
	color: white;
}

.clear-button {
	background-color: #f44336;
	color: white;
}

.toggle-button:hover:not(:disabled) {
	background-color: var(--language-toggle-hover-bg);
}

.save-button:hover:not(:disabled) {
	background-color: var(--button-hover-bg-color);
}

.clear-button:hover:not(:disabled) {
	background-color: #d32f2f;
}
</style>
