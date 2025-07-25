<template>
  <div v-if="isVisible" class="conflict-modal-overlay" @click="handleOverlayClick">
    <div class="conflict-modal" @click.stop>
      <div class="conflict-header">
        <h3>数据同步冲突</h3>
        <button class="close-btn" aria-label="关闭" @click="closeModal">
          <span>&times;</span>
        </button>
      </div>

      <div class="conflict-content">
        <p class="conflict-description">
          检测到 {{ conflicts.length }} 个数据冲突，请选择如何处理：
        </p>

        <div class="conflict-list">
          <div
            v-for="(conflict, index) in conflicts"
            :key="`conflict-${index}`"
            class="conflict-item"
          >
            <div class="conflict-info">
              <h4>冲突项目 {{ index + 1 }}</h4>
              <p class="conflict-reason">{{ conflict.reason }}</p>
            </div>

            <div class="conflict-options">
              <div class="option-group">
                <h5>本地版本</h5>
                <div class="todo-preview">
                  <div class="todo-title">{{ conflict.local.title }}</div>
                  <div class="todo-meta">
                    <span class="priority"
                      >优先级: {{ getPriorityText(conflict.local.priority) }}</span
                    >
                    <span class="status">{{ conflict.local.completed ? '已完成' : '未完成' }}</span>
                    <span class="date">更新: {{ formatDate(conflict.local.updatedAt) }}</span>
                  </div>
                </div>
                <button
                  class="resolution-btn"
                  :class="{ active: resolutions[index] === 'local' }"
                  @click="setResolution(index, 'local')"
                >
                  使用本地版本
                </button>
              </div>

              <div class="option-group">
                <h5>云端版本</h5>
                <div class="todo-preview">
                  <div class="todo-title">{{ conflict.server.title }}</div>
                  <div class="todo-meta">
                    <span class="priority"
                      >优先级: {{ getPriorityText(conflict.server.priority) }}</span
                    >
                    <span class="status">{{
                      conflict.server.completed ? '已完成' : '未完成'
                    }}</span>
                    <span class="date">更新: {{ formatDate(conflict.server.updatedAt) }}</span>
                  </div>
                </div>
                <button
                  class="resolution-btn"
                  :class="{ active: resolutions[index] === 'server' }"
                  @click="setResolution(index, 'server')"
                >
                  使用云端版本
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="batch-actions">
          <button class="batch-btn" @click="selectAllLocal">全部使用本地版本</button>
          <button class="batch-btn" @click="selectAllServer">全部使用云端版本</button>
        </div>
      </div>

      <div class="conflict-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="resolve-btn" :disabled="!allConflictsResolved" @click="resolveConflicts">
          解决冲突 ({{ resolvedCount }}/{{ conflicts.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Todo as ServerTodo } from '@shared/types'
import { computed, reactive, watch } from 'vue'
import type { Todo as LocalTodo } from '../../types/todo'

interface ConflictItem {
  local: LocalTodo
  server: ServerTodo
  reason: string
}

interface Props {
  conflicts: ConflictItem[]
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'resolve', resolutions: Array<{ index: number; choice: 'local' | 'server' }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 冲突解决方案
const resolutions = reactive<Record<number, 'local' | 'server'>>({})

// 计算属性
const resolvedCount = computed(() => {
  return Object.keys(resolutions).length
})

const allConflictsResolved = computed(() => {
  return resolvedCount.value === props.conflicts.length
})

// 方法
const setResolution = (index: number, choice: 'local' | 'server') => {
  resolutions[index] = choice
}

const selectAllLocal = () => {
  props.conflicts.forEach((_, index) => {
    resolutions[index] = 'local'
  })
}

const selectAllServer = () => {
  props.conflicts.forEach((_, index) => {
    resolutions[index] = 'server'
  })
}

const resolveConflicts = () => {
  const resolutionArray = Object.entries(resolutions).map(([index, choice]) => ({
    index: parseInt(index),
    choice,
  }))
  emit('resolve', resolutionArray)
}

const closeModal = () => {
  emit('close')
}

const handleOverlayClick = () => {
  closeModal()
}

const getPriorityText = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return priorityMap[priority] || priority
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 重置解决方案当冲突列表变化时
const resetResolutions = () => {
  Object.keys(resolutions).forEach((key) => {
    delete resolutions[parseInt(key)]
  })
}

// 监听冲突变化
watch(() => props.conflicts, resetResolutions, { immediate: true })
</script>

<style scoped>
.conflict-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.conflict-modal {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.conflict-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.conflict-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.conflict-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.conflict-description {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.conflict-list {
  space-y: 1.5rem;
}

.conflict-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.conflict-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.conflict-reason {
  margin: 0 0 1rem 0;
  color: #ef4444;
  font-size: 0.9rem;
  font-style: italic;
}

.conflict-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.option-group h5 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.todo-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.todo-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.todo-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.resolution-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.resolution-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.resolution-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.batch-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.batch-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.conflict-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.resolve-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.resolve-btn:hover:not(:disabled) {
  background: #2563eb;
}

.resolve-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .conflict-modal {
    width: 95%;
    max-height: 90vh;
  }

  .conflict-options {
    grid-template-columns: 1fr;
  }

  .batch-actions {
    flex-direction: column;
  }
}
</style>
