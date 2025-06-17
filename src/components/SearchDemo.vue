<template>
  <div class="search-demo">
    <h2 class="demo-title">🔍 AI 搜索功能演示</h2>

    <div class="demo-section">
      <h3>智能关键词识别</h3>
      <div class="test-cases">
        <div
          v-for="testCase in keywordTests"
          :key="testCase.query"
          class="test-case"
          @click="testQuery(testCase.query)"
        >
          <div class="test-query">{{ testCase.query }}</div>
          <div
            class="test-result"
            :class="testCase.shouldTrigger ? 'should-trigger' : 'should-not-trigger'"
          >
            {{ testCase.shouldTrigger ? '✅ 应该触发搜索' : '❌ 不应该触发搜索' }}
          </div>
          <div class="test-reasons">{{ testCase.reasons.join(', ') }}</div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>AI 不确定性检测</h3>
      <div class="test-cases">
        <div
          v-for="testCase in uncertaintyTests"
          :key="testCase.response"
          class="test-case"
          @click="testUncertainty(testCase.response)"
        >
          <div class="test-query">AI 回答：{{ testCase.response }}</div>
          <div class="test-result" :class="testCase.isUncertain ? 'is-uncertain' : 'is-certain'">
            {{ testCase.isUncertain ? '🤖 检测到不确定性' : '✅ 回答确定' }}
          </div>
          <div class="test-reasons">{{ testCase.reasons.join(', ') }}</div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>实时测试</h3>
      <div class="live-test">
        <input
          v-model="testInput"
          type="text"
          placeholder="输入问题测试关键词识别..."
          class="test-input"
          @input="analyzeInput"
        />
        <div v-if="analysisResult" class="analysis-result">
          <div class="analysis-item">
            <strong>需要搜索：</strong>
            <span :class="analysisResult.needsSearch ? 'text-green-600' : 'text-red-600'">
              {{ analysisResult.needsSearch ? '是' : '否' }}
            </span>
          </div>
          <div class="analysis-item">
            <strong>置信度：</strong>
            <span>{{ (analysisResult.confidence * 100).toFixed(1) }}%</span>
          </div>
          <div class="analysis-item">
            <strong>原因：</strong>
            <span>{{ analysisResult.reasons.join(', ') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAISearch } from '../services/aiSearchTool'

const { analyzeSearchNeed, analyzeResponseUncertainty } = useAISearch()

const testInput = ref('')
const analysisResult = ref<Record<string, unknown> | null>(null)

const keywordTests = [
  {
    query: '最新的 iPhone 15 价格是多少？',
    shouldTrigger: true,
    reasons: ['时效性关键词', '价格查询'],
  },
  {
    query: '什么是人工智能？',
    shouldTrigger: true,
    reasons: ['事实性查询'],
  },
  {
    query: '帮我写一个 Python 函数',
    shouldTrigger: false,
    reasons: ['创作类请求'],
  },
  {
    query: '今天北京的天气怎么样？',
    shouldTrigger: true,
    reasons: ['时效性关键词', '天气查询'],
  },
  {
    query: '你好，谢谢',
    shouldTrigger: false,
    reasons: ['日常问候'],
  },
  {
    query: '搜索一下最近的新闻',
    shouldTrigger: true,
    reasons: ['明确搜索意图', '时效性关键词'],
  },
]

const uncertaintyTests = [
  {
    response: '我不确定这个问题的答案，建议您查询最新资料。',
    isUncertain: true,
    reasons: ['明确表达不确定', '建议获取更多信息'],
  },
  {
    response: '根据我的了解，这可能是因为技术更新导致的。',
    isUncertain: true,
    reasons: ['使用不确定词汇', '限定知识范围'],
  },
  {
    response: 'Python 是一种高级编程语言，具有简洁的语法和强大的功能。',
    isUncertain: false,
    reasons: ['回答确定明确'],
  },
  {
    response: '抱歉，我没有这方面的最新信息。',
    isUncertain: true,
    reasons: ['承认缺乏信息', '表达歉意'],
  },
]

const testQuery = (query: string) => {
  const result = analyzeSearchNeed(query)
  console.warn('关键词识别测试:', { query, result })
}

const testUncertainty = (response: string) => {
  const result = analyzeResponseUncertainty(response)
  console.warn('不确定性检测测试:', { response, result })
}

const analyzeInput = () => {
  if (testInput.value.trim()) {
    analysisResult.value = analyzeSearchNeed(testInput.value)
  } else {
    analysisResult.value = null
  }
}
</script>

<style scoped>
.search-demo {
  @apply p-6 max-w-4xl mx-auto;
}

.demo-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6;
}

.demo-section {
  @apply mb-8;
}

.demo-section h3 {
  @apply text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4;
}

.test-cases {
  @apply space-y-3;
}

.test-case {
  @apply p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer
         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.test-query {
  @apply font-medium text-gray-800 dark:text-gray-200 mb-2;
}

.test-result {
  @apply text-sm font-medium mb-1;
}

.should-trigger {
  @apply text-green-600;
}

.should-not-trigger {
  @apply text-red-600;
}

.is-uncertain {
  @apply text-orange-600;
}

.is-certain {
  @apply text-green-600;
}

.test-reasons {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.live-test {
  @apply space-y-4;
}

.test-input {
  @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
}

.analysis-result {
  @apply p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2;
}

.analysis-item {
  @apply text-sm;
}

.analysis-item strong {
  @apply text-gray-700 dark:text-gray-300;
}
</style>
