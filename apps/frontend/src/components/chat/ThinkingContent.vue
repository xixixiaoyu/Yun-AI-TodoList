<template>
  <div class="thinking-content" :class="thinkingContainerClasses">
    <div class="thinking-header flex items-center justify-between mb-2">
      <h4 class="text-sm font-medium flex items-center" :class="thinkingTitleClasses">
        {{ t('thinking.title') }}
      </h4>
      <button
        class="transition-colors duration-200 p-1 rounded"
        :class="thinkingButtonClasses"
        :aria-label="isExpanded ? t('thinking.collapse') : t('thinking.expand')"
        @click="toggleExpanded"
      >
        <svg
          class="w-4 h-4 transform transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>

    <div
      class="thinking-body overflow-hidden transition-all duration-300 ease-in-out"
      :style="{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }"
    >
      <div
        ref="contentRef"
        class="thinking-text text-sm whitespace-pre-wrap leading-relaxed"
        :class="thinkingTextClasses"
      >
        {{ content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  content: string
  defaultExpanded?: boolean
  autoCollapse?: boolean
  aiResponseStarted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: true,
  autoCollapse: false,
})

const { t } = useI18n()

const isExpanded = ref(props.defaultExpanded)
const contentRef = ref<HTMLElement>()
const contentHeight = ref(0)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const updateContentHeight = async () => {
  if (!contentRef.value) return

  await nextTick()

  // 临时展开以测量高度
  const originalDisplay = contentRef.value.style.display
  const originalMaxHeight = contentRef.value.style.maxHeight

  contentRef.value.style.display = 'block'
  contentRef.value.style.maxHeight = 'none'

  contentHeight.value = contentRef.value.scrollHeight

  // 恢复原始样式
  contentRef.value.style.display = originalDisplay
  contentRef.value.style.maxHeight = originalMaxHeight
}

// 主题样式类
const thinkingContainerClasses = computed(() => [
  'mb-2 rounded-lg border p-3',
  'bg-ai-message-bg border-ai-message-border',
  'shadow-sm hover:shadow-md transition-all duration-200',
])

const thinkingTitleClasses = computed(() => ['text-primary-color'])

const thinkingButtonClasses = computed(() => ['text-primary-color hover:bg-ai-accent-hover'])

const thinkingTextClasses = computed(() => ['text-text-secondary-color'])

// 监听内容变化
watch(
  () => props.content,
  (newContent, oldContent) => {
    updateContentHeight()

    // 如果启用自动折叠且内容从空变为有内容，则展开
    if (props.autoCollapse && !oldContent && newContent) {
      isExpanded.value = true
    }
    // 如果启用自动折叠且内容稳定（思考完成），延迟折叠
    if (props.autoCollapse && newContent && oldContent && newContent === oldContent) {
      setTimeout(() => {
        isExpanded.value = false
      }, 3000) // 3秒后自动折叠
    }
  },
  { immediate: true }
)

// 监听 AI 回复开始状态
watch(
  () => props.aiResponseStarted,
  (started) => {
    // 当 AI 回复开始时，立即折叠思考内容
    if (started && props.autoCollapse) {
      isExpanded.value = false
    }
  }
)

// 组件挂载后计算高度
onMounted(() => {
  updateContentHeight()
})

defineOptions({
  name: 'ThinkingContent',
})
</script>

<style scoped>
.thinking-content {
  background: var(--ai-message-bg);
  border-color: var(--ai-message-border);
  color: var(--text-color);
}

.thinking-header h4 {
  color: var(--primary-color);
}

.thinking-header button {
  color: var(--primary-color);
}

.thinking-header button:hover {
  background-color: var(--ai-accent-hover);
}

.thinking-text {
  color: var(--text-secondary-color);
  font-family:
    'LXGW WenKai Lite Medium',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.thinking-body {
  transition: max-height 0.3s ease-in-out;
}
</style>
