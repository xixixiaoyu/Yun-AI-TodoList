<template>
  <Transition name="search-expand">
    <div v-if="isExpanded" class="font-sans mb-4 w-full overflow-hidden">
      <div
        class="relative flex items-center bg-input-bg border border-input-border rounded-lg transition-all-300 overflow-hidden focus-within:border-primary focus-within:shadow-primary focus-within:shadow-opacity-10"
      >
        <div class="flex items-center justify-center px-3 text-text-secondary pointer-events-none">
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
          class="flex-1 py-3 pr-2 border-none bg-transparent text-text text-sm font-sans outline-none w-full placeholder:text-text-secondary placeholder:opacity-70"
          :placeholder="t('searchTodos')"
          @input="handleInput"
          @keydown.escape="handleEscape"
          @blur="handleBlur"
        />
        <button
          v-if="internalValue"
          class="flex items-center justify-center p-2 mr-1 bg-transparent border-none rounded text-text-secondary cursor-pointer transition-all duration-200 opacity-70 hover:bg-hover hover:text-text hover:opacity-100 active:scale-95"
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
const props = defineProps<{
  modelValue: string
  isExpanded: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  collapse: []
}>()

const { t } = useI18n()
const searchInput = ref<HTMLInputElement>()

const internalValue = ref('')

watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue
  },
  { immediate: true }
)

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(
  () => props.isExpanded,
  (newValue) => {
    if (newValue) {
      setTimeout(() => {
        searchInput.value?.focus()
      }, 150)
    }
  }
)

const handleInput = () => {}

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
  if (!internalValue.value) {
    setTimeout(() => {
      if (!internalValue.value) {
        emit('collapse')
      }
    }, 150)
  }
}

defineExpose({
  focus: () => searchInput.value?.focus(),
  clear: clearSearch,
})
</script>

<style scoped>
.search-expand-enter-active,
.search-expand-leave-active {
  @apply transition-all duration-300 ease-out;
}

.search-expand-enter-from {
  @apply opacity-0 transform -translate-y-2.5 scale-95 max-h-0;
}

.search-expand-leave-to {
  @apply opacity-0 transform -translate-y-2.5 scale-95 max-h-0;
}

.search-expand-enter-to,
.search-expand-leave-from {
  @apply opacity-100 transform translate-y-0 scale-100 max-h-25;
}

@media (max-width: 768px) {
  input {
    @apply text-base;
  }

  .search-icon {
    @apply px-2;
  }

  button {
    @apply p-1.5;
  }
}

@media (prefers-color-scheme: dark) {
  div:nth-child(2) {
    @apply backdrop-blur-sm;
  }
}
</style>
