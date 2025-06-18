<template>
  <div class="conversation-search">
    <!-- 搜索输入框 -->
    <div class="search-input-container">
      <div class="search-input-wrapper">
        <SearchIcon class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('searchConversationContent')"
          class="search-input"
          @input="handleSearch"
          @keydown.enter="handleSearch"
        />
        <button v-if="searchQuery" class="clear-button" @click="clearSearch">
          <XIcon class="clear-icon" />
        </button>
      </div>
    </div>

    <!-- 高级筛选 -->
    <div v-if="showAdvancedFilters" class="advanced-filters">
      <!-- 日期范围 -->
      <div class="filter-group">
        <label class="filter-label">{{ t('dateRange') }}</label>
        <div class="date-range">
          <input v-model="dateRange.start" type="date" class="date-input" />
          <span class="date-separator">{{ t('to') }}</span>
          <input v-model="dateRange.end" type="date" class="date-input" />
        </div>
      </div>

      <!-- 消息数量 -->
      <div class="filter-group">
        <label class="filter-label">{{ t('messageCount') }}</label>
        <div class="message-count-range">
          <input
            v-model.number="messageCountRange.min"
            type="number"
            :placeholder="t('minimum')"
            class="number-input"
            min="0"
          />
          <span class="range-separator">-</span>
          <input
            v-model.number="messageCountRange.max"
            type="number"
            :placeholder="t('maximum')"
            class="number-input"
            min="0"
          />
        </div>
      </div>

      <!-- 标签筛选 -->
      <div class="filter-group">
        <label class="filter-label">{{ t('tags') }}</label>
        <div class="tags-container">
          <div
            v-for="tag in availableTags"
            :key="tag"
            class="tag-item"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选控制按钮 -->
    <div class="filter-controls">
      <button class="toggle-filters-button" @click="showAdvancedFilters = !showAdvancedFilters">
        <FilterIcon class="filter-icon" />
        {{ showAdvancedFilters ? t('hideFilter') : t('advancedFilter') }}
      </button>

      <button v-if="hasActiveFilters" class="clear-filters-button" @click="clearAllFilters">
        {{ t('clearFilter') }}
      </button>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searchResults.length > 0 || searchQuery" class="search-stats">
      <span class="stats-text">
        {{
          searchQuery
            ? t('foundMatchingConversations', { count: searchResults.length })
            : t('totalConversations', { count: totalConversations })
        }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Conversation } from '../../services/types'
import type { ConversationFilter } from '../../services/conversationHistoryService'
import { ConversationHistoryService } from '../../services/conversationHistoryService'
import SearchIcon from '../common/icons/SearchIcon.vue'
import XIcon from '../common/icons/XIcon.vue'
import FilterIcon from '../common/icons/FilterIcon.vue'

interface Props {
  conversations: Conversation[]
}

