<template>
  <Transition name="search-expand">
    <div v-if="isExpanded" class="search-container">
      <div class="search-input-wrapper">
        <div class="search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          ref="searchInput"
          v-model="internalValue"
          type="text"
          class="search-input"
          :placeholder="t('searchTodos')"
          @input="handleInput"
          @keydown.escape="handleEscape"
          @blur="handleBlur"
        />
        <button
          v-if="internalValue"
          class="clear-search-btn"
          :title="t('clearSearch')"
          :aria-label="t('clearSearch')"
          @click="clearSearch"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Props 和 Emits
const props = defineProps<{
  modelValue: string
  isExpanded: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  collapse: []
}>()

// 组合式 API
const { t } = useI18n()
const searchInput = ref<HTMLInputElement>()

// 内部输入值，用于处理输入事件
const internalValue = ref('')

// 初始化内部值
watch(
  () => props.modelValue,
  newValue => {
    internalValue.value = newValue
  },
  { immediate: true }
)

// 监听内部值变化并发出事件
watch(internalValue, newValue => {
  emit('update:modelValue', newValue)
})

// 监听展开状态变化，自动聚焦
watch(
  () => props.isExpanded,
  newValue => {
    if (newValue) {
      // 延迟聚焦，等待动画完成
      setTimeout(() => {
        searchInput.value?.focus()
      }, 150)
    }
  }
)

// 方法
const handleInput = () => {
  // 实时搜索，通过 v-model 自动触发
}

const clearSearch = () => {
  internalValue.value = ''
  searchInput.value?.focus()
}

const handleEscape = () => {
  if (internalValue.value) {
    clearSearch()
  } else {
    emit('collapse')
  }
}

const handleBlur = () => {
  // 如果没有搜索内容，延迟收缩（给用户时间点击清除按钮）
  if (!internalValue.value) {
    setTimeout(() => {
      if (!internalValue.value) {
        emit('collapse')
      }
    }, 150)
  }
}

// 暴露方法给父组件
defineExpose({
  focus: () => searchInput.value?.focus(),
  clear: clearSearch
})
</script>

<style scoped>
.search-container {
  font-family: 'LXGW WenKai Screen', sans-serif;
  margin-bottom: 1rem;
  width: 100%;
  overflow: hidden;
}

/* 展开收缩动画 */
.search-expand-enter-active,
.search-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-expand-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  max-height: 0;
}

.search-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  max-height: 0;
}

.search-expand-enter-to,
.search-expand-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  max-height: 100px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  color: var(--text-secondary-color);
  pointer-events: none;
}

.search-input {
  flex: 1;
  padding: 0.75rem 0.5rem 0.75rem 0;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  width: 100%;
}

.search-input::placeholder {
  color: var(--text-secondary-color);
  opacity: 0.7;
}

.clear-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin-right: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.clear-search-btn:hover {
  background-color: var(--hover-bg-color);
  color: var(--text-color);
  opacity: 1;
}

.clear-search-btn:active {
  transform: scale(0.95);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .search-input {
    font-size: 16px; /* 防止 iOS Safari 缩放 */
  }

  .search-icon {
    padding: 0 0.5rem;
  }

  .clear-search-btn {
    padding: 0.4rem;
  }
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .search-input-wrapper {
    backdrop-filter: blur(10px);
  }
}
</style>
