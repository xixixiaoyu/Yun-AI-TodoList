import {
  analyzeAdvancedUserContext,
  generateTasksWithRetry,
  optimizeGeneratedTasks,
  validateGeneratedTasks,
} from '@/services/aiTaskGenerationService'
import type {
  AITaskGenerationRequest,
  AITaskGenerationResult,
  GeneratedTask,
  TaskGenerationConfig,
  Todo,
} from '@/types/todo'
import { computed, reactive, readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotifications } from './useNotifications'

/**
 * 任务生成状态
 */
interface TaskGenerationState {
  isGenerating: boolean
  showDialog: boolean
  currentRequest: AITaskGenerationRequest | null
  generatedTasks: GeneratedTask[]
  selectedTasks: Set<number> // 选中的任务索引
  editingTask: number | null // 正在编辑的任务索引
  validationResult: {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } | null
  lastResult: AITaskGenerationResult | null
}

/**
 * 任务生成配置
 */
interface TaskGenerationOptions {
  maxTasks?: number
  enablePriorityAnalysis?: boolean
  enableTimeEstimation?: boolean
  includeSubtasks?: boolean
  taskComplexity?: 'simple' | 'medium' | 'complex'
}

/**
 * 任务生成组合式函数
 * 管理 AI 任务生成的状态和逻辑
 */
