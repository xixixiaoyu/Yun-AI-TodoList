import { analyzeTodo, batchAnalyzeTodos, reanalyzeTodo } from '@/services/aiAnalysisService'
import type { AIAnalysisConfig, Todo } from '@/types/todo'
import { computed, readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'

/**
 * AI 分析功能的 Composable
 * 管理 AI 分析的状态和操作
 */
export function useAIAnalysis() {
  const { t } = useI18n()
  const { showError, showSuccess } = useErrorHandler()

  // 分析状态
  const isAnalyzing = ref(false)
  const isBatchAnalyzing = ref(false)
  const analysisProgress = ref(0)
  const analysisTotal = ref(0)

  // AI 分析配置
  const analysisConfig = ref<AIAnalysisConfig>({
    autoAnalyzeNewTodos: true, // 默认启用自动分析
    enablePriorityAnalysis: true,
    enableTimeEstimation: true,
    enableSubtaskSplitting: false, // 默认关闭子任务拆分
  })

  // 从 localStorage 加载配置
  const loadAnalysisConfig = () => {
    try {
      const saved = localStorage.getItem('ai_analysis_config')
      if (saved) {
        analysisConfig.value = { ...analysisConfig.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('加载 AI 分析配置失败:', error)
    }
  }

  // 保存配置到 localStorage
  const saveAnalysisConfig = () => {
    try {
      localStorage.setItem('ai_analysis_config', JSON.stringify(analysisConfig.value))
    } catch (error) {
      console.warn('保存 AI 分析配置失败:', error)
    }
  }

  // 更新配置
  const updateAnalysisConfig = (config: Partial<AIAnalysisConfig>) => {
    analysisConfig.value = { ...analysisConfig.value, ...config }
    saveAnalysisConfig()
  }

  // 计算属性
  const isAnalysisEnabled = computed(
    () => analysisConfig.value.enablePriorityAnalysis || analysisConfig.value.enableTimeEstimation
  )

  const analysisProgressText = computed(() => {
    if (analysisTotal.value === 0) return ''
    return `${analysisProgress.value}/${analysisTotal.value}`
  })

  /**
   * 分析单个 Todo 项目
   * @param todo Todo 项目
   * @param updateCallback 更新回调函数
   */
  const analyzeSingleTodo = async (
    todo: Todo,
    updateCallback: (id: string, updates: Partial<Todo>) => void
  ) => {
    // 如果正在进行批量分析，则禁止单个分析
    if (!isAnalysisEnabled.value || isAnalyzing.value || isBatchAnalyzing.value) {
      return
    }

    isAnalyzing.value = true
    try {
      const result = await analyzeTodo(todo.title)

      const updates: Partial<Todo> = {
        aiAnalyzed: true,
        updatedAt: new Date().toISOString(),
      }

      if (analysisConfig.value.enablePriorityAnalysis) {
        updates.priority = result.priority
      }

      if (analysisConfig.value.enableTimeEstimation) {
        updates.estimatedTime = result.estimatedTime
      }

      updateCallback(todo.id, updates)

      showSuccess(t('aiAnalysisSuccess', 'AI 分析完成'))
    } catch (error) {
      console.error('AI 分析失败:', error)
      showError(t('aiAnalysisError', 'AI 分析失败，请重试'))
      // AI 分析失败时不更新任何字段，保持原有状态
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 批量分析 Todo 项目
   * @param todos Todo 项目列表
   * @param updateCallback 批量更新回调函数
   */
  const batchAnalyzeTodosAction = async (
    todos: Todo[],
    updateCallback: (updates: Array<{ id: string; updates: Partial<Todo> }>) => void
  ) => {
    console.warn('开始批量分析，分析配置:', analysisConfig.value)
    console.warn('分析功能是否启用:', isAnalysisEnabled.value)
    console.warn('是否正在批量分析:', isBatchAnalyzing.value)
    console.warn('是否正在单个分析:', isAnalyzing.value)

    // 如果正在进行单个分析，则禁止批量分析
    if (!isAnalysisEnabled.value || isBatchAnalyzing.value || isAnalyzing.value) {
      console.warn('批量分析被跳过 - 分析功能未启用、正在批量分析中或正在单个分析中')
      return
    }

    // 过滤出需要分析的 Todo
    const todosToAnalyze = todos.filter((todo) => !todo.aiAnalyzed && !todo.completed)
    console.warn('需要分析的任务数量:', todosToAnalyze.length)

    if (todosToAnalyze.length === 0) {
      showError(t('noTodosToAnalyze', '没有需要分析的待办事项'))
      return
    }

    isBatchAnalyzing.value = true
    analysisProgress.value = 0
    analysisTotal.value = todosToAnalyze.length

    try {
      console.warn('调用批量分析服务...')
      const results = await batchAnalyzeTodos(todosToAnalyze)
      console.warn('批量分析结果:', results)

      const updates: Array<{ id: string; updates: Partial<Todo> }> = []

      todosToAnalyze.forEach((todo) => {
        console.warn(`检查任务 ${todo.id} 的分析结果...`)
        const result = results.get(todo.id)
        console.warn(`任务 ${todo.id} 的分析结果:`, result)

        if (result) {
          const todoUpdates: Partial<Todo> = {
            aiAnalyzed: true,
            updatedAt: new Date().toISOString(),
          }

          if (analysisConfig.value.enablePriorityAnalysis) {
            todoUpdates.priority = result.priority
          }

          if (analysisConfig.value.enableTimeEstimation) {
            todoUpdates.estimatedTime = result.estimatedTime
          }

          updates.push({ id: todo.id, updates: todoUpdates })
          console.warn(`任务 ${todo.id} 添加到更新列表:`, todoUpdates)
        } else {
          console.warn(`任务 ${todo.id} 未找到分析结果`)
        }

        analysisProgress.value++
      })

      console.warn('准备更新的任务数量:', updates.length)

      if (updates.length > 0) {
        updateCallback(updates)
        showSuccess(t('batchAnalysisSuccess', `成功分析了 ${updates.length} 个待办事项`))
      } else {
        showError(t('batchAnalysisNoResults', '批量分析未获得有效结果'))
      }
    } catch (error) {
      console.error('批量 AI 分析失败:', error)
      showError(t('batchAnalysisError', '批量 AI 分析失败，请重试'))
    } finally {
      isBatchAnalyzing.value = false
      analysisProgress.value = 0
      analysisTotal.value = 0
    }
  }

  /**
   * 重新分析 Todo 项目
   * @param todo Todo 项目
   * @param updateCallback 更新回调函数
   */
  const reanalyzeTodoAction = async (
    todo: Todo,
    updateCallback: (id: string, updates: Partial<Todo>) => void
  ) => {
    if (!isAnalysisEnabled.value || isAnalyzing.value) {
      return
    }

    isAnalyzing.value = true
    try {
      const result = await reanalyzeTodo(todo)

      const updates: Partial<Todo> = {
        aiAnalyzed: true,
        updatedAt: new Date().toISOString(),
      }

      if (analysisConfig.value.enablePriorityAnalysis) {
        updates.priority = result.priority
      }

      if (analysisConfig.value.enableTimeEstimation) {
        updates.estimatedTime = result.estimatedTime
      }

      updateCallback(todo.id, updates)

      showSuccess(t('reanalysisSuccess', '重新分析完成'))
    } catch (error) {
      console.error('重新分析失败:', error)
      showError(t('reanalysisError', '重新分析失败，请重试'))
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 手动更新 Todo 的优先级
   * @param todoId Todo ID
   * @param priority 新的优先级
   * @param updateCallback 更新回调函数
   */
  const updateTodoPriority = (
    todoId: number,
    priority: number,
    updateCallback: (id: number, updates: Partial<Todo>) => void
  ) => {
    const validPriority = Math.max(1, Math.min(5, Math.round(priority)))
    updateCallback(todoId, {
      priority: validPriority,
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * 手动更新 Todo 的时间估算
   * @param todoId Todo ID
   * @param estimatedTime 新的时间估算
   * @param updateCallback 更新回调函数
   */
  const updateTodoEstimatedTime = (
    todoId: number,
    estimatedTime: string,
    updateCallback: (id: number, updates: Partial<Todo>) => void
  ) => {
    updateCallback(todoId, {
      estimatedTime: estimatedTime.trim(),
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * 获取优先级对应的星级显示
   * @param priority 优先级数值
   * @returns 星级字符串
   */
  const getPriorityStars = (priority?: number): string => {
    if (!priority) return ''
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, priority)))
    return stars
  }

  /**
   * 获取优先级对应的颜色类名
   * @param priority 优先级数值
   * @returns CSS 类名
   */
  const getPriorityColorClass = (priority?: number): string => {
    if (!priority) return 'text-gray-400'

    switch (priority) {
      case 1:
        return 'text-gray-500'
      case 2:
        return 'text-blue-500'
      case 3:
        return 'text-yellow-500'
      case 4:
        return 'text-orange-500'
      case 5:
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  // 初始化时加载配置
  loadAnalysisConfig()

  return {
    // 状态
    isAnalyzing: readonly(isAnalyzing),
    isBatchAnalyzing: readonly(isBatchAnalyzing),
    analysisProgress: readonly(analysisProgress),
    analysisTotal: readonly(analysisTotal),
    analysisConfig: readonly(analysisConfig),

    // 计算属性
    isAnalysisEnabled,
    analysisProgressText,

    // 方法
    analyzeSingleTodo,
    batchAnalyzeTodosAction,
    reanalyzeTodoAction,
    updateTodoPriority,
    updateTodoEstimatedTime,
    updateAnalysisConfig,
    getPriorityStars,
    getPriorityColorClass,
  }
}
