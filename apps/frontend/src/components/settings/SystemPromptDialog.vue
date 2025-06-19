<template>
  <Teleport to="body">
    <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ isEditing ? t('editPrompt') : t('createPrompt') }}
          </h3>
          <button @click="$emit('close')" class="dialog-close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="dialog-content">
          <!-- 名称 -->
          <div class="form-group">
            <label class="form-label" for="prompt-name">
              {{ t('promptName') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              id="prompt-name"
              v-model="formData.name"
              type="text"
              class="form-input"
              :placeholder="t('promptNamePlaceholder')"
              :disabled="isLoading"
              required
            />
            <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label class="form-label" for="prompt-description">
              {{ t('promptDescription') }}
            </label>
            <input
              id="prompt-description"
              v-model="formData.description"
              type="text"
              class="form-input"
              :placeholder="t('promptDescriptionPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <!-- 内容 -->
          <div class="form-group">
            <label class="form-label" for="prompt-content">
              {{ t('promptContent') }}
              <span class="text-red-500">*</span>
            </label>
            <div class="content-input-container">
              <textarea
                id="prompt-content"
                v-model="formData.content"
                class="form-textarea"
                rows="8"
                :placeholder="t('promptContentPlaceholder')"
                :disabled="isLoading || isEnhancing"
                required
              ></textarea>
              <button
                type="button"
                @click="enhanceContent"
                class="enhance-btn"
                :disabled="isLoading || isEnhancing || !formData.content.trim()"
                :title="t('enhancePromptContent')"
              >
                <svg
                  v-if="isEnhancing"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            </div>
            <p v-if="errors.content" class="form-error">{{ errors.content }}</p>
            <p class="form-help">{{ t('promptContentHelp') }}</p>
          </div>

          <!-- 按钮 -->
          <div class="dialog-actions">
            <button
              type="button"
              @click="$emit('close')"
              class="btn-secondary"
              :disabled="isLoading"
            >
              {{ t('cancel') }}
            </button>
            <button type="submit" class="btn-primary" :disabled="isLoading || !isFormValid">
              <svg
                v-if="isLoading"
                class="w-4 h-4 mr-2 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              {{ isEditing ? t('save') : t('create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getAIResponse } from '@/services/deepseekService'
import type {
  SystemPrompt,
  SystemPromptCreateInput,
  SystemPromptUpdateInput,
} from '@/services/types'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  prompt?: SystemPrompt | null
  isEditing: boolean
  isLoading: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: SystemPromptCreateInput | SystemPromptUpdateInput): void
}

const props = withDefaults(defineProps<Props>(), {
  prompt: null,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// 表单数据
const formData = ref({
  name: '',
  description: '',
  content: '',
})
const errors = ref<Record<string, string>>({})
const isEnhancing = ref(false)

// 计算属性
const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.content.trim()
})

// 监听 prompt 变化，初始化表单数据
watch(
  () => props.prompt,
  (newPrompt) => {
    if (newPrompt && props.isEditing) {
      formData.value = {
        name: newPrompt.name,
        description: newPrompt.description || '',
        content: newPrompt.content,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 监听显示状态
watch(
  () => props.show,
  (show) => {
    if (show) {
      nextTick(() => {
        const nameInput = document.getElementById('prompt-name') as HTMLInputElement
        nameInput?.focus()
      })
    }
  }
)

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    content: '',
  }
  errors.value = {}
}

// 验证表单
const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = t('promptNameRequired')
  }

  if (!formData.value.content.trim()) {
    errors.value.content = t('promptContentRequired')
  }

  return Object.keys(errors.value).length === 0
}

// 处理提交
const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  const data = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim() || undefined,
    content: formData.value.content.trim(),
  }

  emit('save', data)
}

// AI增强内容
const enhanceContent = async () => {
  if (!formData.value.content.trim()) {
    return
  }

  try {
    isEnhancing.value = true

    const enhancePrompt = `请优化以下系统提示词，使其更加专业、清晰、符合AI助手的规范。要求：
1. 保持原有的核心意图和功能
2. 使用更专业和准确的表达
3. 结构更加清晰，逻辑更加严谨
4. 符合AI系统提示词的最佳实践
5. 直接返回优化后的提示词内容，不要添加任何解释

原始提示词：
${formData.value.content}`

    const enhancedContent = await getAIResponse(enhancePrompt, 0.3)

    if (enhancedContent && enhancedContent.trim()) {
      formData.value.content = enhancedContent.trim()
    }
  } catch (error) {
    console.error('AI增强失败:', error)
    // 这里可以添加错误提示
  } finally {
    isEnhancing.value = false
  }
}

// 处理遮罩点击
const handleOverlayClick = () => {
  emit('close')
}

defineOptions({
  name: 'SystemPromptDialog',
})
</script>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 flex items-center justify-center p-4;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.dialog-container {
  @apply rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden;
  background-color: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.3s ease-out;
}

.dialog-header {
  @apply flex items-center justify-between p-6 border-b;
  border-color: var(--input-border-color);
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.02) 100%);
}

.dialog-title {
  @apply text-lg font-semibold text-text;
}

.dialog-close-btn {
  @apply p-2 rounded-lg text-text-secondary hover:text-text hover:bg-input-bg transition-all duration-200;
}

.dialog-content {
  @apply p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto;
  background-color: var(--card-bg-color);
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-text;
}

.form-input {
  @apply w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200;
  background-color: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  border-width: 1.5px;
}

[data-theme='light'] .form-input {
  background-color: #fafafa;
  border-color: #d1d5db;
}

[data-theme='dark'] .form-input {
  background-color: #374151;
  border-color: #4b5563;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow:
    0 0 0 3px rgba(121, 180, 166, 0.15),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.form-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.form-textarea {
  @apply w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-none;
  background-color: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  border-width: 1.5px;
}

[data-theme='light'] .form-textarea {
  background-color: #fafafa;
  border-color: #d1d5db;
}

[data-theme='dark'] .form-textarea {
  background-color: #374151;
  border-color: #4b5563;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow:
    0 0 0 3px rgba(121, 180, 166, 0.15),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.form-textarea:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.form-error {
  @apply text-xs text-red-500;
}

.form-help {
  @apply text-xs text-text-secondary;
}

.enhance-help {
  @apply text-xs text-text-secondary/80 mt-1;
}

.content-input-container {
  position: relative;
}

.enhance-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 8px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #68a295 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2);
}

.enhance-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  background: linear-gradient(135deg, var(--button-hover-bg-color) 0%, var(--primary-color) 100%);
  box-shadow: 0 6px 20px rgba(var(--primary-color-rgb), 0.35);
}

.enhance-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  transition: all 0.1s ease;
}

.enhance-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 悬浮提示样式优化 */
.enhance-btn[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  font-size: 12px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  animation: tooltipFadeIn 0.2s ease-out 0.5s forwards;
  pointer-events: none;
}

.enhance-btn[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 12px;
  margin-bottom: 2px;
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  opacity: 0;
  animation: tooltipFadeIn 0.2s ease-out 0.5s forwards;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-actions {
  @apply flex gap-3 justify-end pt-4 border-t;
  border-color: var(--input-border-color);
  background-color: var(--card-bg-color);
  background: linear-gradient(180deg, var(--card-bg-color) 0%, rgba(121, 180, 166, 0.01) 100%);
}

.btn-primary {
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center;
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover-color);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200;
  background-color: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
