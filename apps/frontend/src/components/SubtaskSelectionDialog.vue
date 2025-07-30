<template>
  <Transition name="dialog-fade">
    <div v-if="config.showDialog" class="dialog-overlay">
      <!-- 背景遮罩 -->
      <div class="dialog-backdrop" @click="handleCancel"></div>

      <!-- 对话框内容 -->
      <div class="dialog-container">
        <!-- 头部 -->
        <header class="dialog-header">
          <div class="header-content">
            <h3 class="dialog-title">AI 任务拆分建议</h3>
            <p class="dialog-subtitle">智能分析您的任务，提供最佳拆分方案</p>
          </div>
          <button class="close-button" @click="handleCancel">×</button>
        </header>

        <!-- 内容区域 -->
        <main class="dialog-content">
          <!-- 原始任务 -->
          <section class="content-section">
            <h4 class="section-title">原始任务</h4>
            <div class="task-content">
              {{ config.originalTask }}
            </div>
          </section>

          <!-- 子任务列表 -->
          <section class="content-section">
            <div class="section-header">
              <h4 class="section-title">建议子任务</h4>
              <span class="subtask-count"
                >已选择 {{ selectedCount }}/{{ selectedSubtasks.length }}</span
              >
            </div>
            <div class="subtasks-list">
              <label
                v-for="(subtask, index) in selectedSubtasks"
                :key="index"
                class="subtask-item"
                :class="{ selected: subtask.selected }"
              >
                <input v-model="subtask.selected" type="checkbox" class="subtask-checkbox" />
                <div class="subtask-content">
                  <span class="subtask-number">{{ index + 1 }}</span>
                  <span class="subtask-text">{{ subtask.text }}</span>
                </div>
              </label>
            </div>
          </section>
        </main>

        <!-- 底部操作 -->
        <footer class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCancel">保持原样</button>
          <button :disabled="!hasSelectedSubtasks" class="btn btn-primary" @click="handleConfirm">
            使用拆分 ({{ selectedCount }})
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SubtaskSelectionConfig } from '@/types/todo'
import { computed, ref, watch } from 'vue'

interface Props {
  config: Omit<SubtaskSelectionConfig, 'reasoning'>
}

interface Emits {
  confirm: [subtasks: string[]]
  cancel: [originalTask: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 子任务选择状态
interface SelectableSubtask {
  text: string
  selected: boolean
}

const selectedSubtasks = ref<SelectableSubtask[]>([])

// 监听配置变化，初始化选择状态
watch(
  () => props.config.subtasks,
  (newSubtasks) => {
    selectedSubtasks.value = newSubtasks.map((text) => ({
      text,
      selected: true, // 默认全选
    }))
  },
  { immediate: true }
)

// 计算属性
const hasSelectedSubtasks = computed(() => {
  return selectedSubtasks.value.some((subtask) => subtask.selected)
})

const selectedCount = computed(() => {
  return selectedSubtasks.value.filter((subtask) => subtask.selected).length
})

// 事件处理
function handleConfirm() {
  const selected = selectedSubtasks.value
    .filter((subtask) => subtask.selected)
    .map((subtask) => subtask.text)

  emit('confirm', selected)
}

function handleCancel() {
  emit('cancel', props.config.originalTask)
}
</script>

<style scoped>
/* 对话框动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 对话框布局 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.dialog-container {
  position: relative;
  background: var(--card-bg-color);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 36rem;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--input-border-color);
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
}

/* 头部样式 */
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--input-border-color);
}

.header-content {
  flex: 1;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
}

.dialog-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary-color);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary-color);
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
}

.close-button:hover {
  background: var(--hover-bg-color);
  color: var(--text-color);
}

/* 内容区域 */
.dialog-content {
  padding: 0 1.5rem 1rem;
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 内容区块 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.subtask-count {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 任务内容 */
.task-content {
  padding: 1rem;
  background: var(--bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  color: var(--text-color);
  line-height: 1.6;
  font-size: 0.9rem;
}

/* 子任务列表 */
.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subtask-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color);
}

.subtask-item:hover {
  border-color: var(--primary-color);
  background: var(--card-bg-color);
}

.subtask-item.selected {
  border-color: var(--primary-color);
  background: var(--ai-accent-color);
}

.subtask-checkbox {
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.subtask-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.subtask-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--text-secondary-color);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.subtask-item.selected .subtask-number {
  background: var(--primary-color);
}

.subtask-text {
  color: var(--text-color);
  line-height: 1.5;
  font-size: 0.875rem;
}

/* 底部操作 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--input-border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-secondary {
  background: var(--bg-color);
  color: var(--text-secondary-color);
  border-color: var(--input-border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg-color);
  color: var(--text-color);
  border-color: var(--primary-color);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--button-hover-bg-color);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    margin: 1rem;
    max-height: 85vh;
  }

  .dialog-header {
    padding: 1rem 1rem 0.75rem;
  }

  .dialog-content {
    padding: 0 1rem 0.75rem;
  }

  .dialog-footer {
    padding: 0.75rem 1rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .dialog-title {
    font-size: 1.125rem;
  }

  .dialog-subtitle {
    font-size: 0.8rem;
  }
}
</style>
