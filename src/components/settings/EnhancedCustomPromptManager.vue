<template>
  <div class="enhanced-prompt-manager">
    <!-- 添加新提示词弹窗 -->
    <div v-if="showAddPromptPopover" class="prompt-dialog-overlay">
      <div class="prompt-dialog">
        <div class="dialog-header">
          <h3>{{ t('addNewPrompt') }}</h3>
          <button class="close-button" @click="closeDialog">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <!-- 基本信息 -->
          <div class="form-section">
            <h4>{{ t('basicInfo') }}</h4>
            <div class="form-row">
              <div class="input-group">
                <label>{{ t('enterPromptName') }} *</label>
                <input
                  v-model="newPromptName"
                  type="text"
                  :placeholder="t('enterPromptName')"
                  class="form-input"
                  maxlength="50"
                />
              </div>
              <div class="input-group">
                <label>{{ t('promptDescription') }}</label>
                <input
                  v-model="newPromptDescription"
                  type="text"
                  :placeholder="t('enterPromptDescription')"
                  class="form-input"
                  maxlength="100"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="input-group">
                <label>{{ t('promptCategory') }}</label>
                <select v-model="newPromptCategory" class="form-select">
                  <option
                    v-for="category in categoryOptions"
                    :key="category.value"
                    :value="category.value"
                  >
                    {{ category.label }}
                  </option>
                </select>
              </div>
              <div class="input-group">
                <label>{{ t('promptPriority') }}</label>
                <select v-model="newPromptPriority" class="form-select">
                  <option
                    v-for="priority in priorityOptions"
                    :key="priority.value"
                    :value="priority.value"
                  >
                    {{ priority.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="input-group">
              <label>{{ t('promptTags') }}</label>
              <div class="tags-input">
                <div class="tags-display">
                  <span v-for="(tag, index) in newPromptTags" :key="index" class="tag">
                    {{ tag }}
                    <button @click="removeTag(index)" class="tag-remove">×</button>
                  </span>
                </div>
                <input
                  v-model="tagInput"
                  type="text"
                  placeholder="输入标签后按回车添加"
                  class="tag-input"
                  @keydown.enter.prevent="addTag"
                  @keydown="handleTagInputKeydown"
                />
              </div>
            </div>
          </div>

          <!-- 提示词内容 -->
          <div class="form-section">
            <h4>{{ t('promptContent') }} *</h4>
            <textarea
              v-model="newPromptContent"
              :placeholder="t('enterPromptContent')"
              class="content-textarea"
              rows="8"
              maxlength="10000"
            />
            <div class="char-count">{{ newPromptContent.length }}/10000</div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <!-- 操作按钮 -->
          <div class="dialog-actions">
            <button class="cancel-button" @click="closeDialog">
              {{ t('cancel') }}
            </button>
            <button
              class="save-button"
              :disabled="!isFormValid"
              @click="$emit('saveNewPrompt')"
            >
              {{ t('save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PromptCategory, PromptPriority } from '../../types/settings'

interface Props {
  showAddPromptPopover: boolean
  newPromptName: string
  newPromptContent: string
  newPromptDescription: string
  newPromptCategory: PromptCategory
  newPromptPriority: PromptPriority
  newPromptTags: string[]
  error: string | null
}

interface Emits {
  (e: 'update:showAddPromptPopover', value: boolean): void
  (e: 'update:newPromptName', value: string): void
  (e: 'update:newPromptContent', value: string): void
  (e: 'update:newPromptDescription', value: string): void
  (e: 'update:newPromptCategory', value: PromptCategory): void
  (e: 'update:newPromptPriority', value: PromptPriority): void
  (e: 'update:newPromptTags', value: string[]): void
  (e: 'saveNewPrompt'): void
  (e: 'resetForm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 本地状态
const tagInput = ref('')

// 计算属性
const newPromptName = computed({
  get: () => props.newPromptName,
  set: (value) => emit('update:newPromptName', value),
})

const newPromptContent = computed({
  get: () => props.newPromptContent,
  set: (value) => emit('update:newPromptContent', value),
})

const newPromptDescription = computed({
  get: () => props.newPromptDescription,
  set: (value) => emit('update:newPromptDescription', value),
})

const newPromptCategory = computed({
  get: () => props.newPromptCategory,
  set: (value) => emit('update:newPromptCategory', value),
})

const newPromptPriority = computed({
  get: () => props.newPromptPriority,
  set: (value) => emit('update:newPromptPriority', value),
})

const newPromptTags = computed({
  get: () => props.newPromptTags,
  set: (value) => emit('update:newPromptTags', value),
})

const categoryOptions = computed(() => [
  { value: PromptCategory.GENERAL, label: t('categoryGeneral') },
  { value: PromptCategory.CODING, label: t('categoryCoding') },
  { value: PromptCategory.WRITING, label: t('categoryWriting') },
  { value: PromptCategory.ANALYSIS, label: t('categoryAnalysis') },
  { value: PromptCategory.CREATIVE, label: t('categoryCreative') },
  { value: PromptCategory.BUSINESS, label: t('categoryBusiness') },
  { value: PromptCategory.EDUCATION, label: t('categoryEducation') },
  { value: PromptCategory.CUSTOM, label: t('categoryCustom') },
])

const priorityOptions = computed(() => [
  { value: PromptPriority.HIGH, label: t('priorityHigh') },
  { value: PromptPriority.MEDIUM, label: t('priorityMedium') },
  { value: PromptPriority.LOW, label: t('priorityLow') },
])

const isFormValid = computed(() => {
  return newPromptName.value.trim() !== '' && newPromptContent.value.trim() !== ''
})

// 方法
const closeDialog = () => {
  emit('update:showAddPromptPopover', false)
  emit('resetForm')
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !newPromptTags.value.includes(tag)) {
    newPromptTags.value = [...newPromptTags.value, tag]
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  newPromptTags.value = newPromptTags.value.filter((_, i) => i !== index)
}

const handleTagInputKeydown = (event: KeyboardEvent) => {
  if (event.key === ',' || event.key === '，') {
    event.preventDefault()
    addTag()
  }
}

defineOptions({
  name: 'EnhancedCustomPromptManager',
})
</script>

<style scoped>
.enhanced-prompt-manager {
  position: relative;
}

.prompt-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.prompt-dialog {
  background-color: var(--card-bg-color);
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid var(--input-border-color);
  margin-bottom: 1.5rem;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--input-bg-color);
  color: var(--text-color);
}

.dialog-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.tags-input {
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--input-bg-color);
  padding: 0.5rem;
  min-height: 2.5rem;
  transition: all 0.2s ease;
}

.tags-input:focus-within {
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--button-bg-color);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.tag-input {
  border: none;
  background: none;
  outline: none;
  color: var(--text-color);
  font-size: 0.9rem;
  width: 100%;
  min-width: 120px;
}

.content-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s ease;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary-color);
  margin-top: 0.25rem;
}

.error-message {
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--input-border-color);
}

.cancel-button,
.save-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: var(--input-bg-color);
  border: 2px solid var(--input-border-color);
  color: var(--text-color);
}

.cancel-button:hover {
  background-color: var(--input-border-color);
}

.save-button {
  background-color: var(--button-bg-color);
  border: 2px solid var(--button-bg-color);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  border-color: var(--button-hover-bg-color);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .prompt-dialog {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }
}
</style>
