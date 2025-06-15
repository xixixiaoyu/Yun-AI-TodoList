<template>
  <div class="tags-input">
    <div class="tags-display">
      <span v-for="(tag, index) in tags" :key="index" class="tag">
        {{ tag }}
        <button class="tag-remove" @click="removeTag(index)">×</button>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  tags: string[]
}

interface Emits {
  (e: 'update:tags', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tagInput = ref('')

/**
 * 添加标签
 */
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !props.tags.includes(tag)) {
    emit('update:tags', [...props.tags, tag])
    tagInput.value = ''
  }
}

/**
 * 移除标签
 */
const removeTag = (index: number) => {
  emit(
    'update:tags',
    props.tags.filter((_, i) => i !== index)
  )
}

/**
 * 处理标签输入键盘事件
 */
const handleTagInputKeydown = (event: KeyboardEvent) => {
  if (event.key === ',' || event.key === '，') {
    event.preventDefault()
    addTag()
  }
}

defineOptions({
  name: 'PromptTagsInput'
})
</script>

<style scoped>
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
</style>
