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
            <h3 class="dialog-title">{{ t('subtaskSelectionDialog.aiTaskSplittingTitle') }}</h3>
            <p class="dialog-subtitle">{{ t('subtaskSelectionDialog.aiTaskSplittingSubtitle') }}</p>
          </div>
          <button class="close-button" @click="handleCancel">×</button>
        </header>

        <!-- 内容区域 -->
        <main class="dialog-content">
          <!-- 原始任务 -->
          <section class="content-section">
            <h4 class="section-title">{{ t('subtaskSelectionDialog.originalTask') }}</h4>
            <div class="task-content">
              {{ config.originalTask }}
            </div>
          </section>

          <!-- 子任务列表 -->
          <section class="content-section">
            <div class="section-header">
              <h4 class="section-title">{{ t('subtaskSelectionDialog.suggestedSubtasks') }}</h4>
              <span class="subtask-count">{{
                t('subtaskSelectionDialog.selectedCount', {
                  selected: selectedCount,
                  total: selectedSubtasks.length,
                })
              }}</span>
            </div>
            <div class="subtasks-list">
              <div
                v-for="(subtask, index) in selectedSubtasks"
                :key="index"
                class="subtask-item"
                :class="{ selected: subtask.selected }"
              >
                <input v-model="subtask.selected" type="checkbox" class="subtask-checkbox" />
                <div class="subtask-content">
                  <span class="subtask-number">{{ index + 1 }}</span>
                  <div class="subtask-text-container">
                    <textarea
                      v-model="subtask.text"
                      class="subtask-text-input"
                      :placeholder="
                        t('subtaskSelectionDialog.subtaskPlaceholder', { index: index + 1 })
                      "
                      @input="adjustTextareaHeight"
                      @focus="adjustTextareaHeight"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- 底部操作 -->
        <footer class="dialog-footer">
          <div class="footer-left">
            <button
              class="btn btn-regenerate"
              :disabled="isRegenerating"
              :title="t('subtaskSelectionDialog.regenerateTaskSplitting')"
              @click="handleRegenerate"
            >
              <span v-if="!isRegenerating" class="regenerate-icon">🔄</span>
              <span v-else class="regenerate-icon spinning">⏳</span>
              {{
                isRegenerating
                  ? t('subtaskSelectionDialog.regenerating')
                  : t('subtaskSelectionDialog.regenerate')
              }}
            </button>
          </div>
          <div class="footer-right">
            <button class="btn btn-secondary" @click="handleKeepOriginal">
              {{ t('subtaskSelectionDialog.keepOriginal') }}
            </button>
            <button :disabled="!hasSelectedSubtasks" class="btn btn-primary" @click="handleConfirm">
              {{ t('subtaskSelectionDialog.useSplitting', { count: selectedCount }) }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SubtaskSelectionConfig } from '@/types/todo'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  config: Omit<SubtaskSelectionConfig, 'reasoning'>
}

interface Emits {
  confirm: [subtasks: string[]]
  cancel: []
  keepOriginal: [originalTask: string]
  regenerate: [originalTask: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 子任务选择状态
interface SelectableSubtask {
  text: string
  selected: boolean
}

const selectedSubtasks = ref<SelectableSubtask[]>([])
const isRegenerating = ref(false)

// 监听配置变化，初始化选择状态
watch(
  () => props.config.subtasks,
  async (newSubtasks, oldSubtasks) => {
    selectedSubtasks.value = newSubtasks.map((text) => ({
      text,
      selected: true, // 默认全选
    }))

    // 如果是重新生成导致的变化（子任务数组内容发生变化），重置重新生成状态
    if (isRegenerating.value && oldSubtasks && newSubtasks.length > 0) {
      isRegenerating.value = false
    }

    // 等待 DOM 更新后调整文本框高度
    await nextTick()
    initTextareaHeights()
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
  emit('cancel')
}

function handleKeepOriginal() {
  emit('keepOriginal', props.config.originalTask)
}

function handleRegenerate() {
  isRegenerating.value = true
  emit('regenerate', props.config.originalTask)
}

// 自动调整文本框高度
function adjustTextareaHeight(event: Event) {
  const target = event.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}

// 初始化所有文本框高度
function initTextareaHeights() {
  const textareas = document.querySelectorAll('.subtask-text-input')
  textareas.forEach((textarea) => {
    const element = textarea as HTMLTextAreaElement
    element.style.height = 'auto'
    element.style.height = element.scrollHeight + 'px'
  })
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

.subtask-text-input {
  width: 100%;
  min-height: 2rem;
  padding: 0.5rem;
  border: 1px solid var(--input-border-color);
  border-radius: 6px;
  background: var(--card-bg-color);
  color: var(--text-color);
  font-size: 0.8125rem;
  line-height: 1.3;
  resize: none;
  overflow: hidden;
  font-family: inherit;
  transition: all 0.2s ease;
}

.subtask-text-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  background: var(--bg-color);
}

.subtask-text-input:hover {
  border-color: var(--primary-color);
}

.subtask-text-container {
  flex: 1;
}

/* 底部操作 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--input-border-color);
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.btn-regenerate {
  background: var(--bg-color);
  color: var(--text-color);
  border-color: var(--input-border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-regenerate:hover:not(:disabled) {
  background: var(--hover-bg-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.regenerate-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.regenerate-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

  .footer-left,
  .footer-right {
    width: 100%;
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
