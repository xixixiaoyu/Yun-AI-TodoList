<template>
  <div class="settings-section">
    <!-- 标题区域 -->
    <div class="section-header">
      <div class="section-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <div class="section-title-group">
        <h3 class="section-title">{{ t('systemPrompts') }}</h3>
        <p class="section-description">{{ t('systemPromptsDescription') }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- 系统提示词管理 -->
      <div class="mt-6 space-y-4">
        <!-- 系统提示词总开关 -->
        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">{{ $t('systemPromptsEnabled') }}</label>
            <p class="setting-description">{{ $t('systemPromptsEnabledDesc') }}</p>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" :checked="config.enabled" @change="handleToggleEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- 当前激活的提示词 -->
        <div class="setting-item" :class="{ 'opacity-50': !config.enabled }">
          <div class="setting-info">
            <label class="setting-label">{{ t('activeSystemPrompt') }}</label>
            <p class="setting-description">{{ t('activeSystemPromptDesc') }}</p>
          </div>
          <div class="setting-control">
            <select
              :value="config.activePromptId || ''"
              :disabled="!config.enabled"
              class="select-input"
              @change="handleActivePromptChange"
            >
              <option value="">{{ t('noSystemPrompt') }}</option>
              <option v-for="prompt in systemPrompts" :key="prompt.id" :value="prompt.id">
                {{ prompt.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 提示词列表 -->
        <div class="prompts-list">
          <div class="list-header">
            <h4 class="list-title">{{ t('systemPromptsList') }}</h4>
            <button
              class="btn-primary btn-sm"
              :disabled="isLoading"
              @click="showCreateDialog = true"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {{ t('createPrompt') }}
            </button>
          </div>

          <div v-if="systemPrompts.length === 0" class="empty-state">
            <svg
              class="w-12 h-12 text-text-secondary/50 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p class="text-text-secondary text-sm text-center">{{ t('noSystemPromptsYet') }}</p>
            <p class="text-text-secondary/70 text-xs text-center mt-1">
              {{ t('createFirstPrompt') }}
            </p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="prompt in systemPrompts"
              :key="prompt.id"
              class="prompt-item prompt-clickable"
              :class="{
                'prompt-active': config.activePromptId === prompt.id,
              }"
              @click="handlePromptClick(prompt)"
            >
              <div class="prompt-info">
                <div class="prompt-header">
                  <h5 class="prompt-name">{{ prompt.name }}</h5>
                  <div class="prompt-badges">
                    <span v-if="config.activePromptId === prompt.id" class="badge badge-primary">
                      {{ t('enabled') }}
                    </span>
                  </div>
                </div>

                <div class="prompt-content-preview">{{ getContentPreview(prompt.content) }}</div>
              </div>
              <div class="prompt-actions" @click.stop>
                <button
                  class="btn-ghost btn-sm"
                  :disabled="isLoading"
                  :title="t('edit')"
                  @click="editPrompt(prompt)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                <button
                  class="btn-ghost btn-sm text-red-500 hover:text-red-600"
                  :disabled="isLoading"
                  :title="t('delete')"
                  @click="confirmDelete(prompt)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <PromptDialog
      v-if="showCreateDialog || showEditDialog"
      :show="showCreateDialog || showEditDialog"
      :prompt="editingPrompt"
      :is-editing="showEditDialog"
      :is-loading="isLoading"
      @close="closeDialog"
      @save="handleSavePrompt"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      :show="showDeleteDialog"
      :title="t('deletePromptTitle')"
      :message="t('deletePromptMessage', { name: deletingPrompt?.name })"
      :is-loading="isLoading"
      @close="showDeleteDialog = false"
      @confirm="handleDeletePrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { useSystemPrompts } from '@/composables/useSystemPrompts'
import type {
  SystemPrompt,
  SystemPromptCreateInput,
  SystemPromptUpdateInput,
} from '@/services/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import PromptDialog from './SystemPromptDialog.vue'

const { t } = useI18n()
const {
  systemPrompts,
  config,
  isLoading,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  setActivePrompt,
  updateConfig,
} = useSystemPrompts()

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingPrompt = ref<SystemPrompt | null>(null)
const deletingPrompt = ref<SystemPrompt | null>(null)

// 处理激活提示词变更
const handleActivePromptChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const promptId = target.value || null

  try {
    // 如果选择了具体的系统提示词，自动启用系统提示词功能
    if (promptId && !config.value.enabled) {
      await updateConfig({ enabled: true })
    }
    await setActivePrompt(promptId)
  } catch (error) {
    console.error('切换系统提示词失败:', error)
  }
}

// 处理提示词点击切换
const handlePromptClick = async (prompt: SystemPrompt) => {
  try {
    // 如果点击的是当前激活的提示词，则取消激活
    if (config.value.activePromptId === prompt.id) {
      await setActivePrompt(null)
    } else {
      // 否则激活该提示词，并自动启用系统提示词功能
      if (!config.value.enabled) {
        await updateConfig({ enabled: true })
      }
      await setActivePrompt(prompt.id)
    }
  } catch (error) {
    console.error('切换系统提示词失败:', error)
  }
}

// 处理系统提示词总开关
const handleToggleEnabled = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const enabled = target.checked

  try {
    await updateConfig({ enabled })
    // 不再自动清除激活的提示词，让用户保持选择状态
    // 这样当重新启用时，之前的选择仍然有效
  } catch (error) {
    console.error('切换系统提示词开关失败:', error)
  }
}

