<template>
  <div class="search-settings">
    <div class="settings-header">
      <h3 class="settings-title">🔍 {{ t('searchSettings') }}</h3>
      <button class="close-button" @click="$emit('close')">
        <span>✕</span>
      </button>
    </div>

    <div class="settings-content">
      <!-- 搜索开关 -->
      <div class="setting-item">
        <label class="setting-label">
          <input
            v-model="localConfig.enabled"
            type="checkbox"
            class="setting-checkbox"
            @change="updateSettings"
          />
          <span class="setting-text">{{ t('enableSearch') }}</span>
        </label>
        <p class="setting-description">{{ t('enableSearchDesc') }}</p>
      </div>

      <!-- 智能搜索 -->
      <div v-if="localConfig.enabled" class="setting-item">
        <label class="setting-label">
          <input
            v-model="localConfig.intelligentSearch"
            type="checkbox"
            class="setting-checkbox"
            @change="updateSettings"
          />
          <span class="setting-text">🤖 {{ t('intelligentSearch') }}</span>
        </label>
        <p class="setting-description">{{ t('intelligentSearchDesc') }}</p>
      </div>

      <!-- 搜索结果数量 -->
      <div v-if="localConfig.enabled" class="setting-item">
        <label class="setting-label">
          <span class="setting-text">{{ t('maxResults') }}</span>
          <select v-model="localConfig.maxResults" class="setting-select" @change="updateSettings">
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="8">8</option>
            <option value="10">10</option>
          </select>
        </label>
        <p class="setting-description">{{ t('maxResultsDesc') }}</p>
      </div>

      <!-- 搜索语言 -->
      <div v-if="localConfig.enabled" class="setting-item">
        <label class="setting-label">
          <span class="setting-text">{{ t('searchLocale') }}</span>
          <select v-model="localConfig.locale" class="setting-select" @change="updateSettings">
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </label>
        <p class="setting-description">{{ t('searchLocaleDesc') }}</p>
      </div>

      <!-- 搜索超时 -->
      <div v-if="localConfig.enabled" class="setting-item">
        <label class="setting-label">
          <span class="setting-text">{{ t('searchTimeout') }}</span>
          <select v-model="localConfig.timeout" class="setting-select" @change="updateSettings">
            <option :value="5000">5s</option>
            <option :value="10000">10s</option>
            <option :value="15000">15s</option>
            <option :value="20000">20s</option>
          </select>
        </label>
        <p class="setting-description">{{ t('searchTimeoutDesc') }}</p>
      </div>
    </div>

    <!-- 搜索状态 -->
    <div v-if="isSearching" class="search-status">
      <span class="search-indicator">🔄</span>
      <span>{{ t('searching') }}...</span>
    </div>

    <!-- 最近搜索 -->
    <div v-if="lastSearchContext" class="recent-search">
      <h4 class="recent-title">{{ t('recentSearch') }}</h4>
      <div class="search-result">
        <p class="search-query">{{ lastSearchContext.query }}</p>
        <p class="search-time">{{ formatTime(lastSearchContext.timestamp) }}</p>
        <p class="search-count">{{ lastSearchContext.results.length }} {{ t('results') }}</p>
      </div>
    </div>

    <!-- 搜索规则说明 -->
    <div v-if="localConfig.enabled && localConfig.intelligentSearch" class="search-rules">
      <h4 class="rules-title">🎯 智能搜索规则</h4>
      <div class="rules-content">
        <div class="rule-item">
          <span class="rule-icon">✅</span>
          <div class="rule-text">
            <strong>自动触发搜索：</strong>
            <div class="rule-examples">
              时效性词汇（最新、现在）、事实查询（什么是、谁是）、明确搜索意图
            </div>
          </div>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🤖</span>
          <div class="rule-text">
            <strong>AI 不确定性检测：</strong>
            <div class="rule-examples">检测"我不确定"、"可能"、"据我所知"等表达，自动补充搜索</div>
          </div>
        </div>
        <div class="rule-item">
          <span class="rule-icon">❌</span>
          <div class="rule-text">
            <strong>不触发搜索：</strong>
            <div class="rule-examples">创作类请求（写作、编程）、计算类问题、个人隐私相关</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索数据源说明 -->
    <div v-if="localConfig.enabled" class="search-source-info">
      <div class="source-status real-search">
        <span class="source-icon">🌐</span>
        <div class="source-text">
          <strong>搜索数据源：</strong>
          <span>真实搜索引擎</span>
        </div>
      </div>
      <p class="source-description">
        正在使用真实的搜索引擎获取最新信息，如果服务不可用会自动回退到模拟数据
      </p>
    </div>

    <!-- 手动搜索 -->
    <div v-if="localConfig.enabled" class="manual-search">
      <h4 class="manual-title">{{ t('manualSearch') }}</h4>
      <div class="search-input-group">
        <input
          v-model="manualQuery"
          type="text"
          :placeholder="t('searchPlaceholder')"
          class="search-input"
          :disabled="isSearching"
          @keyup.enter="handleManualSearch"
        />
        <button
          :disabled="isSearching || !manualQuery.trim()"
          class="search-button"
          @click="handleManualSearch"
        >
          {{ isSearching ? '搜索中' : '搜索' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AISearchConfig, SearchContext } from '../../services/aiSearchTool'

interface Props {
  config: AISearchConfig
  isSearching: boolean
  lastSearchContext: SearchContext | null
}

interface Emits {
  (e: 'close'): void
  (e: 'updateConfig', config: AISearchConfig): void
  (e: 'manualSearch', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const localConfig = ref<AISearchConfig>({ ...props.config })
const manualQuery = ref('')

// 监听外部配置变化
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)

// 更新设置
const updateSettings = () => {
  emit('updateConfig', { ...localConfig.value })
}

// 手动搜索
const handleManualSearch = () => {
  if (manualQuery.value.trim()) {
    emit('manualSearch', manualQuery.value.trim())
    manualQuery.value = ''
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

onMounted(() => {
  localConfig.value = { ...props.config }
})
</script>

<style scoped>
.search-settings {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-md w-full;
}

.settings-header {
  @apply flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-600;
}

.settings-title {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200 m-0;
}

.close-button {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded;
}

.settings-content {
  @apply space-y-4;
}

.setting-item {
  @apply space-y-1;
}

.setting-label {
  @apply flex items-center justify-between gap-2 cursor-pointer;
}

.setting-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 flex-1;
}

.setting-checkbox {
  @apply rounded border-gray-300 dark:border-gray-600;
}

.setting-select {
  @apply px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
}

.setting-description {
  @apply text-xs text-gray-500 dark:text-gray-400 m-0 ml-6;
}

.search-status {
  @apply flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300;
}

.search-indicator {
  @apply animate-spin;
}

.recent-search {
  @apply mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded;
}

.recent-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 m-0 mb-2;
}

.search-result {
  @apply space-y-1;
}

.search-query {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 m-0;
}

.search-time {
  @apply text-xs text-gray-500 dark:text-gray-400 m-0;
}

.search-count {
  @apply text-xs text-green-600 dark:text-green-400 m-0;
}

.manual-search {
  @apply mt-4 space-y-2;
}

.manual-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 m-0;
}

.search-input-group {
  @apply flex gap-2;
}

.search-input {
  @apply flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded
         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
         placeholder-gray-500 dark:placeholder-gray-400;
}

.search-button {
  @apply px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400
         text-white rounded font-medium transition-colors;
}

.search-rules {
  @apply mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600;
}

.rules-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 m-0 mb-3;
}

.rules-content {
  @apply space-y-3;
}

.rule-item {
  @apply flex items-start gap-2;
}

.rule-icon {
  @apply text-sm flex-shrink-0 mt-0.5;
}

.rule-text {
  @apply flex-1 text-xs;
}

.rule-text strong {
  @apply text-gray-800 dark:text-gray-200 font-medium;
}

.rule-examples {
  @apply text-gray-600 dark:text-gray-400 mt-1 leading-relaxed;
}

.search-source-info {
  @apply mt-4 p-3 rounded border;
}

.source-status {
  @apply flex items-center gap-2 mb-2;
}

.source-status.real-search {
  @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

.source-icon {
  @apply text-lg flex-shrink-0;
}

.source-text {
  @apply flex-1 text-sm;
}

.source-text strong {
  @apply text-gray-800 dark:text-gray-200 font-medium;
}

.source-text span {
  @apply ml-1;
}

.real-search .source-text span {
  @apply text-green-700 dark:text-green-300 font-medium;
}

.source-description {
  @apply text-xs text-gray-600 dark:text-gray-400 m-0 leading-relaxed;
}
</style>
