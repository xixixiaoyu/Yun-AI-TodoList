<template>
  <div v-if="show" class="charts-dialog" @click="$emit('close')">
    <div class="charts-content" @click.stop>
      <button class="close-btn" @click="$emit('close')" :aria-label="t('close')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <h2>{{ t('productivityInsights') }}</h2>

      <!-- 统一的完成趋势图表 -->
      <TodoCompletionChart />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TodoCompletionChart from './TodoCompletionChart.vue'

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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  width: 100%;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 126, 103, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(255, 126, 103, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.close-btn:hover {
  background: rgba(255, 126, 103, 0.2);
  border-color: rgba(255, 126, 103, 0.4);
  transform: translateY(-1px);
}

.close-btn svg {
  stroke: currentColor;
}

.charts-content h2 {
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  padding-right: 3rem; /* 为关闭按钮留出空间 */
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
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  .close-btn svg {
    width: 16px;
    height: 16px;
  }

  .charts-content h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    padding-right: 2.5rem;
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
    width: 28px;
    height: 28px;
    padding: 0.3rem;
  }

  .close-btn svg {
    width: 14px;
    height: 14px;
  }

  .charts-content h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    padding-right: 2rem;
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