// 编辑提示词
const editPrompt = (prompt: SystemPrompt) => {
  editingPrompt.value = prompt
  showEditDialog.value = true
}

// 确认删除
const confirmDelete = (prompt: SystemPrompt) => {
  deletingPrompt.value = prompt
  showDeleteDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
  showCreateDialog.value = false
  showEditDialog.value = false
  editingPrompt.value = null
}

// 保存提示词
const handleSavePrompt = async (data: SystemPromptCreateInput | SystemPromptUpdateInput) => {
  try {
    if (showEditDialog.value && editingPrompt.value) {
      await updateSystemPrompt(editingPrompt.value.id, data as SystemPromptUpdateInput)
    } else {
      await createSystemPrompt(data as SystemPromptCreateInput)
    }
    closeDialog()
  } catch (error) {
    console.error('保存系统提示词失败:', error)
  }
}

// 删除提示词
const handleDeletePrompt = async () => {
  if (!deletingPrompt.value) return

  try {
    await deleteSystemPrompt(deletingPrompt.value.id)
    showDeleteDialog.value = false
    deletingPrompt.value = null
  } catch (error) {
    console.error('删除系统提示词失败:', error)
  }
}

// 获取内容预览
const getContentPreview = (content: string): string => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

defineOptions({
  name: 'SystemPromptsSection',
})
</script>

<style scoped>
.settings-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-start gap-3;
}

.section-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center;
  background: var(--settings-primary-soft);
  color: var(--settings-primary);
}

.section-title-group {
  @apply flex-1 min-w-0;
}

.section-title {
  @apply text-base font-semibold text-text mb-0.5;
}

.section-description {
  @apply text-sm text-text-secondary leading-relaxed;
}

.settings-content {
  @apply space-y-4;
}

.setting-item {
  @apply flex items-start justify-between gap-4 py-3;
}

.setting-info {
  @apply flex-1 min-w-0;
}

.setting-label {
  @apply block text-sm font-medium text-text mb-1;
}

.setting-description {
  @apply text-xs text-text-secondary leading-relaxed;
}

.setting-control {
  @apply flex-shrink-0;
}

.toggle-switch {
  @apply relative inline-block w-11 h-6 cursor-pointer;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300;
  background-color: var(--settings-input-border);
}

.toggle-slider:before {
  @apply absolute content-[''] h-4 w-4 left-1 bottom-1 rounded-full transition-all duration-300;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--settings-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.select-input {
  @apply px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-48;
  background: var(--settings-input-bg);
  border: 1px solid var(--settings-input-border);
  color: var(--text-color);
}

.select-input:focus {
  outline: none;
  border-color: var(--settings-input-focus-border);
  box-shadow: var(--settings-input-focus-shadow);
}

.prompts-list {
  @apply space-y-4;
}

.list-header {
  @apply flex items-center justify-between;
}

.list-title {
  @apply text-sm font-medium text-text;
}

.btn-primary {
  @apply px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center;
  background: var(--settings-button-primary-bg);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--settings-button-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--settings-input-focus-shadow);
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-sm {
  @apply text-xs px-2 py-1;
}

.empty-state {
  @apply py-8 text-center;
}

.prompt-item {
  @apply block p-4 rounded-xl transition-all duration-200;
  background: var(--settings-input-bg);
  border: 1px solid var(--settings-input-border);
}

.prompt-item:hover {
  border-color: var(--settings-primary-medium);
  box-shadow: var(--settings-input-focus-shadow);
}

.prompt-clickable {
  cursor: pointer;
}

.prompt-clickable:hover {
  border-color: var(--settings-primary);
  box-shadow: var(--settings-card-hover-shadow);
  background: var(--settings-primary-ultra-light);
}

.prompt-clickable:active {
  box-shadow: var(--settings-input-focus-shadow);
  transition: all 0.1s ease;
}

.prompt-active {
  border-color: var(--settings-primary);
  background: linear-gradient(
    135deg,
    var(--settings-input-bg) 0%,
    var(--settings-primary-soft) 100%
  );
}

.prompt-info {
  @apply w-full mb-3;
}

.prompt-header {
  @apply flex items-start justify-between gap-2 mb-2;
}

.prompt-name {
  @apply text-sm font-medium text-text;
}

.prompt-badges {
  @apply flex gap-1;
}

.badge {
  @apply px-2 py-0.5 text-xs rounded-full font-medium;
}

.badge-primary {
  background: var(--settings-primary);
  color: white;
}

.badge-secondary {
  background: var(--settings-primary-ultra-light);
  color: var(--settings-primary-dark);
}

.prompt-content-preview {
  @apply text-xs text-text-secondary/80 p-3 rounded font-mono;
  background: var(--settings-primary-ultra-light);
  border: 1px solid var(--settings-input-border);
  width: 100%;
  word-wrap: break-word;
  line-height: 1.4;
}

.prompt-actions {
  @apply flex gap-1 justify-end;
}

.btn-ghost {
  @apply p-1.5 rounded-lg transition-all duration-200 text-text-secondary hover:text-text;
  background-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--settings-primary-ultra-light);
  transform: translateY(-1px);
}

.btn-ghost:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
