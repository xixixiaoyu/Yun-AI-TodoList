import { analyzeTodo, reanalyzeTodo } from '@/services/aiAnalysisService'
import { checkAIAvailability, getAIStatusMessage } from '@/services/aiConfigService'
import type { AIAnalysisConfig } from '@/types/todo'
import type { TimeEstimate, Todo, TodoPriority } from '@shared/types/todo'
import { readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'

/**
 * AI 分析相关的功能
 */
export function useAIAnalysis() {
  const { t } = useI18n()

  const parseEstimatedTime = (timeString: string | undefined): TimeEstimate | undefined => {
    if (!timeString) return undefined
    const match = timeString.match(/([0-9.]+)\s*(分钟|小时|天|minute|hour|day)/i)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      let minutes = value
      if (unit.startsWith('h') || unit === '小时') {
        minutes = value * 60
      } else if (unit.startsWith('d') || unit === '天') {
        minutes = value * 60 * 24
      }
      return { text: timeString, minutes }
    }
    return undefined
  }

  const { showError, showSuccess } = useErrorHandler()

  // 分析状态
  const isAnalyzing = ref(false)
  const analysisError = ref<string | null>(null)

  // AI 可用性
  const isAIAvailable = ref(true)
  const aiStatusMessage = ref('')

  // AI 配置
  const analysisConfig = ref<AIAnalysisConfig>({
    autoAnalyzeNewTodos: true,
    enablePriorityAnalysis: true,
    enableTimeEstimation: true,
    enableSubtaskSplitting: false,
  })

  // 从 localStorage 加载配置
  const loadAnalysisConfig = () => {
    try {
      const saved = localStorage.getItem('aiAnalysisConfig')
      if (saved) {
        const config = JSON.parse(saved)
        analysisConfig.value = { ...analysisConfig.value, ...config }
      }
    } catch (error) {
      console.warn('Failed to load AI analysis config:', error)
    }
  }

  // 保存配置到 localStorage
  const saveAnalysisConfig = () => {
    try {
      localStorage.setItem('aiAnalysisConfig', JSON.stringify(analysisConfig.value))
    } catch (error) {
      console.warn('Failed to save AI analysis config:', error)
    }
  }

  // 初始化时加载配置
  loadAnalysisConfig()

  // 分析功能开关
  const isAnalysisEnabled = ref(true)

  /**
   * 更新 AI 可用性状态
   */
  const updateAIAvailability = async () => {
    isAIAvailable.value = await checkAIAvailability()
    aiStatusMessage.value = getAIStatusMessage()
  }

  /**
   * 设置 AI 分析配置
   * @param config - AI 分析配置
   */
  const setAnalysisConfig = (config: Partial<AIAnalysisConfig>) => {
    analysisConfig.value = { ...analysisConfig.value, ...config }
    saveAnalysisConfig()
  }

  /**
   * 分析单个 Todo
   * @param todo - 要分析的 Todo
   * @param updateCallback - 更新 Todo 的回调函数
   * @param options - 可选参数
   */
  const analyzeSingleTodo = async (
    todo: Todo,
    updateCallback: (id: string, updates: Partial<Todo>) => void,
    options: { silent?: boolean; showSuccess?: boolean } = {}
  ) => {
    if (isAnalyzing.value) return
    isAnalyzing.value = true
    analysisError.value = null

    try {
      const result = await analyzeTodo(todo.title)

      const updates: Partial<Todo> = {
        aiAnalyzed: true,
        updatedAt: new Date().toISOString(),
      }

      if (analysisConfig.value.enablePriorityAnalysis && result.priority) {
        updates.priority = result.priority as TodoPriority
      }

      if (analysisConfig.value.enableTimeEstimation && result.estimatedTime) {
        updates.estimatedTime = parseEstimatedTime(result.estimatedTime)
      }

      updateCallback(todo.id, updates)

      if (options.showSuccess) {
        showSuccess(t('ai.analysisSuccess'))
      }
    } catch (error: unknown) {
      analysisError.value = error instanceof Error ? error.message : String(error)
      if (!options.silent) {
        showError(
          `${t('ai.analysisFailed')}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 重新分析单个 Todo
   * @param todo - 要重新分析的 Todo
   * @param updateCallback - 更新 Todo 的回调函数
   */
  const reanalyzeTodoAction = async (
    todo: Todo,
    updateCallback: (id: string, updates: Partial<Todo>) => void
  ) => {
    if (isAnalyzing.value) return
    isAnalyzing.value = true
    analysisError.value = null

    try {
      const result = await reanalyzeTodo(todo)

      const updates: Partial<Todo> = {
        aiAnalyzed: true,
        updatedAt: new Date().toISOString(),
      }

      if (analysisConfig.value.enablePriorityAnalysis && result.priority) {
        updates.priority = result.priority as TodoPriority
      }

      if (analysisConfig.value.enableTimeEstimation && result.estimatedTime) {
        updates.estimatedTime = parseEstimatedTime(result.estimatedTime)
      }

      updateCallback(todo.id, updates)

      showSuccess(t('ai.reAnalysisSuccess'))
    } catch (error: unknown) {
      analysisError.value = error instanceof Error ? error.message : String(error)
      showError(
        `${t('ai.reAnalysisFailed')}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 获取优先级星级显示
   * @param priority - 优先级 (1-5)
   * @returns 对应的星级字符串
   */
  const getPriorityStars = (priority?: number): string => {
    if (!priority || priority < 1 || priority > 5) return ''
    return '⭐'.repeat(priority)
  }

  /**
   * 获取优先级颜色类
   * @param priority - 优先级 (1-5)
   * @returns 对应的颜色类名
   */
  const getPriorityColorClass = (priority: number): string => {
    switch (priority) {
      case 1:
        return 'text-gray-500'
      case 2:
        return 'text-blue-500'
      case 3:
        return 'text-green-500'
      case 4:
        return 'text-yellow-500'
      case 5:
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return {
    isAnalyzing: readonly(isAnalyzing),
    analysisError: readonly(analysisError),
    isAIAvailable: readonly(isAIAvailable),
    aiStatusMessage: readonly(aiStatusMessage),
    analysisConfig: readonly(analysisConfig),
    isAnalysisEnabled: readonly(isAnalysisEnabled), // 添加缺失的变量
    updateAIAvailability,
    setAnalysisConfig,
    analyzeSingleTodo,
    reanalyzeTodoAction,
    getPriorityStars, // 添加工具函数
    getPriorityColorClass, // 添加工具函数
  }
}
