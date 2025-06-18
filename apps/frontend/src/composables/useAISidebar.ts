import { onMounted, onUnmounted, ref } from 'vue'

/**
 * AI 助手侧边栏状态管理
 * 管理侧边栏的打开/关闭状态、键盘事件监听等
 */
export function useAISidebar() {
  // 侧边栏开关状态
  const isOpen = ref(false)

  // 是否正在执行动画
  const isAnimating = ref(false)

  /**
   * 打开侧边栏
   */
  const openSidebar = () => {
    if (isAnimating.value) return

    isAnimating.value = true
    isOpen.value = true

    // 防止背景滚动
    document.body.style.overflow = 'hidden'

    // 动画完成后重置状态
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }

  /**
   * 关闭侧边栏
   */
  const closeSidebar = () => {
    if (isAnimating.value) return

    isAnimating.value = true

    // 恢复背景滚动
    document.body.style.overflow = ''

    // 延迟关闭以显示动画
    setTimeout(() => {
      isOpen.value = false
      isAnimating.value = false
    }, 300)
  }

  /**
   * 切换侧边栏状态
   */
  const toggleSidebar = () => {
    if (isOpen.value) {
      closeSidebar()
    } else {
      openSidebar()
    }
  }

  /**
   * ESC 键监听处理
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) {
      closeSidebar()
    }
  }

  /**
   * 点击遮罩层关闭
   */
  const handleOverlayClick = (event: Event) => {
    // 确保点击的是遮罩层本身，而不是侧边栏内容
    if (event.target === event.currentTarget) {
      closeSidebar()
    }
  }

  // 组件挂载时添加键盘监听
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    // 确保恢复背景滚动
    document.body.style.overflow = ''
  })

  return {
    isOpen,
    isAnimating,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    handleOverlayClick,
  }
}
