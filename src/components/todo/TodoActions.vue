<template>
  <div class="actions">
    <!-- 生成建议待办事项按钮 -->
    <button class="generate-btn" :disabled="isGenerating" @click="$emit('generateSuggestions')">
      {{ isGenerating ? t('generating') : t('generateSuggestions') }}
    </button>
    <!-- AI优先级排序按钮 -->
    <button
      v-if="hasActiveTodos"
      class="sort-btn"
      :disabled="isSorting"
      @click="$emit('sortWithAI')"
    >
      <span>{{ t('aiPrioritySort') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  filter: string
  hasActiveTodos: boolean
  isGenerating: boolean
  isSorting: boolean
}

interface Emits {
  (e: 'generateSuggestions'): void
  (e: 'sortWithAI'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'TodoActions'
})
</script>

<style scoped>
.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 126, 103, 0.02) 100%);
  border-radius: calc(var(--border-radius) * 1.2);
  border: 1px solid rgba(255, 126, 103, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.generate-btn,
.sort-btn {
  padding: 0.8rem 1.4rem;
  font-size: 0.9rem;
  min-width: 140px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: calc(var(--border-radius) * 1.5);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin-bottom: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.generate-btn::before,
.sort-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.generate-btn:hover::before,
.sort-btn:hover::before {
  left: 100%;
}

.generate-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #26d0ce 0%, #2a9d8f 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(78, 205, 196, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.generate-btn:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sort-btn {
  background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%);
  color: #2d5a3d;
}

.sort-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7fcdcd 0%, #74c0fc 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(168, 230, 207, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
  color: #1a4a2e;
}

.sort-btn:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .actions {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .generate-btn,
  .sort-btn {
    padding: 0.7rem 1.2rem;
    font-size: 0.85rem;
    min-width: 120px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .generate-btn,
  .sort-btn {
    width: 100%;
    min-width: unset;
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
    height: 36px;
  }
}
</style>
