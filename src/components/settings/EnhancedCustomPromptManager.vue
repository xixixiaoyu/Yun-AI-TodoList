<template>
  <div class="enhanced-prompt-manager">
    <!-- 添加新提示词弹窗 -->
    <PromptFormDialog
      v-if="showAddPromptPopover"
      :new-prompt-name="newPromptName"
      :new-prompt-content="newPromptContent"
      :new-prompt-description="newPromptDescription"
      :new-prompt-category="newPromptCategory"
      :new-prompt-priority="newPromptPriority"
      :new-prompt-tags="newPromptTags"
      :error="error"
      :is-form-valid="isFormValid"
      @update:new-prompt-name="newPromptName = $event"
      @update:new-prompt-content="newPromptContent = $event"
      @update:new-prompt-description="newPromptDescription = $event"
      @update:new-prompt-category="newPromptCategory = $event"
      @update:new-prompt-priority="newPromptPriority = $event"
      @update:new-prompt-tags="newPromptTags = $event"
      @close="closeDialog"
      @save="$emit('saveNewPrompt')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PromptCategory, PromptPriority } from '../../types/settings'
import PromptFormDialog from './components/PromptFormDialog.vue'

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

const isFormValid = computed(() => {
  return newPromptName.value.trim() !== '' && newPromptContent.value.trim() !== ''
})

// 方法
const closeDialog = () => {
  emit('update:showAddPromptPopover', false)
  emit('resetForm')
}

defineOptions({
  name: 'EnhancedCustomPromptManager',
})
</script>

<style scoped>
.enhanced-prompt-manager {
  position: relative;
}
</style>
