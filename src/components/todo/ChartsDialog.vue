<template>
  <div v-if="show" class="charts-dialog" @click="$emit('close')">
    <div class="charts-content" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        {{ t('close') }}
      </button>
      <h2>{{ t('todoCharts') }}</h2>

      <!-- 待办事项统计组件 -->
      <TodoStats />

      <!-- 番茄钟统计组件 -->
      <PomodoroStats />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TodoStats from '../TodoStats.vue'
import PomodoroStats from '../PomodoroStats.vue'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ChartsDialog',
})
</script>

<style scoped>
.charts-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.charts-content {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-1px);
}

.charts-content h2 {
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  padding-right: 5rem; /* 为关闭按钮留出空间 */
}

.charts-content > :deep(.todo-stats),
.charts-content > :deep(.pomodoro-stats) {
  margin-bottom: 2rem;
}

.charts-content > :deep(.todo-stats:last-child),
.charts-content > :deep(.pomodoro-stats:last-child) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .charts-dialog {
    padding: 0.5rem;
  }

  .charts-content {
    padding: 1.5rem;
    max-width: 100%;
    max-height: 100%;
    border-radius: 12px;
  }

  .close-btn {
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .charts-content h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    padding-right: 4rem;
  }

  .charts-content > :deep(.todo-stats),
  .charts-content > :deep(.pomodoro-stats) {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .charts-content {
    padding: 1rem;
    border-radius: 8px;
  }

  .close-btn {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  .charts-content h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    padding-right: 3rem;
  }

  .charts-content > :deep(.todo-stats),
  .charts-content > :deep(.pomodoro-stats) {
    margin-bottom: 1rem;
  }
}

/* 滚动条样式 */
.charts-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 154, 139, 0.6) rgba(0, 0, 0, 0.05);
}

.charts-content::-webkit-scrollbar {
  width: 6px;
}

.charts-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.charts-content::-webkit-scrollbar-thumb {
  background: rgba(255, 154, 139, 0.6);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.charts-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 140, 127, 0.8);
}

/* 深色主题下的滚动条样式 */
@media (prefers-color-scheme: dark) {
  .charts-content {
    scrollbar-color: rgba(255, 154, 139, 0.7) rgba(255, 255, 255, 0.1);
  }

  .charts-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .charts-content::-webkit-scrollbar-thumb {
    background: rgba(255, 154, 139, 0.7);
  }

  .charts-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 140, 127, 0.9);
  }
}
</style>
