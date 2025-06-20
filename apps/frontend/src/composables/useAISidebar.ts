import { onMounted, onUnmounted, ref, computed } from 'vue'

/**
 * AI 助手侧边栏状态管理
 * 管理侧边栏的打开/关闭状态、键盘事件监听、宽度调整等
 */
export function useAISidebar() {
  // 侧边栏开关状态
  const isOpen = ref(false)

  // 是否正在执行动画
  const isAnimating = ref(false)

  // 响应式宽度配置
  const getResponsiveConfig = () => {
    const screenWidth = window.innerWidth

    if (screenWidth >= 1536) {
      // 超大屏幕
      return {
        defaultWidth: 900,
        minWidth: 400,
        maxWidth: 1400,
      }
    } else if (screenWidth >= 1024) {
      // 大屏幕
      return {
        defaultWidth: 800,
        minWidth: 350,
        maxWidth: 1200,
      }
    } else if (screenWidth >= 768) {
      // 平板横屏
      return {
        defaultWidth: Math.min(600, screenWidth * 0.7),
        minWidth: 320,
        maxWidth: Math.min(800, screenWidth * 0.8),
      }
    } else if (screenWidth >= 640) {
      // 平板竖屏
      return {
        defaultWidth: Math.min(480, screenWidth * 0.85),
        minWidth: 300,
        maxWidth: Math.min(600, screenWidth * 0.9),
      }
    } else {
      // 移动端
      return {
        defaultWidth: Math.min(screenWidth * 0.95, 400),
        minWidth: 280,
        maxWidth: screenWidth * 0.95,
      }
    }
  }

  // 侧边栏宽度管理
  const responsiveConfig = ref(getResponsiveConfig())
  const defaultWidth = computed(() => responsiveConfig.value.defaultWidth)
  const minWidth = computed(() => responsiveConfig.value.minWidth)
  const maxWidth = computed(() => responsiveConfig.value.maxWidth)
  const sidebarWidth = ref(responsiveConfig.value.defaultWidth) // 当前宽度
  const isDragging = ref(false)

  // 计算侧边栏样式
  const sidebarStyle = computed(() => ({
    width: `${sidebarWidth.value}px`,
    minWidth: `${minWidth.value}px`,
    maxWidth: `${maxWidth.value}px`,
  }))

  // 从 localStorage 加载保存的宽度
  const loadSavedWidth = () => {
    const saved = localStorage.getItem('ai-sidebar-width')
    if (saved) {
      const width = parseInt(saved, 10)
      if (width >= minWidth.value && width <= maxWidth.value) {
        sidebarWidth.value = width
      } else {
        // 如果保存的宽度超出当前屏幕的限制，使用默认宽度
        sidebarWidth.value = defaultWidth.value
      }
    }
  }

  // 保存宽度到 localStorage
  const saveWidth = () => {
    localStorage.setItem('ai-sidebar-width', sidebarWidth.value.toString())
  }

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
    // 立即开始关闭动画
    isOpen.value = false

    // 恢复背景滚动
    document.body.style.overflow = ''

    // 动画完成后重置状态
    setTimeout(() => {
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
   * 需要从外部传入关闭回调函数
   */
  const createOverlayClickHandler = (onClose: () => void) => {
    return (event: Event) => {
      // 确保点击的是遮罩层本身，而不是侧边栏内容
      if (event.target === event.currentTarget) {
        onClose()
      }
    }
  }

  /**
   * 开始拖拽调整宽度
   */
  const startDrag = (event: MouseEvent) => {
    event.preventDefault()
    isDragging.value = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    const startX = event.clientX
    const startWidth = sidebarWidth.value

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = startWidth + deltaX // 向右拖拽增加宽度，向左拖拽减少宽度

      // 限制宽度范围
      sidebarWidth.value = Math.max(minWidth.value, Math.min(maxWidth.value, newWidth))
    }

    const handleMouseUp = () => {
      isDragging.value = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveWidth()

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * 重置侧边栏宽度为默认值
   */
  const resetWidth = () => {
    sidebarWidth.value = defaultWidth.value
    saveWidth()
  }

  // 窗口大小变化处理
  const handleResize = () => {
    const newConfig = getResponsiveConfig()
    responsiveConfig.value = newConfig

    // 如果当前宽度超出新的限制范围，调整到合适的值
    if (sidebarWidth.value > newConfig.maxWidth) {
      sidebarWidth.value = newConfig.maxWidth
      saveWidth()
    } else if (sidebarWidth.value < newConfig.minWidth) {
      sidebarWidth.value = newConfig.minWidth
      saveWidth()
    }
  }

  // 组件挂载时添加键盘监听和加载保存的宽度
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    loadSavedWidth()
    window.addEventListener('resize', handleResize)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
    // 确保恢复背景滚动和拖拽状态
    document.body.style.overflow = ''
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  return {
    isOpen,
    isAnimating,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    createOverlayClickHandler,
    // 宽度管理
    sidebarWidth,
    sidebarStyle,
    isDragging,
    startDrag,
    resetWidth,
    // 响应式配置
    defaultWidth,
    minWidth,
    maxWidth,
  }
}