export function useTaskGeneration() {
  const { t: _t } = useI18n()
  const { success, error, warning } = useNotifications()

  // 状态管理
  const state = reactive<TaskGenerationState>({
    isGenerating: false,
    showDialog: false,
    currentRequest: null,
    generatedTasks: [],
    selectedTasks: new Set(),
    editingTask: null,
    validationResult: null,
    lastResult: null,
  })

  // 用于取消生成的 AbortController
  let abortController: AbortController | null = null

  // 配置管理
  const config = ref<TaskGenerationOptions>({
    maxTasks: 0, // 0 表示自动判断
    enablePriorityAnalysis: true,
    enableTimeEstimation: true,
    includeSubtasks: false,
    taskComplexity: 'medium',
  })

  // 计算属性
  const hasGeneratedTasks = computed(() => state.generatedTasks.length > 0)
  const selectedTasksCount = computed(() => state.selectedTasks.size)
  const canConfirm = computed(() => selectedTasksCount.value > 0)
  const hasValidationIssues = computed(
    () => state.validationResult && !state.validationResult.isValid
  )

  /**
   * 生成任务
   * @param description 任务描述
   * @param existingTodos 现有任务列表（用于上下文分析）
   * @param options 生成选项
   */
  const generateTasks = async (
    description: string,
    existingTodos: Todo[] = [],
    options: Partial<TaskGenerationOptions> = {}
  ): Promise<void> => {
    if (state.isGenerating) {
      warning('任务生成中', '请等待当前任务生成完成')
      return
    }

    if (!description.trim()) {
      error('输入错误', '请输入任务描述')
      return
    }

    state.isGenerating = true
    state.generatedTasks = []
    state.selectedTasks.clear()
    state.validationResult = null

    // 创建新的 AbortController
    abortController = new AbortController()

    try {
      // 分析用户上下文
      const userContext = analyzeAdvancedUserContext(existingTodos)

      // 构建请求
      const request: AITaskGenerationRequest = {
        description: description.trim(),
        context: {
          existingTodos,
          userPreferences: userContext.preferences,
          timeframe: '本周', // 可以根据需要调整
        },
        config: {
          ...config.value,
          ...options,
        } as TaskGenerationConfig,
      }

      state.currentRequest = request

      // 检查是否已被取消
      if (abortController?.signal.aborted) {
        throw new Error('Generation cancelled by user')
      }

      // 调用 AI 服务生成任务
      const result = await generateTasksWithRetry(request)

      // 再次检查是否已被取消
      if (abortController?.signal.aborted) {
        throw new Error('Generation cancelled by user')
      }

      state.lastResult = result

      if (result.success && result.tasks.length > 0) {
        // 优化生成的任务
        const optimizedTasks = optimizeGeneratedTasks(result.tasks)
        state.generatedTasks = optimizedTasks

        // 默认选中所有任务
        state.selectedTasks = new Set(optimizedTasks.map((_, index) => index))

        // 验证任务质量
        state.validationResult = validateGeneratedTasks(optimizedTasks)

        // 显示对话框
        state.showDialog = true

        success('任务生成成功', `已生成 ${optimizedTasks.length} 个任务`)

        // 如果有验证问题，显示警告
        if (!state.validationResult.isValid) {
          warning(
            '任务质量提醒',
            `发现 ${state.validationResult.issues.length} 个问题，请检查后确认`
          )
        }
      } else {
        error('任务生成失败', result.error || '未知错误')
      }
    } catch (err) {
      // 检查是否是用户主动取消
      if (
        err instanceof Error &&
        (err.name === 'AbortError' || err.message === 'Generation cancelled by user')
      ) {
        console.log('任务生成已被用户取消')
        return
      }

      console.error('任务生成失败:', err)
      error('任务生成失败', '请检查网络连接或稍后重试')
    } finally {
      state.isGenerating = false
      abortController = null
    }
  }

  /**
   * 切换任务选择状态
   * @param index 任务索引
   */
  const toggleTaskSelection = (index: number): void => {
    if (state.selectedTasks.has(index)) {
      state.selectedTasks.delete(index)
    } else {
      state.selectedTasks.add(index)
    }
  }

  /**
   * 全选/取消全选任务
   */
  const toggleAllTasks = (): void => {
    if (state.selectedTasks.size === state.generatedTasks.length) {
      state.selectedTasks.clear()
    } else {
      state.selectedTasks = new Set(state.generatedTasks.map((_, index) => index))
    }
  }

  /**
   * 开始编辑任务
   * @param index 任务索引
   */
  const startEditTask = (index: number): void => {
    state.editingTask = index
  }

  /**
   * 保存任务编辑
   * @param index 任务索引
   * @param updatedTask 更新的任务数据
   */
  const saveTaskEdit = (index: number, updatedTask: Partial<GeneratedTask>): void => {
    if (index >= 0 && index < state.generatedTasks.length) {
      state.generatedTasks[index] = {
        ...state.generatedTasks[index],
        ...updatedTask,
      }
      state.editingTask = null

      // 重新验证任务
      state.validationResult = validateGeneratedTasks(state.generatedTasks)
    }
  }

  /**
   * 取消任务编辑
   */
  const cancelTaskEdit = (): void => {
    state.editingTask = null
  }

  /**
   * 删除任务
   * @param index 任务索引
   */
  const deleteTask = (index: number): void => {
    if (index >= 0 && index < state.generatedTasks.length) {
      state.generatedTasks.splice(index, 1)

      // 更新选中状态
      const newSelectedTasks = new Set<number>()
      for (const selectedIndex of state.selectedTasks) {
        if (selectedIndex < index) {
          newSelectedTasks.add(selectedIndex)
        } else if (selectedIndex > index) {
          newSelectedTasks.add(selectedIndex - 1)
        }
      }
      state.selectedTasks = newSelectedTasks

      // 重新验证任务
      state.validationResult = validateGeneratedTasks(state.generatedTasks)
    }
  }

  /**
   * 获取选中的任务
   */
  const getSelectedTasks = (): GeneratedTask[] => {
    return Array.from(state.selectedTasks)
      .sort((a, b) => a - b)
      .map((index) => state.generatedTasks[index])
      .filter(Boolean)
  }

  /**
   * 关闭对话框
   */
  const closeDialog = (): void => {
    state.showDialog = false
    state.generatedTasks = []
    state.selectedTasks.clear()
    state.editingTask = null
    state.validationResult = null
    state.currentRequest = null
    state.lastResult = null
  }

  /**
   * 确认并返回选中的任务
   */
  const confirmTasks = (): GeneratedTask[] => {
    const selectedTasks = getSelectedTasks()
    closeDialog()
    return selectedTasks
  }

  /**
   * 重新生成任务
   */
  const regenerateTasks = async (): Promise<void> => {
    if (state.currentRequest) {
      const { description, context } = state.currentRequest
      await generateTasks(description, context?.existingTodos || [])
    }
  }

  /**
   * 停止任务生成
   */
  const stopGeneration = (): void => {
    if (abortController && state.isGenerating) {
      abortController.abort()
      state.isGenerating = false
      abortController = null

      // 重置生成相关状态，但保持对话框打开
      state.generatedTasks = []
      state.selectedTasks.clear()
      state.editingTask = null
      state.validationResult = null
      // 保留 currentRequest，这样用户可以重新生成
    }
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  const updateConfig = (newConfig: Partial<TaskGenerationOptions>): void => {
    config.value = { ...config.value, ...newConfig }
  }

  return {
    // 状态
    state: readonly(state),
    config: readonly(config),

    // 计算属性
    hasGeneratedTasks,
    selectedTasksCount,
    canConfirm,
    hasValidationIssues,

    // 方法
    generateTasks,
    stopGeneration,
    toggleTaskSelection,
    toggleAllTasks,
    startEditTask,
    saveTaskEdit,
    cancelTaskEdit,
    deleteTask,
    getSelectedTasks,
    closeDialog,
    confirmTasks,
    regenerateTasks,
    updateConfig,
  }
}
