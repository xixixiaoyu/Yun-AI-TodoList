<template>
  <Transition name="dialog-fade">
    <div v-if="show" class="dialog-overlay">
      <!-- 背景遮罩 -->
      <div class="dialog-backdrop" @click="handleCancel"></div>

      <!-- 对话框内容 -->
      <div class="dialog-container">
        <!-- 头部 -->
        <header class="dialog-header">
          <div class="header-content">
            <h3 class="dialog-title">
              <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              {{ t('aiTaskGeneration') }}
            </h3>
            <p class="dialog-subtitle">{{ t('aiTaskGenerationSubtitle') }}</p>
          </div>
          <button class="close-button" @click="handleClose">×</button>
        </header>

        <!-- 主要内容 -->
        <main class="dialog-content">
          <!-- 输入阶段 -->
          <div v-if="!hasGeneratedTasks" class="input-stage">
            <div class="input-section">
              <label class="input-label">{{ t('taskDescription') }}</label>
              <textarea
                ref="textareaRef"
                v-model="inputDescription"
                class="task-input"
                :placeholder="t('taskDescriptionPlaceholder')"
                rows="4"
                :disabled="isGenerating"
                @keydown="handleKeydown"
                @keydown.esc="handleCancel"
              ></textarea>
              <div class="input-hint">
                {{ t('taskInputHint') }}
              </div>
            </div>

            <!-- 配置选项 -->
            <div class="config-section">
              <div class="config-row">
                <div class="config-label-group">
                  <label class="config-label">{{ t('maxTasks') }}</label>
                  <span class="config-hint">{{ t('maxTasksHint') }}</span>
                </div>
                <select
                  v-model="localConfig.maxTasks"
                  :disabled="isGenerating"
                  class="config-select"
                >
                  <option value="0">{{ t('autoJudge') }}</option>
                  <option value="3">3 {{ t('tasks') }}</option>
                  <option value="5">5 {{ t('tasks') }}</option>
                  <option value="8">8 {{ t('tasks') }}</option>
                  <option value="10">10 {{ t('tasks') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 任务预览阶段 -->
          <div v-else class="preview-stage">
            <!-- 验证提醒 -->
            <div v-if="hasValidationIssues" class="validation-alert">
              <div class="alert-header">
                <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>{{ t('validationIssuesFound') }}</span>
              </div>
              <ul class="alert-list">
                <li v-for="issue in validationResult?.issues" :key="issue">{{ issue }}</li>
              </ul>
            </div>

            <!-- 任务列表头部 -->
            <div class="tasks-header">
              <div class="tasks-title">
                <h4>{{ t('generatedTasks') }}</h4>
                <span class="task-count">{{ selectedTasksCount }}/{{ generatedTasks.length }}</span>
              </div>
              <div class="tasks-actions">
                <button
                  class="action-btn secondary"
                  :disabled="isGenerating"
                  @click="toggleAllTasks"
                >
                  {{
                    selectedTasksCount === generatedTasks.length ? t('deselectAll') : t('selectAll')
                  }}
                </button>
                <button
                  class="action-btn secondary"
                  :disabled="isGenerating"
                  @click="regenerateTasks"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {{ t('regenerate') }}
                </button>
              </div>
            </div>

            <!-- 任务列表 -->
            <div class="tasks-list">
              <TaskPreviewCard
                v-for="(task, index) in generatedTasks"
                :key="index"
                :task="task"
                :index="index"
                :selected="selectedTasks.has(index)"
                :editing="editingTask === index"
                @toggle-selection="toggleTaskSelection"
                @start-edit="startEditTask"
                @save-edit="saveTaskEdit"
                @cancel-edit="cancelTaskEdit"
                @delete="deleteTask"
              />
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isGenerating" class="loading-overlay">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <p class="loading-text">{{ t('generatingTasks') }}</p>
            </div>
          </div>
        </main>

        <!-- 底部操作 -->
        <footer class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCancel">
            {{ isGenerating ? t('stopGeneration') : t('cancel') }}
          </button>

          <button
            v-if="!hasGeneratedTasks"
            class="btn btn-primary"
            :disabled="!canGenerate || isGenerating"
            @click="handleGenerate"
          >
            <svg v-if="isGenerating" class="btn-icon animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            {{ t('generateTasks') }}
          </button>

          <button
            v-else
            class="btn btn-primary"
            :disabled="!canConfirm || isGenerating"
            @click="handleConfirm"
          >
            {{ t('addSelectedTasks', { count: selectedTasksCount }) }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useTaskGeneration } from '@/composables/useTaskGeneration'
import type { GeneratedTask, Todo } from '@/types/todo'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TaskPreviewCard from './TaskPreviewCard.vue'

interface Props {
  show: boolean
  existingTodos?: Todo[]
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', tasks: GeneratedTask[]): void
}

const props = withDefaults(defineProps<Props>(), {
  existingTodos: () => [],
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// 使用任务生成组合式函数
const {
  state,
  hasGeneratedTasks,
  selectedTasksCount,
  canConfirm,
  hasValidationIssues,
  generateTasks,
  stopGeneration,
  toggleTaskSelection,
  toggleAllTasks,
  startEditTask,
  saveTaskEdit,
  cancelTaskEdit,
  deleteTask,
  confirmTasks,
  regenerateTasks,
  updateConfig,
} = useTaskGeneration()

// 引入 AI 分析配置
const { analysisConfig } = useAIAnalysis()

// 本地状态
const inputDescription = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const localConfig = ref({
  maxTasks: 0, // 0 表示自动判断
})

// 计算属性
const canGenerate = computed(() => inputDescription.value.trim().length > 0)
const isGenerating = computed(() => state.isGenerating)
const generatedTasks = computed(() => state.generatedTasks)
const selectedTasks = computed(() => state.selectedTasks)
const editingTask = computed(() => state.editingTask)
const validationResult = computed(() => state.validationResult)

// 监听配置变化
watch(
  localConfig,
  (newConfig) => {
    updateConfig(newConfig)
  },
  { deep: true }
)

// 监听对话框显示状态
watch(
  () => props.show,
  (show) => {
    if (show) {
      // 对话框打开时自动聚焦到输入框
      nextTick(() => {
        textareaRef.value?.focus()
      })
    } else {
      // 重置状态
      inputDescription.value = ''
      localConfig.value = {
        maxTasks: 0, // 0 表示自动判断
      }
    }
  }
)

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Shift+Enter: 换行，不做任何处理，让默认行为发生
      return
    } else {
      // Enter: 快速生成
      event.preventDefault()
      if (canGenerate.value && !isGenerating.value) {
        handleGenerate()
      }
    }
  }
}

// 处理生成任务
const handleGenerate = async () => {
  if (!canGenerate.value || isGenerating.value) return

  // 使用本地配置
  const config = { ...localConfig.value }

  await generateTasks(inputDescription.value, props.existingTodos, config)
}

// 处理确认
const handleConfirm = () => {
  const selectedTasks = confirmTasks()
  emit('confirm', selectedTasks)
}

// 处理关闭按钮（X）
const handleClose = () => {
  if (isGenerating.value) {
    // 如果正在生成，直接停止生成但不关闭对话框
    stopGeneration()
  } else {
    // 如果没有在生成，关闭对话框
    emit('close')
  }
}

// 处理取消按钮
const handleCancel = () => {
  if (isGenerating.value) {
    // 如果正在生成，直接停止生成但不关闭对话框
    stopGeneration()
  } else {
    // 如果没有在生成，关闭对话框
    emit('close')
  }
}

defineOptions({
  name: 'TaskGenerationDialog',
})
</script>

<style scoped>
/* 对话框基础样式 */
.dialog-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.dialog-backdrop {
  @apply absolute inset-0;
}

.dialog-container {
  @apply relative rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden;
  background: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  box-shadow: var(--card-shadow);
}

/* 头部样式 */
.dialog-header {
  @apply flex items-center justify-between p-6 border-b;
  border-color: var(--input-border-color);
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.02) 100%);
}

