<template>
  <div class="input-section">
    <label class="input-label">DeepSeek API Key</label>
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
      <button class="toggle-button" @click="$emit('toggleShowApiKey')">
        <EyeOffIcon v-if="showApiKey" />
        <EyeIcon v-else />
      </button>
    </div>
    <div class="input-hint">
      <span>
        {{ t('getApiKeyVisitConsole') }}
        <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
          DeepSeek Console
        </a>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import EyeIcon from '../../common/icons/EyeIcon.vue'
import EyeOffIcon from '../../common/icons/EyeOffIcon.vue'

interface Props {
  localApiKey: string
  showApiKey: boolean
}

interface Emits {
  (e: 'update:localApiKey', value: string): void
  (e: 'toggleShowApiKey'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyInputSection',
})
</script>

<style scoped>
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

@media (max-width: 768px) {
  .api-key-input {
    padding: 0.875rem 1rem;
    padding-right: 3rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
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

  .input-hint {
    font-size: 0.8rem;
  }
}
</style>
