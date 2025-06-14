<template>
  <div class="enhanced-prompt-selector">
    <!-- 模板选择器 -->
    <div class="template-selector-section">
      <label class="selector-label">{{ t('systemPrompt') }}</label>
      <div class="selector-wrapper">
        <select
          :value="selectedTemplate"
          @change="handleTemplateChange"
          class="template-select"
        >
          <!-- 内置模板 -->
          <optgroup :label="t('builtinPrompts')">
            <option value="none">{{ t('nonePrompt') }}</option>
            <option value="my">{{ t('defaultPrompt') }}</option>
            <option value="coding">{{ t('categoryCoding') }}</option>
            <option value="writing">{{ t('categoryWriting') }}</option>
            <option value="analysis">{{ t('categoryAnalysis') }}</option>
          </optgroup>

          <!-- 自定义模板 -->
          <optgroup v-if="filteredCustomPrompts.length > 0" :label="t('customPrompts')">
            <option
              v-for="prompt in filteredCustomPrompts"
              :key="prompt.id"
              :value="prompt.id"
              :disabled="!prompt.isActive"
            >
              {{ prompt.name }}
              <span v-if="prompt.isFavorite">⭐</span>
              <span v-if="!prompt.isActive">({{ t('promptInactive') }})</span>
            </option>
          </optgroup>
        </select>

        <!-- 操作按钮 -->
        <div class="selector-actions">
          <button
            v-if="isCustomPrompt"
            @click="$emit('duplicatePrompt')"
            class="action-btn duplicate-btn"
            :title="t('duplicatePrompt')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"
              />
            </svg>
          </button>

          <button
            v-if="isCustomPrompt"
            @click="toggleFavorite"
            class="action-btn favorite-btn"
            :class="{ active: currentPrompt?.isFavorite }"
            :title="
              currentPrompt?.isFavorite ? t('promptUnfavorite') : t('promptFavorite')
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          </button>

          <button
            v-if="isCustomPrompt"
            @click="$emit('confirmDeletePrompt')"
            class="action-btn delete-btn"
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
                d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"
              />
            </svg>
          </button>

          <button
            @click="$emit('showAddPrompt')"
            class="action-btn add-btn"
            :title="t('addNewPrompt')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 提示词信息显示 -->
    <div v-if="currentPrompt || isBuiltinPrompt" class="prompt-info">
      <div class="info-header">
        <h4 class="prompt-name">
          {{ currentPromptName }}
          <span v-if="currentPrompt?.isFavorite" class="favorite-star">⭐</span>
        </h4>
        <div class="prompt-meta">
          <span v-if="currentPrompt" class="usage-count">
            {{ t('promptUsageCount') }}: {{ currentPrompt.usageCount }}
          </span>
          <span
            v-if="currentPrompt"
            class="category-badge"
            :class="`category-${currentPrompt.category}`"
          >
            {{ getCategoryLabel(currentPrompt.category) }}
          </span>
          <span
            v-if="currentPrompt"
            class="priority-badge"
            :class="`priority-${currentPrompt.priority}`"
          >
            {{ getPriorityLabel(currentPrompt.priority) }}
          </span>
        </div>
      </div>

      <p v-if="currentPromptDescription" class="prompt-description">
        {{ currentPromptDescription }}
      </p>

      <div
        v-if="currentPrompt?.tags && currentPrompt.tags.length > 0"
        class="prompt-tags"
      >
        <span v-for="tag in currentPrompt.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomPrompt, PromptTemplate } from '../../types/settings'
import { PromptCategory, PromptPriority } from '../../types/settings'
import { builtinPromptTemplates } from '../../config/prompts'