.header-content {
  @apply flex-1;
}

.dialog-title {
  @apply text-xl font-semibold flex items-center gap-2;
  color: var(--text-color);
}

.title-icon {
  @apply w-6 h-6;
  color: var(--primary-color);
}

.dialog-subtitle {
  @apply text-sm mt-1;
  color: var(--text-secondary-color);
}

.close-button {
  @apply w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl font-bold;
  color: var(--text-secondary-color);
}

.close-button:hover {
  color: var(--text-color);
  background: var(--settings-primary-ultra-light);
}

/* 内容样式 */
.dialog-content {
  @apply p-6 overflow-y-auto max-h-[60vh] relative;
}

/* 输入阶段样式 */
.input-stage {
  @apply space-y-6;
}

.input-section {
  @apply space-y-3;
}

.input-label {
  @apply block text-sm font-medium;
  color: var(--text-color);
}

.task-input {
  @apply w-full px-4 py-3 rounded-lg resize-none;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.task-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.input-hint {
  @apply text-xs;
  color: var(--text-secondary-color);
}

/* 配置样式 */
.config-section {
  @apply space-y-4;
}

.config-title {
  @apply text-sm font-medium;
  color: var(--text-color);
}

.config-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-3;
}

.config-item {
  @apply flex items-center gap-2 text-sm cursor-pointer;
  color: var(--text-secondary-color);
}

.config-row {
  @apply flex items-center justify-between;
}