interface Emits {
  (e: 'search-results', results: Conversation[]): void
  (e: 'filter-change', filter: ConversationFilter): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 搜索状态
const searchQuery = ref('')
const showAdvancedFilters = ref(false)
const dateRange = ref({
  start: '',
  end: '',
})
const messageCountRange = ref({
  min: undefined as number | undefined,
  max: undefined as number | undefined,
})
const selectedTags = ref<string[]>([])

// 计算属性
const availableTags = computed(() => {
  const tags = new Set<string>()
  props.conversations.forEach((conv) => {
    conv.tags?.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    dateRange.value.start ||
    dateRange.value.end ||
    messageCountRange.value.min ||
    messageCountRange.value.max ||
    selectedTags.value.length > 0
  )
})

const currentFilter = computed((): ConversationFilter => {
  const filter: ConversationFilter = {}

  if (searchQuery.value) {
    filter.keyword = searchQuery.value
  }

  if (dateRange.value.start || dateRange.value.end) {
    filter.dateRange = {
      start: dateRange.value.start ? new Date(dateRange.value.start) : new Date(0),
      end: dateRange.value.end ? new Date(dateRange.value.end) : new Date(),
    }
  }

  if (messageCountRange.value.min || messageCountRange.value.max) {
    filter.messageCount = {
      min: messageCountRange.value.min,
      max: messageCountRange.value.max,
    }
  }

  if (selectedTags.value.length > 0) {
    filter.tags = selectedTags.value
  }

  return filter
})

const searchResults = computed(() => {
  if (!hasActiveFilters.value) {
    return props.conversations
  }

  return ConversationHistoryService.searchConversations(currentFilter.value)
})

const totalConversations = computed(() => props.conversations.length)

// 方法
const handleSearch = () => {
  performSearch()
}

const performSearch = () => {
  emit('search-results', searchResults.value)
  emit('filter-change', currentFilter.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  performSearch()
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  performSearch()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  dateRange.value = { start: '', end: '' }
  messageCountRange.value = { min: undefined, max: undefined }
  selectedTags.value = []
  showAdvancedFilters.value = false
  performSearch()
}

// 监听筛选条件变化
watch(
  [dateRange, messageCountRange, selectedTags],
  () => {
    performSearch()
  },
  { deep: true }
)

defineOptions({
  name: 'ConversationSearch',
})
</script>

<style scoped>
.conversation-search {
  @apply space-y-4 spacing-responsive-sm bg-bg-card rounded-lg border border-input-border;
}

.search-input-container {
  @apply relative;
}

.search-input-wrapper {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 w-4 h-4 text-text-secondary z-10;
}

.search-input {
  @apply w-full pl-10 pr-10 py-2.5 bg-input-bg border border-input-border rounded-lg;
  @apply text-responsive-base placeholder-text-secondary;
  @apply focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-input-focus/20;
  @apply transition-all duration-200;
}

.clear-button {
  @apply absolute right-3 p-1 text-text-secondary hover:text-text;
  @apply transition-colors duration-200;
}

.clear-icon {
  @apply w-4 h-4;
}

.advanced-filters {
  @apply space-y-4 p-4 bg-bg border border-input-border rounded-lg;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply block text-sm font-medium text-text;
}

.date-range {
  @apply flex items-center gap-2;
}

.date-input {
  @apply flex-1 px-3 py-2 bg-input-bg border border-input-border rounded-md;
  @apply text-text text-sm;
  @apply focus:outline-none focus:border-input-focus;
}

.date-separator {
  @apply text-text-secondary text-sm;
}

.message-count-range {
  @apply flex items-center gap-2;
}

.number-input {
  @apply flex-1 px-3 py-2 bg-input-bg border border-input-border rounded-md;
  @apply text-text text-sm;
  @apply focus:outline-none focus:border-input-focus;
}

.range-separator {
  @apply text-text-secondary text-sm;
}

.tags-container {
  @apply flex flex-wrap gap-2;
}

.tag-item {
  @apply px-3 py-1.5 bg-input-bg border border-input-border rounded-full;
  @apply text-sm text-text cursor-pointer;
  @apply hover:bg-primary/10 hover:border-primary/30;
  @apply transition-all duration-200;
}

.tag-item.active {
  @apply bg-primary/20 border-primary/50 text-primary;
}

.filter-controls {
  @apply flex items-center gap-3;
}

.toggle-filters-button {
  @apply flex items-center gap-2 px-3 py-2 bg-input-bg border border-input-border rounded-md;
  @apply text-text text-sm font-medium;
  @apply hover:bg-primary/10 hover:border-primary/30;
  @apply transition-all duration-200;
}

.filter-icon {
  @apply w-4 h-4;
}

.clear-filters-button {
  @apply px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md;
  @apply text-red-600 text-sm font-medium;
  @apply hover:bg-red-500/20 hover:border-red-500/40;
  @apply transition-all duration-200;
}

.search-stats {
  @apply flex items-center justify-between pt-2 border-t border-input-border;
}

.stats-text {
  @apply text-sm text-text-secondary;
}
</style>
