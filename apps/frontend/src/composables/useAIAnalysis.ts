import { analyzeTodo, batchAnalyzeTodos, reanalyzeTodo } from '@/services/aiAnalysisService'
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
  const isBatchAnalyzing = ref(false)
  const analysisProgress = ref(0)
  const analysisError = ref<string | null>(null)

  // AI 可用性
  const isAIAvailable = ref(true)
  const aiStatusMessage = ref('')

  // AI 配置
  const analysisConfig = ref<AIAnalysisConfig>({
    autoAnalyzeNewTodos: false,
    enablePriorityAnalysis: true,
    enableTimeEstimation: true,
    enableSubtaskSplitting: false,
  })

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
   * 批量分析 Todos
   * @param todos - 要分析的 Todo 列表
   * @param updateCallback - 批量更新 Todos 的回调函数
   */
  const batchAnalyzeTodosAction = async (
    todos: Todo[],
    updateCallback: (updates: Array<{ id: string; updates: Partial<Todo> }>) => void
  ) => {
    if (isBatchAnalyzing.value) return
    isBatchAnalyzing.value = true
    analysisProgress.value = 0
    analysisError.value = null

    try {
      const results = await batchAnalyzeTodos(todos)

      const updates: Array<{ id: string; updates: Partial<Todo> }> = []
      results.forEach((result, id) => {
        const todoUpdates: Partial<Todo> = {
          aiAnalyzed: true,
          updatedAt: new Date().toISOString(),
        }

        if (analysisConfig.value.enablePriorityAnalysis && result.priority) {
          todoUpdates.priority = result.priority as TodoPriority
        }

        if (analysisConfig.value.enableTimeEstimation && result.estimatedTime) {
          todoUpdates.estimatedTime = parseEstimatedTime(result.estimatedTime)
        }

        updates.push({ id, updates: todoUpdates })
      })

      if (updates.length > 0) {
        updateCallback(updates)
      }

      showSuccess(t('ai.batchAnalysisSuccess', { count: updates.length }))
    } catch (error: unknown) {
      analysisError.value = error instanceof Error ? error.message : String(error)
      showError(
        `${t('ai.batchAnalysisFailed')}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      isBatchAnalyzing.value = false
      analysisProgress.value = 0
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

  return {
    isAnalyzing: readonly(isAnalyzing),
    isBatchAnalyzing: readonly(isBatchAnalyzing),
    analysisProgress: readonly(analysisProgress),
    analysisError: readonly(analysisError),
    isAIAvailable: readonly(isAIAvailable),
    aiStatusMessage: readonly(aiStatusMessage),
    analysisConfig: readonly(analysisConfig),
    updateAIAvailability,
    setAnalysisConfig,
    analyzeSingleTodo,
    batchAnalyzeTodosAction,
    reanalyzeTodoAction,
  }
}
