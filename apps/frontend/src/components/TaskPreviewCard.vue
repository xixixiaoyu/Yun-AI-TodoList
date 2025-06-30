<template>
  <div class="task-card" :class="{ selected, editing }">
    <!-- 选择框 -->
    <div class="task-checkbox">
      <input
        type="checkbox"
        :checked="selected"
        class="checkbox-input"
        @change="$emit('toggleSelection', index)"
      />
    </div>

    <!-- 任务内容 -->
    <div class="task-content">
      <!-- 编辑模式 -->
      <div v-if="editing" class="edit-mode">
        <div class="edit-field">
          <label class="edit-label">标题</label>
          <input v-model="editData.title" type="text" class="edit-input" placeholder="任务标题" />
        </div>

        <div class="edit-field">
          <label class="edit-label">描述</label>
          <textarea
            v-model="editData.description"
            class="edit-textarea"
            placeholder="任务描述（可选）"
            rows="2"
          ></textarea>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label">优先级</label>
            <select v-model="editData.priority" class="edit-select">
              <option :value="1">⭐ 低</option>
              <option :value="2">⭐⭐ 较低</option>
              <option :value="3">⭐⭐⭐ 中等</option>
              <option :value="4">⭐⭐⭐⭐ 较高</option>
              <option :value="5">⭐⭐⭐⭐⭐ 高</option>
            </select>
          </div>

          <div class="edit-field">
            <label class="edit-label">预估时间</label>
            <input
              v-model="editData.estimatedTime"
              type="text"
              class="edit-input"
              placeholder="如：2小时、30分钟"
            />
          </div>
        </div>

        <div class="edit-actions">
          <button class="edit-btn save" @click="handleSave">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            保存
          </button>
          <button class="edit-btn cancel" @click="$emit('cancelEdit')">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            取消
          </button>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-else class="preview-mode">
        <div class="task-header">
          <h4 class="task-title">{{ task.title }}</h4>
          <div class="task-actions">
            <button class="action-btn" title="编辑" @click="$emit('startEdit', index)">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button class="action-btn delete" title="删除" @click="handleDelete">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="task.description" class="task-description">{{ task.description }}</p>

        <div class="task-meta">
          <div v-if="task.priority" class="meta-item">
            <span class="meta-label">优先级:</span>
            <span class="priority-stars">{{ getPriorityStars(task.priority) }}</span>
          </div>

          <div v-if="task.estimatedTime" class="meta-item">
            <span class="meta-label">预估时间:</span>
            <span class="meta-value">{{ task.estimatedTime }}</span>
          </div>

          <div v-if="task.category" class="meta-item">
            <span class="meta-label">分类:</span>
            <span class="meta-value">{{ task.category }}</span>
          </div>
        </div>

        <div v-if="task.dependencies && task.dependencies.length > 0" class="task-dependencies">
          <span class="meta-label">依赖:</span>
          <div class="dependency-list">
            <span v-for="dep in task.dependencies" :key="dep" class="dependency-tag">
              {{ dep }}
            </span>
          </div>
        </div>

        <div v-if="task.tags && task.tags.length > 0" class="task-tags">
          <span v-for="tag in task.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <div v-if="task.reasoning" class="task-reasoning">
          <details class="reasoning-details">
            <summary class="reasoning-summary">AI 分析理由</summary>
            <p class="reasoning-text">{{ task.reasoning }}</p>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { GeneratedTask } from '@/types/todo'

interface Props {
  task: GeneratedTask
  index: number
  selected: boolean
  editing: boolean
}

