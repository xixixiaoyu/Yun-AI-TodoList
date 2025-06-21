import { ref, reactive } from 'vue'
import type { SubtaskSelectionConfig, AISubtaskResult } from '@/types/todo'
import { analyzeTaskSplitting } from '@/services/aiAnalysisService'
import { handleError } from '@/utils/logger'

/**
 * 任务拆分管理组合式函数
 * 提供任务拆分分析和用户选择界面的状态管理
 */
export function useTaskSplitting() {
  // 拆分对话框配置
  const subtaskConfig = reactive<SubtaskSelectionConfig>({
    showDialog: false,
    originalTask: '',
    subtasks: [],
    reasoning: '',
  })

  // 加载状态
  const isAnalyzing = ref(false)

  /**
   * 分析任务是否可以拆分
   * @param todoText 待办事项文本
   * @returns AI 拆分分析结果
   */
  async function analyzeTask(todoText: string): Promise<AISubtaskResult> {
    isAnalyzing.value = true
    try {
      const result = await analyzeTaskSplitting(todoText)
      return result
    } catch (error) {
      console.error('任务拆分分析失败:', error)
      handleError(error, '任务拆分分析失败')

      // 返回默认结果
      return {
        canSplit: false,
        subtasks: [],
        reasoning: '分析失败，请稍后重试',
        originalTask: todoText,
      }
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 显示任务拆分选择对话框
   * @param result AI 拆分分析结果
   */
  function showSubtaskDialog(result: AISubtaskResult) {
    if (result.canSplit && result.subtasks.length > 0) {
      subtaskConfig.showDialog = true
      subtaskConfig.originalTask = result.originalTask
      subtaskConfig.subtasks = [...result.subtasks]
      subtaskConfig.reasoning = result.reasoning
    }
  }

  /**
   * 隐藏任务拆分选择对话框
   */
  function hideSubtaskDialog() {
    subtaskConfig.showDialog = false
    subtaskConfig.originalTask = ''
    subtaskConfig.subtasks = []
    subtaskConfig.reasoning = ''
  }

  /**
   * 分析任务并显示拆分对话框（如果可以拆分）
   * @param todoText 待办事项文本
   * @returns 是否显示了拆分对话框
   */
  async function analyzeAndShowDialog(todoText: string): Promise<boolean> {
    const result = await analyzeTask(todoText)

    if (result.canSplit && result.subtasks.length > 0) {
      showSubtaskDialog(result)
      return true
    }

    return false
  }

  return {
    // 状态
    subtaskConfig,
    isAnalyzing,

    // 方法
    analyzeTask,
    showSubtaskDialog,
    hideSubtaskDialog,
    analyzeAndShowDialog,
  }
}
