<template>
  <div class="form-section">
    <h4>{{ t('promptContent') }} *</h4>
    <textarea
      :value="newPromptContent"
      :placeholder="t('enterPromptContent')"
      class="content-textarea"
      rows="8"
      maxlength="10000"
      @input="$emit('update:newPromptContent', ($event.target as HTMLTextAreaElement).value)"
    />
    <div class="char-count">{{ newPromptContent.length }}/10000</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  newPromptContent: string
}

interface Emits {
  (e: 'update:newPromptContent', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'PromptContentForm'
})
</script>

<style scoped>
.form-section {
  margin-bottom: 1.5rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.content-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s ease;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary-color);
  margin-top: 0.25rem;
}
</style>