interface Emits {
  (e: 'toggleSelection', index: number): void
  (e: 'startEdit', index: number): void
  (e: 'saveEdit', index: number, task: Partial<GeneratedTask>): void
  (e: 'cancelEdit'): void
  (e: 'delete', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 编辑数据
const editData = reactive<Partial<GeneratedTask>>({})

// 开始编辑时初始化数据
const initEditData = () => {
  Object.assign(editData, {
    title: props.task.title,
    description: props.task.description || '',
    priority: props.task.priority || 3,
    estimatedTime: props.task.estimatedTime || '',
    category: props.task.category || '',
  })
}

// 监听编辑状态变化
watch(
  () => props.editing,
  (editing) => {
    if (editing) {
      initEditData()
    }
  }
)

// 处理保存
const handleSave = () => {
  emit('saveEdit', props.index, { ...editData })
}

// 处理删除
const handleDelete = () => {
  if (confirm('确定要删除这个任务吗？')) {
    emit('delete', props.index)
  }
}

// 获取优先级星星
const getPriorityStars = (priority: number): string => {
  return '⭐'.repeat(Math.max(1, Math.min(5, priority)))
}

defineOptions({
  name: 'TaskPreviewCard',
})
</script>

<style scoped>
.task-card {
  @apply flex gap-3 p-4 rounded-lg transition-all duration-200;
  background: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
}

.task-card.selected {
  background: var(--settings-primary-ultra-light);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px rgba(var(--primary-color-rgb), 0.1);
}

.task-card.editing {
  background: var(--settings-primary-soft);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.15);
}

.task-checkbox {
  @apply flex-shrink-0 pt-1;
}

.checkbox-input {
  @apply w-4 h-4 rounded;
  color: var(--primary-color);
  border-color: var(--input-border-color);
}

.checkbox-input:focus {
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.task-content {
  @apply flex-1 min-w-0;
}

/* 编辑模式样式 */
.edit-mode {
  @apply space-y-3;
}

.edit-field {
  @apply space-y-1;
}

.edit-label {
  @apply block text-xs font-medium text-gray-700 dark:text-gray-300;
}

.edit-input {
  @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
}

.edit-textarea {
  @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none;
}

.edit-select {
  @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
}

.edit-row {
  @apply grid grid-cols-2 gap-3;
}

.edit-actions {
  @apply flex gap-2 pt-2;
}

.edit-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1;
}

.edit-btn.save {
  background: var(--primary-color);
  color: white;
}

.edit-btn.save:hover {
  background: var(--settings-primary-dark);
}

.edit-btn.cancel {
  background: var(--text-secondary-color);
  color: white;
}

.edit-btn.cancel:hover {
  background: var(--text-color);
}

/* 预览模式样式 */
.preview-mode {
  @apply space-y-3;
}

.task-header {
  @apply flex items-start justify-between;
}

.task-title {
  @apply text-base font-semibold flex-1 pr-2;
  color: var(--text-color);
}

.task-actions {
  @apply flex gap-1;
}

.action-btn {
  @apply p-1.5 rounded transition-colors;
  color: var(--text-secondary-color);
}

.action-btn:hover {
  color: var(--primary-color);
  background: var(--settings-primary-ultra-light);
}

.action-btn.delete:hover {
  color: var(--error-color);
  background: rgba(245, 101, 101, 0.1);
}

.btn-icon {
  @apply w-4 h-4;
}

.task-description {
  @apply text-sm;
  color: var(--text-secondary-color);
}

.task-meta {
  @apply flex flex-wrap gap-4 text-sm;
}

.meta-item {
  @apply flex items-center gap-1;
}

.meta-label {
  @apply font-medium;
  color: var(--text-secondary-color);
}

.meta-value {
  color: var(--text-color);
}

.priority-stars {
  color: var(--primary-color);
}

.task-dependencies {
  @apply space-y-1;
}

.dependency-list {
  @apply flex flex-wrap gap-1;
}

.dependency-tag {
  @apply px-2 py-1 text-xs rounded-full;
  background: var(--settings-primary-ultra-light);
  color: var(--primary-color);
}

.task-tags {
  @apply flex flex-wrap gap-1;
}

.tag {
  @apply px-2 py-1 text-xs rounded-full;
  background: var(--settings-primary-soft);
  color: var(--text-color);
}

.task-reasoning {
  @apply text-sm;
}

.reasoning-details {
  @apply rounded-md;
  border: 1px solid var(--input-border-color);
}

.reasoning-summary {
  @apply px-3 py-2 font-medium cursor-pointer transition-colors;
  background: var(--settings-primary-ultra-light);
  color: var(--text-color);
}

.reasoning-summary:hover {
  background: var(--settings-primary-soft);
}

.reasoning-text {
  @apply px-3 py-2;
  color: var(--text-secondary-color);
}
</style>