.config-label-group {
  @apply flex flex-col;
}

.config-label {
  @apply text-sm font-medium;
  color: var(--text-color);
}

.config-hint {
  @apply text-xs;
  color: var(--text-secondary-color);
}

.config-select {
  @apply px-3 py-2 rounded-md text-sm;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.config-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

/* 切换开关样式 */
.toggle-switch {
  @apply relative inline-block w-12 h-6 cursor-pointer;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute inset-0 rounded-full transition-all duration-300 ease-in-out;
  background: var(--settings-input-border);
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300 ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--settings-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  @apply transform translate-x-6;
}

/* 预览阶段样式 */
.preview-stage {
  @apply space-y-4;
}

.validation-alert {
  @apply rounded-lg p-4;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--input-border-color);
  box-shadow: var(--card-shadow);
}

[data-theme='dark'] .validation-alert {
  background: rgba(37, 43, 50, 0.8);
}

.alert-header {
  @apply flex items-center gap-2 font-medium mb-2;
  color: var(--text-color);
}

.alert-icon {
  @apply w-5 h-5;
  color: var(--primary-color);
}

.alert-list {
  @apply text-sm space-y-1 ml-7;
  color: var(--text-secondary-color);
}

/* 任务列表样式 */
.tasks-header {
  @apply flex items-center justify-between;
}

.tasks-title {
  @apply flex items-center gap-3;
}

.tasks-title h4 {
  @apply text-lg font-semibold;
  color: var(--text-color);
}

.task-count {
  @apply px-2 py-1 text-sm rounded-full;
  background: var(--settings-primary-ultra-light);
  color: var(--primary-color);
}

.tasks-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2;
  background: var(--settings-button-secondary-bg);
  color: var(--settings-button-secondary-text);
}

.action-btn:hover {
  background: var(--settings-button-secondary-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  @apply w-4 h-4;
}

.tasks-list {
  @apply space-y-3 max-h-96 overflow-y-auto;
}

/* 加载状态样式 */
.loading-overlay {
  @apply absolute inset-0 flex items-center justify-center z-10;
  background: rgba(255, 255, 255, 0.8);
}

[data-theme='dark'] .loading-overlay {
  background: rgba(37, 43, 50, 0.8);
}

.loading-content {
  @apply text-center;
}

.loading-spinner {
  @apply w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-3;
  border-color: var(--input-border-color);
  border-top-color: var(--primary-color);
}

.loading-text {
  @apply text-sm;
  color: var(--text-secondary-color);
}

/* 底部样式 */
.dialog-footer {
  @apply flex items-center justify-end gap-3 p-6 border-t;
  border-color: var(--settings-input-border);
  background: linear-gradient(180deg, var(--card-bg-color) 0%, var(--bg-color) 100%);
}

.footer-actions {
  @apply flex items-center gap-3;
}

.btn {
  @apply px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.btn-primary:hover:not(:disabled) {
  background: var(--button-primary-hover);
  box-shadow: var(--button-primary-shadow);
}

.btn-primary:focus:not(:disabled) {
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.btn-secondary {
  background: var(--button-secondary-bg);
  color: var(--button-secondary-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--button-secondary-hover);
  box-shadow: var(--button-secondary-shadow);
}

.btn-secondary:focus:not(:disabled) {
  box-shadow: 0 0 0 2px rgba(var(--text-color-rgb), 0.1);
}

.btn-icon {
  @apply w-4 h-4;
}

/* 任务项样式 */
.tasks-list {
  @apply space-y-3 max-h-96 overflow-y-auto;
}

.task-item {
  @apply p-4 rounded-lg border transition-all duration-200;
  background: var(--card-bg-color);
  border-color: var(--card-border-color);
  box-shadow: var(--card-shadow);
}

.task-item:hover {
  box-shadow: var(--card-hover-shadow);
  border-color: var(--card-hover-border-color);
}

.task-item-header {
  @apply flex items-start justify-between gap-3 mb-3;
}

.task-main {
  @apply flex-1 min-w-0;
}

.task-title {
  @apply font-medium mb-2;
  color: var(--text-color);
}

.task-details {
  @apply flex flex-wrap items-center gap-4 text-sm;
}

.detail-item {
  @apply flex items-center gap-1.5;
  color: var(--text-secondary-color);
}

.detail-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.detail-text {
  @apply truncate;
}

.task-actions {
  @apply flex flex-col gap-2 flex-shrink-0;
}

.task-actions button {
  @apply p-2 rounded-lg transition-colors;
}

.task-actions button:hover {
  background: var(--settings-primary-ultra-light);
}

.task-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-actions svg {
  @apply w-4 h-4;
}

.btn-primary:hover {
  background: var(--settings-button-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.animate-spin {
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
</style>
