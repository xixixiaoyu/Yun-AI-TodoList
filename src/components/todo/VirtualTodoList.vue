<template>
  <div ref="containerRef" class="virtual-todo-list">
    <div
      class="virtual-list-container"
      :style="{ height: `${containerHeight}px` }"
      @scroll="handleScroll"
    >
      <div class="virtual-list-spacer" :style="{ height: `${totalHeight}px` }">
        <div class="virtual-list-items" :style="{ transform: `translateY(${offsetY}px)` }">
          <div
            v-for="item in visibleItems"
            :key="item.data.id"
            class="virtual-list-item"
            :style="{ height: `${itemHeight}px` }"
            :data-index="item.index"
          >
            <TodoItem
              :todo="item.data"
              :class="{
                'todo-item-entering': item.isEntering,
                'todo-item-leaving': item.isLeaving
              }"
              @toggle="handleToggle"
              @remove="handleRemove"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动指示器 -->
    <div v-if="showScrollIndicator" class="scroll-indicator">
      <div class="scroll-thumb" :style="scrollThumbStyle"></div>
    </div>

    <!-- 性能统计 -->
    <div v-if="showPerformanceStats" class="performance-stats">
      <div class="stat">{{ t('virtualList.totalItems', 'Total') }}: {{ totalItems }}</div>
      <div class="stat">
        {{ t('virtualList.visibleItems', 'Visible') }}: {{ visibleItems.length }}
      </div>
      <div class="stat">{{ t('virtualList.renderTime', 'Render') }}: {{ renderTime }}ms</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoItem from './TodoItem.vue'
import type { Todo } from '@/types/todo'
import { usePerformanceMonitor } from '@/utils/performance'

// 本地类型定义
type ScrollBehavior = 'auto' | 'smooth'

interface VirtualListItem {
  data: Todo
  index: number
  isEntering?: boolean
  isLeaving?: boolean
}

interface Props {
  items: Todo[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  showScrollIndicator?: boolean
  showPerformanceStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  showScrollIndicator: true,
  showPerformanceStats: false
})

const emit = defineEmits<{
  toggle: [todo: Todo]
  remove: [todo: Todo]
  scroll: [{ scrollTop: number; scrollLeft: number }]
}>()

const { t } = useI18n()
const { measure } = usePerformanceMonitor()

// 响应式状态
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const visibleItems = ref<VirtualListItem[]>([])
const renderTime = ref(0)

// 计算属性
const totalItems = computed(() => props.items.length)
const totalHeight = computed(() => totalItems.value * props.itemHeight)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight)
  return Math.max(0, index - props.overscan)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  const index = startIndex.value + visibleCount + props.overscan * 2
  return Math.min(totalItems.value - 1, index)
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

const scrollThumbStyle = computed(() => {
  if (totalHeight.value <= props.containerHeight) {
    return { display: 'none' }
  }

  const thumbHeight = Math.max(
    20,
    (props.containerHeight / totalHeight.value) * props.containerHeight
  )
  const thumbTop = (scrollTop.value / totalHeight.value) * props.containerHeight

  return {
    height: `${thumbHeight}px`,
    transform: `translateY(${thumbTop}px)`
  }
})

// 方法
const updateVisibleItems = () => {
  const startTime = performance.now()

  const newVisibleItems: VirtualListItem[] = []

  for (let i = startIndex.value; i <= endIndex.value; i++) {
    if (i >= 0 && i < props.items.length) {
      newVisibleItems.push({
        data: props.items[i],
        index: i
      })
    }
  }

  // 处理进入和离开动画
  const prevItemIds = new Set(visibleItems.value.map(item => item.data.id))
  const newItemIds = new Set(newVisibleItems.map(item => item.data.id))

  // 标记新进入的项目
  newVisibleItems.forEach(item => {
    if (!prevItemIds.has(item.data.id)) {
      item.isEntering = true
      // 移除进入标记
      nextTick(() => {
        item.isEntering = false
      })
    }
  })

  // 标记即将离开的项目
  visibleItems.value.forEach(item => {
    if (!newItemIds.has(item.data.id)) {
      item.isLeaving = true
    }
  })

  visibleItems.value = newVisibleItems
  renderTime.value = Math.round(performance.now() - startTime)
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop

  emit('scroll', {
    scrollTop: target.scrollTop,
    scrollLeft: target.scrollLeft
  })

  // 使用 requestAnimationFrame 优化滚动性能
  requestAnimationFrame(() => {
    measure('virtual-list-update', updateVisibleItems, 'render')
  })
}

const handleToggle = (todo: Todo) => {
  emit('toggle', todo)
}

const handleRemove = (todo: Todo) => {
  emit('remove', todo)
}

// 公开方法
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return

  const targetScrollTop = index * props.itemHeight
  containerRef.value.querySelector('.virtual-list-container')?.scrollTo({
    top: targetScrollTop,
    behavior
  })
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(0, behavior)
}

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(totalItems.value - 1, behavior)
}

const getVisibleRange = () => {
  return {
    start: startIndex.value,
    end: endIndex.value,
    total: totalItems.value
  }
}

// 监听器
watch(
  () => props.items,
  () => {
    updateVisibleItems()
  },
  { deep: true }
)

watch([startIndex, endIndex], () => {
  updateVisibleItems()
})

// 生命周期
onMounted(() => {
  updateVisibleItems()

  // 监听容器大小变化
  if (containerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateVisibleItems()
    })
    resizeObserver.observe(containerRef.value)

    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleRange
})
</script>

<style scoped>
.virtual-todo-list {
  position: relative;
  width: 100%;
  height: 100%;
}

.virtual-list-container {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-list-spacer {
  position: relative;
  width: 100%;
}

.virtual-list-items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-list-item {
  width: 100%;
  box-sizing: border-box;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.todo-item-entering {
  animation: slideInFromRight 0.3s ease-out;
}

.todo-item-leaving {
  animation: slideOutToLeft 0.3s ease-in;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutToLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.scroll-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: var(--border-color);
  border-radius: 2px;
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.virtual-todo-list:hover .scroll-indicator {
  opacity: 0.6;
}

.scroll-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: transform 0.1s ease;
}

.performance-stats {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  font-size: 0.7rem;
  border-radius: 4px;
  z-index: 10;
}

.stat {
  margin-bottom: 0.25rem;
}

.stat:last-child {
  margin-bottom: 0;
}

/* 自定义滚动条样式 */
.virtual-list-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: var(--border-color);
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .virtual-list-item {
    padding: 0 0.5rem;
  }

  .performance-stats {
    font-size: 0.6rem;
    padding: 0.25rem;
  }

  .scroll-indicator {
    width: 3px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .scroll-indicator {
    opacity: 0.8;
  }

  .virtual-todo-list:hover .scroll-indicator {
    opacity: 1;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .virtual-list-item,
  .todo-item-entering,
  .todo-item-leaving {
    transition: none;
    animation: none;
  }

  .scroll-thumb {
    transition: none;
  }
}
</style>