interface Props {
  selectedTemplate: PromptTemplate
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'update:selectedTemplate', value: PromptTemplate): void
  (e: 'templateChange'): void
  (e: 'duplicatePrompt'): void
  (e: 'toggleFavorite', promptId: string): void
  (e: 'confirmDeletePrompt'): void
  (e: 'showAddPrompt'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 计算属性
const filteredCustomPrompts = computed(() => {
  return props.customPrompts.filter((prompt) => prompt.isActive)
})

const isCustomPrompt = computed(() => {
  return props.selectedTemplate.startsWith('custom_')
})

const isBuiltinPrompt = computed(() => {
  return !!builtinPromptTemplates[props.selectedTemplate]
})

const currentPrompt = computed(() => {
  return props.customPrompts.find((p) => p.id === props.selectedTemplate)
})

const currentPromptName = computed(() => {
  if (isBuiltinPrompt.value) {
    return builtinPromptTemplates[props.selectedTemplate]?.name || ''
  }
  return currentPrompt.value?.name || ''
})

const currentPromptDescription = computed(() => {
  if (isBuiltinPrompt.value) {
    return builtinPromptTemplates[props.selectedTemplate]?.description || ''
  }
  return currentPrompt.value?.description || ''
})

// 方法
const handleTemplateChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newTemplate = target.value as PromptTemplate
  emit('update:selectedTemplate', newTemplate)
  emit('templateChange')
}

const toggleFavorite = () => {
  if (currentPrompt.value) {
    emit('toggleFavorite', currentPrompt.value.id)
  }
}

const getCategoryLabel = (category: PromptCategory) => {
  const categoryMap = {
    [PromptCategory.GENERAL]: t('categoryGeneral'),
    [PromptCategory.CODING]: t('categoryCoding'),
    [PromptCategory.WRITING]: t('categoryWriting'),
    [PromptCategory.ANALYSIS]: t('categoryAnalysis'),
    [PromptCategory.CREATIVE]: t('categoryCreative'),
    [PromptCategory.BUSINESS]: t('categoryBusiness'),
    [PromptCategory.EDUCATION]: t('categoryEducation'),
    [PromptCategory.CUSTOM]: t('categoryCustom'),
  }
  return categoryMap[category] || category
}

const getPriorityLabel = (priority: PromptPriority) => {
  const priorityMap = {
    [PromptPriority.HIGH]: t('priorityHigh'),
    [PromptPriority.MEDIUM]: t('priorityMedium'),
    [PromptPriority.LOW]: t('priorityLow'),
  }
  return priorityMap[priority] || priority
}

defineOptions({
  name: 'EnhancedPromptTemplateSelector',
})
</script>

<style scoped>
.enhanced-prompt-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-selector-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selector-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.template-select {
  flex: 1;
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

.template-select:hover {
  border-color: var(--button-bg-color);
}

.template-select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.selector-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: var(--input-bg-color);
  color: var(--text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--button-bg-color);
  color: white;
}

.favorite-btn.active {
  background-color: #fbbf24;
  color: white;
}

.delete-btn:hover {
  background-color: #ef4444;
}

.add-btn:hover {
  background-color: #10b981;
}

.prompt-info {
  padding: 1rem;
  background-color: var(--input-bg-color);
  border-radius: 8px;
  border: 1px solid var(--input-border-color);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.prompt-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.favorite-star {
  color: #fbbf24;
}

.prompt-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.usage-count {
  font-size: 0.8rem;
  color: var(--text-secondary-color);
}

.category-badge,
.priority-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.category-badge {
  background-color: var(--button-bg-color);
  color: white;
}

.priority-high {
  background-color: #ef4444;
  color: white;
}

.priority-medium {
  background-color: #f59e0b;
  color: white;
}

.priority-low {
  background-color: #10b981;
  color: white;
}

.prompt-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary-color);
  line-height: 1.5;
}

.prompt-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.tag {
  padding: 0.2rem 0.5rem;
  background-color: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary-color);
}

@media (max-width: 768px) {
  .selector-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .template-select {
    min-width: unset;
  }

  .selector-actions {
    justify-content: center;
  }

  .info-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .prompt-meta {
    justify-content: flex-start;
  }
}
</style>
