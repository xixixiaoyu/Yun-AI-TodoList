<template>
  <div class="responsive-test-page">
    <div class="responsive-container">
      <h1 class="text-responsive-lg font-bold text-center mb-8">响应式设计测试页面</h1>

      <!-- 设备信息显示 -->
      <div
        class="device-info spacing-responsive-sm bg-bg-card rounded-lg border border-input-border mb-6"
      >
        <h2 class="text-responsive-base font-semibold mb-4">当前设备信息</h2>
        <div class="responsive-grid gap-4">
          <div class="info-item">
            <span class="label">屏幕宽度:</span>
            <span class="value">{{ screenWidth }}px</span>
          </div>
          <div class="info-item">
            <span class="label">屏幕高度:</span>
            <span class="value">{{ screenHeight }}px</span>
          </div>
          <div class="info-item">
            <span class="label">设备类型:</span>
            <span class="value">{{ deviceType }}</span>
          </div>
          <div class="info-item">
            <span class="label">断点:</span>
            <span class="value">{{ currentBreakpoint }}</span>
          </div>
        </div>
      </div>

      <!-- AI 消息测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">AI 消息响应式测试</h2>
        <div class="message-test-container space-y-4">
          <!-- 用户消息 -->
          <div class="user-message-responsive">
            <div class="bg-button-bg text-white spacing-responsive-sm rounded-xl">
              <p class="text-responsive-base m-0">
                这是一个用户消息的测试，用来验证在不同设备上的显示效果。
              </p>
            </div>
          </div>

          <!-- AI 消息 -->
          <div class="ai-message-responsive self-start">
            <div class="ai-message-container">
              <p class="text-responsive-base">
                这是一个 AI 助手的回复消息，包含了一些<code>代码片段</code>和**粗体文本**。
              </p>
              <blockquote class="my-4 pl-4 border-l-4 border-primary/60 bg-primary/5 py-2">
                这是一个引用块的示例
              </blockquote>
              <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
console.log('Hello, World!');
              </pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 按钮测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">按钮响应式测试</h2>
        <div class="responsive-flex gap-4">
          <button
            class="button-responsive bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            普通按钮
          </button>
          <button
            class="button-small-responsive bg-secondary text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            小按钮
          </button>
          <button
            class="button-responsive bg-transparent border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            边框按钮
          </button>
        </div>
      </div>

      <!-- 表单测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">表单响应式测试</h2>
        <div class="form-test space-y-4">
          <div class="responsive-flex gap-4">
            <input
              type="text"
              placeholder="搜索..."
              class="flex-1 px-4 py-2.5 bg-input-bg border border-input-border rounded-lg text-responsive-base"
            />
            <button class="button-responsive bg-primary text-white rounded-lg">搜索</button>
          </div>

          <div class="responsive-grid gap-4">
            <select
              class="px-4 py-2.5 bg-input-bg border border-input-border rounded-lg text-responsive-base"
            >
              <option>选项 1</option>
              <option>选项 2</option>
              <option>选项 3</option>
            </select>
            <input
              type="date"
              class="px-4 py-2.5 bg-input-bg border border-input-border rounded-lg text-responsive-base"
            />
          </div>
        </div>
      </div>

      <!-- 卡片网格测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">卡片网格响应式测试</h2>
        <div class="responsive-grid">
          <div
            v-for="i in 8"
            :key="i"
            class="card-item spacing-responsive-sm bg-bg-card border border-input-border rounded-lg"
          >
            <h3 class="text-responsive-base font-medium mb-2">卡片 {{ i }}</h3>
            <p class="text-responsive-sm text-text-secondary">
              这是卡片 {{ i }} 的描述内容，用来测试响应式布局。
            </p>
            <button class="button-small-responsive bg-primary text-white rounded mt-3">操作</button>
          </div>
        </div>
      </div>

      <!-- 间距测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">间距响应式测试</h2>
        <div class="space-y-4">
          <div class="spacing-responsive-sm bg-red-100 dark:bg-red-900/20 rounded">
            小间距 (spacing-responsive-sm)
          </div>
          <div class="spacing-responsive-md bg-green-100 dark:bg-green-900/20 rounded">
            中等间距 (spacing-responsive-md)
          </div>
          <div class="spacing-responsive-lg bg-blue-100 dark:bg-blue-900/20 rounded">
            大间距 (spacing-responsive-lg)
          </div>
        </div>
      </div>

      <!-- 文本测试 -->
      <div class="test-section">
        <h2 class="text-responsive-base font-semibold mb-4">文本响应式测试</h2>
        <div class="space-y-2">
          <p class="text-responsive-sm">小文本 (text-responsive-sm)</p>
          <p class="text-responsive-base">基础文本 (text-responsive-base)</p>
          <p class="text-responsive-lg">大文本 (text-responsive-lg)</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const screenWidth = ref(0)
const screenHeight = ref(0)

const deviceType = computed(() => {
  if (screenWidth.value < 640) return '手机'
  if (screenWidth.value < 768) return '小平板'
  if (screenWidth.value < 1024) return '平板'
  if (screenWidth.value < 1280) return '笔记本'
  return '桌面'
})

const currentBreakpoint = computed(() => {
  if (screenWidth.value < 375) return 'xs'
  if (screenWidth.value < 640) return 'sm'
  if (screenWidth.value < 768) return 'md'
  if (screenWidth.value < 1024) return 'lg'
  if (screenWidth.value < 1280) return 'xl'
  return '2xl'
})

const updateScreenSize = () => {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
}

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})

defineOptions({
  name: 'ResponsiveTest',
})
</script>

<style scoped>
.responsive-test-page {
  @apply min-h-screen bg-bg py-8;
}

.test-section {
  @apply mb-8 spacing-responsive-sm bg-bg-card rounded-lg border border-input-border;
}

.info-item {
  @apply flex justify-between items-center;
}

.label {
  @apply text-text-secondary text-responsive-sm;
}

.value {
  @apply text-text font-medium text-responsive-sm;
}

.message-test-container {
  @apply flex flex-col;
}

.form-test {
  @apply w-full;
}

.card-item {
  @apply transition-all duration-200 hover:shadow-md;
}

/* 响应式调试边框 */
@media (max-width: 639px) {
  .responsive-test-page::before {
    content: 'XS/SM';
    @apply fixed top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs rounded z-50;
  }
}

@media (min-width: 640px) and (max-width: 767px) {
  .responsive-test-page::before {
    content: 'SM';
    @apply fixed top-4 right-4 px-2 py-1 bg-orange-500 text-white text-xs rounded z-50;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .responsive-test-page::before {
    content: 'MD';
    @apply fixed top-4 right-4 px-2 py-1 bg-yellow-500 text-white text-xs rounded z-50;
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .responsive-test-page::before {
    content: 'LG';
    @apply fixed top-4 right-4 px-2 py-1 bg-green-500 text-white text-xs rounded z-50;
  }
}

@media (min-width: 1280px) {
  .responsive-test-page::before {
    content: 'XL+';
    @apply fixed top-4 right-4 px-2 py-1 bg-blue-500 text-white text-xs rounded z-50;
  }
}
</style>
