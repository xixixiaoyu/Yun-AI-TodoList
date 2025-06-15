<template>
  <div class="form-section">
    <h4>{{ t('basicInfo') }}</h4>
    <div class="form-row">
      <div class="input-group">
        <label>{{ t('enterPromptName') }} *</label>
        <input
          :value="newPromptName"
          type="text"
          :placeholder="t('enterPromptName')"
          class="form-input"
          maxlength="50"
          @input="$emit('update:newPromptName', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="input-group">
        <label>{{ t('promptDescription') }}</label>
        <input
          :value="newPromptDescription"
          type="text"
          :placeholder="t('enterPromptDescription')"
          class="form-input"
          maxlength="100"
          @input="$emit('update:newPromptDescription', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="input-group">
        <label>{{ t('promptCategory') }}</label>
        <select
          :value="newPromptCategory"
          class="form-select"
          @change="
            $emit(
              'update:newPromptCategory',
              ($event.target as HTMLSelectElement).value as PromptCategory
            )
          "
        >
          <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
            {{ category.label }}
          </option>
        </select>
      </div>
      <div class="input-group">
        <label>{{ t('promptPriority') }}</label>
        <select
          :value="newPromptPriority"
          class="form-select"
          @change="
            $emit(
              'update:newPromptPriority',
              ($event.target as HTMLSelectElement).value as PromptPriority
            )
          "
        >
          <option v-for="priority in priorityOptions" :key="priority.value" :value="priority.value">
            {{ priority.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="input-group">
      <label>{{ t('promptTags') }}</label>
      <PromptTagsInput :tags="newPromptTags" @update:tags="$emit('update:newPromptTags', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PromptCategory, PromptPriority } from '../../../types/settings'
import PromptTagsInput from './PromptTagsInput.vue'

interface Props {
  newPromptName: string
  newPromptDescription: string
  newPromptCategory: PromptCategory
  newPromptPriority: PromptPriority
  newPromptTags: string[]
}

interface Emits {
  (e: 'update:newPromptName', value: string): void
  (e: 'update:newPromptDescription', value: string): void
  (e: 'update:newPromptCategory', value: PromptCategory): void
  (e: 'update:newPromptPriority', value: PromptPriority): void
  (e: 'update:newPromptTags', value: string[]): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

const categoryOptions = computed(() => [
  { value: PromptCategory.GENERAL, label: t('categoryGeneral') },
  { value: PromptCategory.CODING, label: t('categoryCoding') },
  { value: PromptCategory.WRITING, label: t('categoryWriting') },
  { value: PromptCategory.ANALYSIS, label: t('categoryAnalysis') },
  { value: PromptCategory.CREATIVE, label: t('categoryCreative') },
  { value: PromptCategory.BUSINESS, label: t('categoryBusiness') },
  { value: PromptCategory.EDUCATION, label: t('categoryEducation') },
  { value: PromptCategory.CUSTOM, label: t('categoryCustom') }
])

const priorityOptions = computed(() => [
  { value: PromptPriority.HIGH, label: t('priorityHigh') },
  { value: PromptPriority.MEDIUM, label: t('priorityMedium') },
  { value: PromptPriority.LOW, label: t('priorityLow') }
])

defineOptions({
  name: 'PromptBasicInfoForm'
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
