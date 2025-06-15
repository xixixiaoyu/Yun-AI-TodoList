<template>
  <div class="prompt-info">
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

    <div v-if="currentPrompt?.tags && currentPrompt.tags.length > 0" class="prompt-tags">
      <span v-for="tag in currentPrompt.tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomPrompt } from '../../../types/settings'
import { PromptCategory, PromptPriority } from '../../../types/settings'

interface Props {
  currentPrompt?: CustomPrompt | null
  currentPromptName: string
  currentPromptDescription: string
  isBuiltinPrompt: boolean
}

defineProps<Props>()

const { t } = useI18n()

/**
 * 获取分类标签
 */
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

/**
 * 获取优先级标签
 */
const getPriorityLabel = (priority: PromptPriority) => {
  const priorityMap = {
    [PromptPriority.HIGH]: t('priorityHigh'),
    [PromptPriority.MEDIUM]: t('priorityMedium'),
    [PromptPriority.LOW]: t('priorityLow'),
  }
  return priorityMap[priority] || priority
}

defineOptions({
  name: 'PromptInfoDisplay',
})
</script>

<style scoped>
.prompt-info {
  padding: 0.75rem;
  background-color: var(--input-bg-color);
  border-radius: 6px;
  border: 1px solid var(--input-border-color);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.375rem;
}

.prompt-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.375rem;
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
  margin: 0.375rem 0 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary-color);
  line-height: 1.4;
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

/* 针对小屏幕高度的优化 */
@media (max-height: 800px) {
  .prompt-info {
    padding: 0.5rem;
  }

  .info-header {
    margin-bottom: 0.25rem;
  }

  .prompt-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
  }
}

@media (max-height: 700px) {
  .prompt-info {
    display: none; /* 在极小高度下隐藏详细信息 */
  }
}

@media (max-width: 768px) {
  .info-header {
    flex-direction: column;
    gap: 0.375rem;
  }

  .prompt-meta {
    justify-content: flex-start;
  }
}
</style>
