import type { Todo } from '@/types/todo'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'
import { useSystemPrompts } from './useSystemPrompts'
import { useToast } from './useToast'

/**
 * Todo 系统提示词管理组合式函数
 * 提供基于待办事项数据的系统提示词生成和管理功能
 */
export function useTodoSystemPrompt() {
  const { t } = useI18n()
  const { showError } = useErrorHandler()
  const { success: showSuccess } = useToast()
  const {
    activateTodoAssistant,
    deactivateTodoAssistant,
    isTodoAssistantActive,
    todoAssistantPrompt,
  } = useSystemPrompts()

  // 状态管理
  const isGenerating = ref(false)

  /**
   * 激活 Todo 系统提示词（不再需要预生成内容）
   * @param todos 待办事项列表
   * @returns 是否成功激活
   */
  const generateAndActivateTodoPrompt = async (todos: Todo[]): Promise<boolean> => {
    if (isGenerating.value) {
      console.debug('Todo助手: 正在激活中，跳过请求')
      return false
    }

    isGenerating.value = true
    try {
      console.debug('Todo助手: 开始激活流程', { todosCount: todos.length })

      // 直接激活 Todo 助手（内容将在每次发送消息时动态生成）
      await activateTodoAssistant()
      console.debug('Todo助手: 激活完成')

      // 显示成功提示
      showSuccess(t('todoPromptActivated', 'Todo 任务助手已激活，现在可以询问关于您任务的任何问题'))

      return true
    } catch (error) {
      console.error('激活 Todo 任务助手失败:', error)
      showError(t('todoPromptError', '激活 Todo 任务助手失败，请重试'))
      return false
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 停用 Todo 系统提示词
   */
  const deactivateTodoPrompt = async (): Promise<boolean> => {
    try {
      // 停用 Todo 助手
      await deactivateTodoAssistant()
      console.debug('Todo助手停用成功')

      showSuccess(t('todoPromptDeactivated', 'Todo 任务助手已停用'))
      return true
    } catch (error) {
      console.error('停用 Todo 系统提示词失败:', error)
      showError(t('todoPromptDeactivateError', '停用 Todo 任务助手失败，请重试'))
      return false
    }
  }

  /**
   * 检查是否已激活 Todo 系统提示词（响应式计算属性）
   */
  const isTodoPromptActive = computed(() => {
    const isActive = isTodoAssistantActive.value
    console.debug('Todo助手状态检查:', {
      isTodoAssistantActive: isActive,
      hasTodoPrompt: !!todoAssistantPrompt.value,
    })
    return isActive
  })

  return {
    // 状态
    isGenerating,

    // 方法
    generateAndActivateTodoPrompt,
    deactivateTodoPrompt,
    isTodoPromptActive,
  }
}
