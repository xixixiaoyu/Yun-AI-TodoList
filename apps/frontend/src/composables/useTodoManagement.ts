import { AI_RETRY_OPTIONS, withRetry } from '@/utils/retryHelper'
import type { Todo, TodoPriority, UpdateTodoDto } from '@shared/types/todo'
import axios from 'axios'
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAIResponse } from '../services/deepseekService'
import { logger } from '../utils/logger'
import { useAIAnalysis } from './useAIAnalysis'
import { useErrorHandler } from './useErrorHandler'
import { useTodos } from './useTodos'

export function useTodoManagement() {
  const { t } = useI18n()
  const {
    todos,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    updateTodo,
    updateTodoAIAnalysis,
    batchUpdateTodos,
    saveTodos,
    updateTodosOrder,
  } = useTodos()
  const { showError, showSuccess, error: duplicateError } = useErrorHandler()

  // AI 分析功能
  const { analyzeSingleTodo, analysisConfig } = useAIAnalysis()

  // 本地状态管理（避免只读属性赋值问题）
  const isAnalyzing = ref(false)
  const analysisProgress = ref(0)
  const isBatchAnalyzing = ref(false)

  const analyzeTodoAction = async (todo: Todo): Promise<void> => {
    if (isAnalyzing.value) return

    isAnalyzing.value = true
    try {
      // 添加重试机制提高 AI 分析的可靠性
      await withRetry(
        () =>
          analyzeSingleTodo(todo, (id: string, updates: Partial<Todo>) => {
            // 使用专门的 AI 分析更新函数
            updateTodoAIAnalysis(id, {
              priority: updates.priority,
              estimatedTime: updates.estimatedTime ? updates.estimatedTime.text : undefined,
              aiAnalyzed: updates.aiAnalyzed,
            })
          }),
        AI_RETRY_OPTIONS
      )

      logger.info('Todo analyzed successfully', { todoId: todo.id }, 'useTodoManagement')
    } catch (error) {
      logger.error('Error analyzing todo', error, 'useTodoManagement')
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * 批量分析未分析的 todo 项目
   */
  const batchAnalyzeUnanalyzedTodos = async (): Promise<void> => {
    if (isBatchAnalyzing.value || isAnalyzing.value) return

    // 获取未分析的活跃 todo
    const unanalyzedTodos = todos.value.filter((todo) => !todo.completed && !todo.aiAnalyzed)

    if (unanalyzedTodos.length === 0) {
      showError(t('noTodosToAnalyze', '没有需要分析的待办事项'))
      return
    }

    logger.info(
      'Starting batch analysis for unanalyzed todos',
      { count: unanalyzedTodos.length },
      'TodoManagement'
    )

    isBatchAnalyzing.value = true
    analysisProgress.value = 0

    try {
      // 检查 API Key 配置
      const apiKey = localStorage.getItem('deepseek_api_key')
      if (!apiKey || apiKey.trim() === '') {
        showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        return
      }

      let successCount = 0
      let failureCount = 0

      // 逐个分析，避免并发过多导致 API 限制
      for (let i = 0; i < unanalyzedTodos.length; i++) {
        const todo = unanalyzedTodos[i]
        analysisProgress.value = Math.round(((i + 1) / unanalyzedTodos.length) * 100)

        try {
          await withRetry(
            () =>
              analyzeSingleTodo(
                todo,
                (id: string, updates: Partial<Todo>) => {
                  updateTodoAIAnalysis(id, {
                    priority: updates.priority,
                    estimatedTime: updates.estimatedTime ? updates.estimatedTime.text : undefined,
                    aiAnalyzed: updates.aiAnalyzed,
                  })
                },
                { silent: true, showSuccess: false }
              ),
            AI_RETRY_OPTIONS
          )
          successCount++
          logger.info(
            'Todo analyzed successfully in batch',
            { todoId: todo.id, progress: `${i + 1}/${unanalyzedTodos.length}` },
            'TodoManagement'
          )
        } catch (error) {
          failureCount++
          logger.warn(
            'Failed to analyze todo in batch',
            { todoId: todo.id, error },
            'TodoManagement'
          )
        }

        // 添加小延迟避免 API 频率限制
        if (i < unanalyzedTodos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // 显示结果
      if (successCount > 0) {
        if (failureCount === 0) {
          showSuccess(t('batchAnalysisSuccess', `成功分析了 ${successCount} 个待办事项！`))
        } else {
          showSuccess(
            t(
              'batchAnalysisPartialSuccess',
              `成功分析了 ${successCount} 个待办事项，${failureCount} 个失败`
            )
          )
        }
      } else {
        showError(t('batchAnalysisFailed', '批量分析失败，请检查网络连接和 API 配置'))
      }

      logger.info(
        'Batch analysis completed',
        { successCount, failureCount, total: unanalyzedTodos.length },
        'TodoManagement'
      )
    } catch (error) {
      logger.error('Batch analysis error', error, 'TodoManagement')
      showError(t('batchAnalysisFailed', '批量分析失败，请重试'))
    } finally {
      isBatchAnalyzing.value = false
      analysisProgress.value = 0
    }
  }

  const filter = ref('active')
  const searchQuery = ref('')
  const isGenerating = ref(false)
  const isSplittingTask = ref(false) // AI 拆分分析加载状态
  const suggestedTodos = ref<string[]>([])
  const showSuggestedTodos = ref(false)
  const isSorting = ref(false)
  const MAX_TODO_LENGTH = 50

  const isLoading = computed(() => isSorting.value)

  const filteredTodos = computed(() => {
    // 首先过滤掉无效的 Todo 对象
    let result = todos.value.filter((todo) => {
      return (
        todo && todo.id && todo.title && typeof todo.title === 'string' && todo.title.trim() !== ''
      )
    })

    // 根据完成状态过滤
    if (filter.value === 'active') {
      result = result.filter((todo) => !todo.completed)
    } else if (filter.value === 'completed') {
      result = result.filter((todo) => todo.completed)
    }

    // 根据搜索查询过滤
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      result = result.filter((todo) => {
        // 确保 todo 和 title 存在且不为空
        return (
          todo &&
          todo.title &&
          typeof todo.title === 'string' &&
          todo.title.toLowerCase().includes(query)
        )
      })
    }

    return result
  })

  const hasActiveTodos = computed(() => {
    return filter.value === 'active' && todos.value.some((todo) => todo && !todo.completed)
  })

  // generateSuggestedTodos 方法已移除

  // 计算是否有已完成的历史记录
  const hasCompletedHistory = computed(() => {
    return todos.value.some((todo) => todo.completed)
  })

  const confirmSuggestedTodos = async () => {
    // 过滤掉空的建议项
    const validSuggestions = suggestedTodos.value.filter((todo) => todo.trim() !== '')

    if (validSuggestions.length === 0) {
      showError('请至少添加一个有效的建议')
      return
    }

    const originalSuggestedCount = validSuggestions.length
    const duplicates = await addMultipleTodos(
      validSuggestions.map((todo) => ({
        title: todo,
      }))
    )
    if (duplicates.length > 0) {
      showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
    }

    // 计算成功添加的待办事项数量
    const successfullyAdded = originalSuggestedCount - duplicates.length

    // 关闭建议对话框
    showSuggestedTodos.value = false
    suggestedTodos.value = []

    // 如果成功添加了待办事项，进行批量 AI 分析
    if (successfullyAdded > 0) {
      try {
        // 批量分析功能已移除
      } catch (error) {
        console.warn('批量 AI 分析失败:', error)
        // 不显示错误，因为添加待办事项已经成功了
      }
    }
  }

  const cancelSuggestedTodos = () => {
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const updateSuggestedTodo = (index: number, newText: string) => {
    suggestedTodos.value[index] = newText
  }

  const deleteSuggestedTodo = (index: number) => {
    suggestedTodos.value.splice(index, 1)
  }

  const addSuggestedTodo = () => {
    suggestedTodos.value.push('')
  }

  const sortActiveTodosWithAI = async () => {
    // 如果正在进行单个分析，则禁止 AI 排序
    if (isSorting.value || isAnalyzing.value) {
      return
    }

    const activeTodos = todos.value.filter((todo) => !todo.completed)

    if (activeTodos.length === 0) {
      showError('没有待办事项需要排序')
      return
    }

    if (activeTodos.length < 2) {
      showError('至少需要2个待办事项才能进行排序')
      return
    }

    logger.info(
      'Starting AI sorting for todos',
      { todos: activeTodos.map((t) => t.title) },
      'TodoManagement'
    )
    isSorting.value = true

    try {
      // 检查 API Key 配置
      const apiKey = localStorage.getItem('deepseek_api_key')
      if (!apiKey || apiKey.trim() === '') {
        showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        isSorting.value = false
        return
      }

      // 构建更详细的提示词，包含任务内容和上下文
      const todoTexts = activeTodos.map((todo, index) => `${index + 1}. ${todo.title}`).join('\n')
      const prompt = `作为一个专业的任务管理助手，请根据以下标准对待办事项进行优先级排序：
1. 紧急程度（截止时间、时间敏感性）
2. 重要程度（对目标的影响）
3. 依赖关系（是否阻塞其他任务）
4. 完成难度和所需时间

待办事项列表：
${todoTexts}

请严格按照以下格式返回排序结果：
只返回排序后的序号列表，用逗号分隔，不要包含其他任何文字。
例如：对于3个任务，返回格式应为：3,1,2

请确保：
1. 返回的数字数量与任务数量相同
2. 每个数字都在1到${activeTodos.length}之间
3. 没有重复的数字
4. 只包含数字和逗号，不要包含其他字符`

      logger.info('Sending AI request for sorting', {}, 'TodoManagement')
      const aiResponse = await getAIResponse(prompt)

      // 添加调试日志，查看 AI 实际返回的内容
      logger.info('AI response received', { response: aiResponse }, 'TodoManagement')

      // 改进的解析逻辑，支持多种格式
      let sortedIndices: number[] = []

      // 尝试多种解析方式
      // 方式1：提取所有数字并验证是否符合要求
      const allNumbers = aiResponse.match(/\d+/g)?.map((num) => parseInt(num)) || []
      const validNumbers = allNumbers.filter((num) => num >= 1 && num <= activeTodos.length)

      // 添加调试日志，查看方式1解析过程
      logger.info('Method 1 parsing process', { allNumbers, validNumbers }, 'TodoManagement')

      // 检查是否有足够的有效数字，并且没有重复
      if (
        validNumbers.length === activeTodos.length &&
        new Set(validNumbers).size === activeTodos.length
      ) {
        sortedIndices = validNumbers.map((num) => num - 1)
      }

      // 添加调试日志，查看方式1解析结果
      logger.info('Method 1 parsing result', { sortedIndices }, 'TodoManagement')

      // 方式2：清理响应后直接匹配数字序列
      if (sortedIndices.length === 0) {
        const cleanResponse = aiResponse.replace(/[^\d,，\s]/g, '').trim()

        // 添加调试日志，查看清理后的响应
        logger.info(
          'Cleaned AI response',
          { cleanResponse, originalLength: aiResponse.length, cleanLength: cleanResponse.length },
          'TodoManagement'
        )

        const directMatch = cleanResponse.match(/^[\d,，\s]+$/)
        logger.info(
          'Direct match result',
          { directMatch, hasMatch: !!directMatch },
          'TodoManagement'
        )

        if (directMatch) {
          sortedIndices = cleanResponse
            .split(/[,，\s]+/)
            .map((num) => parseInt(num.trim()))
            .filter((num) => !isNaN(num) && num >= 1 && num <= activeTodos.length)
            .map((num) => num - 1)

          // 添加调试日志，查看方式2解析结果
          logger.info('Method 2 parsing result', { sortedIndices }, 'TodoManagement')
        }
      }

      // 方式3：从响应中提取所有数字（作为后备方案）
      if (sortedIndices.length === 0) {
        const allNumbers = aiResponse.match(/\d+/g)?.map((num) => parseInt(num)) || []
        const validNumbers = allNumbers.filter((num) => num >= 1 && num <= activeTodos.length)

        // 添加调试日志，查看方式3解析过程
        logger.info('Method 3 parsing process', { allNumbers, validNumbers }, 'TodoManagement')

        // 去重并保持顺序
        const uniqueNumbers = [...new Set(validNumbers)]
        if (uniqueNumbers.length === activeTodos.length) {
          sortedIndices = uniqueNumbers.map((num) => num - 1)
        }

        // 添加调试日志，查看方式3解析结果
        logger.info('Method 3 parsing result', { sortedIndices, uniqueNumbers }, 'TodoManagement')
      }

      // 验证排序结果
      if (
        sortedIndices.length === activeTodos.length &&
        new Set(sortedIndices).size === activeTodos.length &&
        sortedIndices.every((index) => index >= 0 && index < activeTodos.length)
      ) {
        // 应用排序
        // 应用新的排序顺序
        const sortedTodos = sortedIndices.map((index) => activeTodos[index])
        logger.info(
          'Todos sorted successfully',
          { sortedTodos: sortedTodos.map((t) => t.title) },
          'TodoManagement'
        )

        // 构建新的排序数组，只包含活跃任务的 ID，按 AI 返回的顺序排列
        const newOrder = sortedTodos.map((todo) => todo.id)

        // 获取所有已完成任务的 ID，保持它们在列表末尾
        const completedTodoIds = todos.value.filter((todo) => todo.completed).map((todo) => todo.id)

        // 合并排序后的活跃任务 ID 和已完成任务 ID
        const finalOrder = [...newOrder, ...completedTodoIds]

        // 使用 updateTodosOrder 方法更新排序
        const updateResult = await updateTodosOrder(finalOrder)

        if (updateResult) {
          logger.info(
            'AI sorting completed, todos array updated',
            { todos: todos.value.map((t) => ({ id: t.id, title: t.title, order: t.order })) },
            'TodoManagement'
          )

          // AI 排序成功完成
          showSuccess(t('aiSortSuccess', 'AI 优先级排序完成！'))
        } else {
          logger.error('Failed to update todos order', {}, 'TodoManagement')
          showError(t('aiSortFailed', 'AI 排序失败，请重试'))
        }
      } else {
        logger.warn(
          'AI sorting parse failed',
          {
            response: aiResponse,
            sortedIndices,
            expectedLength: activeTodos.length,
          },
          'TodoManagement'
        )
        showError(t('aiSortParseFailed', 'AI 排序解析失败，请重试'))
      }
    } catch (error) {
      // AI 排序失败

      if (error instanceof Error) {
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        })

        if (error.message.includes('configureApiKey') || error.message.includes('API Key')) {
          console.error('🔑 API Key 配置错误')
          showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          console.error('🌐 网络连接错误')
          showError('网络连接失败，请检查网络设置后重试')
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('🔐 API Key 认证失败')
          showError('API Key 认证失败，请检查 API Key 是否正确')
        } else if (error.message.includes('429')) {
          console.error('⏰ API 请求频率限制')
          showError('请求过于频繁，请稍后再试')
        } else {
          console.error('🔧 其他错误')
          showError(t('aiSortFailed', 'AI 排序失败，请检查网络连接和 API 配置'))
        }
      } else {
        // 处理未知错误类型
        showError(t('aiSortFailed', 'AI 排序失败，请重试'))
      }
    } finally {
      logger.info('AI sorting process completed, resetting state', {}, 'TodoManagement')
      isSorting.value = false
    }
  }

  const handleAddTodo = async (text: string, skipSplitAnalysis = false) => {
    // 添加调用栈信息来调试双重请求
    const stack = new Error().stack
    logger.info(
      '🔍 handleAddTodo called',
      {
        text,
        skipSplitAnalysis,
        caller: stack?.split('\n')[2]?.trim() || 'unknown',
      },
      'TodoManagement'
    )

    if (!text || text.trim() === '') {
      showError(t('emptyTodoError'))
      return
    }

    // 如果不跳过拆分分析且启用了 AI 拆分子任务功能，先进行 AI 拆分分析
    if (!skipSplitAnalysis && analysisConfig.value.enableSubtaskSplitting) {
      try {
        isSplittingTask.value = true // 开始 AI 拆分分析
        const { analyzeTaskSplitting } = await import('@/services/aiAnalysisService')
        const splitResult = await analyzeTaskSplitting(text)

        // 如果可以拆分且有子任务，触发拆分选择事件
        if (splitResult.canSplit && splitResult.subtasks.length > 0) {
          // 通过事件总线或回调通知上层组件显示拆分对话框
          // 这里我们返回拆分结果，让调用方处理
          return {
            needsSplitting: true,
            splitResult,
          }
        }
      } catch (error) {
        console.warn('AI 拆分分析失败，继续添加原始任务:', error)
        // 分析失败时继续添加原始任务
      } finally {
        isSplittingTask.value = false // 结束 AI 拆分分析
      }
    }

    // 设置加载状态
    isGenerating.value = true

    logger.info('Adding todo with text', { text }, 'TodoManagement')

    try {
      // 创建 todo 数据，默认设置 dueDate 为今天
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 设置为今天的开始时间
      const todayISO = today.toISOString()

      const todoData = {
        title: text,
        dueDate: todayISO, // 默认设置为今天
      }

      const result = await addTodo(todoData)

      if (!result) {
        logger.error('Failed to add todo - duplicate detected', { text }, 'TodoManagement')
        showError(t('duplicateError', '该待办事项已存在'))
        return { needsSplitting: false }
      }

      return await handleSuccessfulTodoAdd(result, text)
    } catch (error: unknown) {
      logger.error('Error adding todo', { text, error }, 'TodoManagement')

      // 检查是否是重复错误
      if (axios.isAxiosError(error) && error.response && error.response.status === 409) {
        showError(t('duplicateError', '该待办事项已存在'))
      } else if (error instanceof Error && error.message.includes('aborted')) {
        showError(t('aiRequestAborted', 'AI 请求已取消'))
      } else {
        showError(t('addError', '添加失败，请重试'))
      }

      return { needsSplitting: false }
    } finally {
      // 重置加载状态
      isGenerating.value = false
    }
  }

  // 提取成功添加 Todo 的处理逻辑
  const handleSuccessfulTodoAdd = async (result: Todo, text: string) => {
    // 验证添加的 Todo 数据完整性
    if (!result.title || result.title.trim() === '') {
      logger.error('Added todo has empty title', { result, originalText: text }, 'TodoManagement')
      showError('添加的待办事项标题为空，请重试')
      return { needsSplitting: false }
    }

    logger.info('Todo added successfully', { result }, 'TodoManagement')

    logger.info(
      'Todo added successfully, checking auto analysis config',
      { autoAnalyze: analysisConfig.value.autoAnalyzeNewTodos },
      'TodoManagement'
    )

    // 如果启用了自动分析新待办事项，则自动触发 AI 分析
    if (analysisConfig.value.autoAnalyzeNewTodos) {
      try {
        // 找到刚添加的 Todo（最新的一个）
        const newTodo = todos.value
          .filter((todo) => !todo.completed && !todo.aiAnalyzed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        logger.info('Found new todo for analysis', { todoId: newTodo?.id }, 'TodoManagement')

        if (newTodo) {
          logger.info('Starting auto AI analysis', {}, 'TodoManagement')
          // 异步执行 AI 分析，不阻塞用户操作，静默处理错误
          withRetry(
            () =>
              analyzeSingleTodo(
                newTodo,
                (id: string, updates: Partial<Todo>) => {
                  logger.info(
                    'Auto analysis completed, updating todo',
                    { id, updates },
                    'TodoManagement'
                  )
                  // 使用专门的 AI 分析更新函数
                  updateTodoAIAnalysis(id, {
                    priority: updates.priority,
                    estimatedTime: updates.estimatedTime ? updates.estimatedTime.text : undefined,
                    aiAnalyzed: updates.aiAnalyzed,
                  })
                },
                { silent: true, showSuccess: false } // 自动分析时静默处理
              ),
            AI_RETRY_OPTIONS
          ).catch((error) => {
            // 重试后仍失败时静默处理，不影响任务添加
            logger.warn(
              'Auto AI analysis failed for new todo after retries',
              error,
              'TodoManagement'
            )
            // 不更新任何字段，保持 Todo 的原始状态
          })
        } else {
          logger.info('No new todo found for analysis', {}, 'TodoManagement')
        }
      } catch (error) {
        // 分析失败时静默处理，不影响任务添加
        logger.warn('Error in auto AI analysis', error, 'TodoManagement')
      }
    } else {
      logger.info('Auto analysis feature is disabled', {}, 'TodoManagement')
    }

    return { needsSplitting: false }
  }

  /**
   * 批量添加子任务
   * @param subtasks 子任务文本数组
   * @param originalTask 原始任务文本（用于 AI 分析上下文）
   */
  const handleAddSubtasks = async (subtasks: string[], originalTask?: string) => {
    let successCount = 0
    let duplicateCount = 0

    // 如果提供了原始任务，使用 AI 分析为子任务生成重要等级和时间估算
    let subtaskDetails: Array<{
      title: string
      priority: number
      estimatedTime: string
      estimatedMinutes: number
    }> = []

    if (originalTask && analysisConfig.value.autoAnalyzeNewTodos) {
      try {
        const { analyzeSubtasksDetails } = await import('@/services/aiAnalysisService')
        subtaskDetails = await analyzeSubtasksDetails(subtasks, originalTask)
        logger.info('AI 子任务详情分析完成', { subtaskDetails }, 'TodoManagement')
      } catch (error) {
        console.warn('AI 子任务详情分析失败，使用默认值:', error)
        // 如果 AI 分析失败，使用关键词分析作为后备
        const { suggestPriorityByKeywords, estimateTimeByKeywords } = await import(
          '@/services/aiAnalysisService'
        )
        subtaskDetails = subtasks.map((title) => {
          const estimatedTime = estimateTimeByKeywords(title)
          return {
            title,
            priority: suggestPriorityByKeywords(title),
            estimatedTime,
            estimatedMinutes: parseTimeToMinutes(estimatedTime),
          }
        })
      }
    }

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i]
      if (subtask && subtask.trim() !== '') {
        const trimmedSubtask = subtask.trim()

        // 检查是否重复
        const isDuplicate = todos.value.some(
          (todo) =>
            todo &&
            todo.title &&
            todo.title.toLowerCase() === trimmedSubtask.toLowerCase() &&
            !todo.completed
        )

        if (isDuplicate) {
          duplicateCount++
          continue
        }

        // 构建包含重要等级和时间估算的 todo 数据
        const todoData: {
          title: string
          priority?: TodoPriority
          estimatedTime?: { text: string; minutes: number }
        } = { title: trimmedSubtask }

        // 如果有 AI 分析结果，添加重要等级和时间估算
        if (subtaskDetails.length > 0 && subtaskDetails[i]) {
          const detail = subtaskDetails[i]
          todoData.priority = detail.priority as TodoPriority
          todoData.estimatedTime = {
            text: detail.estimatedTime,
            minutes: detail.estimatedMinutes,
          }
        }

        const success = await addTodo(todoData)

        if (success) {
          successCount++
        } else {
          // 记录失败但不使用变量以避免 lint 警告
          console.warn('Failed to add subtask:', trimmedSubtask)
        }
      }
    }

    if (successCount > 0) {
      // 确保数据保存和响应式更新
      saveTodos()
      await nextTick()

      // 强制触发响应式更新：重新排序并创建新的数组引用
      todos.value = [...todos.value.sort((a, b) => a.order - b.order)]
      await nextTick()

      // 验证新添加的任务都是未完成状态
      const recentTodos = todos.value.slice(-successCount)

      const hasCompletedTodos = recentTodos.some((todo) => todo.completed)
      if (hasCompletedTodos) {
        logger.error('发现新添加的任务中有已完成状态的任务', { recentTodos }, 'useTodoManagement')
        // 修正错误的状态
        recentTodos.forEach((todo) => {
          if (todo.completed) {
            todo.completed = false
            delete todo.completedAt
          }
        })
        saveTodos()
        // 再次强制更新
        todos.value = [...todos.value]
        await nextTick()
      }

      // 如果启用了自动分析，为新添加的子任务进行批量分析
      if (analysisConfig.value.autoAnalyzeNewTodos) {
        try {
          // 找到最新添加的子任务
          const newTodos = todos.value
            .filter((todo) => !todo.completed && !todo.aiAnalyzed)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, successCount)

          if (newTodos.length > 0) {
            logger.info(
              'Starting batch analysis for new subtasks',
              { count: newTodos.length },
              'TodoManagement'
            )

            // 为新添加的子任务进行批量分析
            for (const todo of newTodos) {
              try {
                await withRetry(
                  () =>
                    analyzeSingleTodo(
                      todo,
                      (id: string, updates: Partial<Todo>) => {
                        updateTodoAIAnalysis(id, {
                          priority: updates.priority,
                          estimatedTime: updates.estimatedTime
                            ? updates.estimatedTime.text
                            : undefined,
                          aiAnalyzed: updates.aiAnalyzed,
                        })
                      },
                      { silent: true, showSuccess: false }
                    ),
                  AI_RETRY_OPTIONS
                )
                logger.info('Subtask analyzed successfully', { todoId: todo.id }, 'TodoManagement')
              } catch (error) {
                logger.warn(
                  'Failed to analyze subtask',
                  { todoId: todo.id, error },
                  'TodoManagement'
                )
              }
            }
          }
        } catch (error) {
          // 批量分析错误日志已移除
          logger.error('Batch analysis failed', { error }, 'TodoManagement')
        }
      }
    }

    // 记录添加结果
    if (duplicateCount > 0) {
      logger.info(
        'Subtask addition completed with duplicates',
        { successCount, duplicateCount },
        'TodoManagement'
      )
    }

    return { successCount, duplicateCount }
  }

  /**
   * 解析时间文本为分钟数（本地辅助函数）
   * @param timeText 时间文本
   * @returns 分钟数
   */
  const parseTimeToMinutes = (timeText: string): number => {
    const text = timeText.toLowerCase().trim()
    const numberMatch = text.match(/\d+/)
    if (!numberMatch) return 30

    const number = parseInt(numberMatch[0])

    if (text.includes('分钟') || text.includes('分') || text.includes('min')) {
      return number
    } else if (text.includes('小时') || text.includes('时') || text.includes('hour')) {
      return number * 60
    } else if (text.includes('天') || text.includes('日') || text.includes('day')) {
      return number * 8 * 60
    } else if (text.includes('周') || text.includes('week')) {
      return number * 5 * 8 * 60
    }

    return number
  }

  /**
   * 更新 Todo 文本并触发 AI 重新分析
   * @param id Todo ID
   * @param newText 新的文本内容
   */
  const updateTodoText = async (id: string, newText: string) => {
    try {
      // 验证文本内容
      if (!newText || newText.trim().length === 0) {
        showError(t('todoTextRequired', '待办事项内容不能为空'))
        return false
      }

      const trimmedText = newText.trim()
      if (trimmedText.length > MAX_TODO_LENGTH) {
        showError(t('todoTextTooLong', `待办事项内容不能超过 ${MAX_TODO_LENGTH} 个字符`))
        return false
      }

      // 检查是否与现有 todo 重复
      const isDuplicate = todos.value.some(
        (todo) =>
          todo &&
          todo.id !== id &&
          todo.title &&
          todo.title.toLowerCase() === trimmedText.toLowerCase() &&
          !todo.completed
      )

      if (isDuplicate) {
        showError(t('duplicateError', '该待办事项已存在'))
        return false
      }

      // 更新 todo 文本，重置 AI 分析状态
      const updates: UpdateTodoDto = {
        title: trimmedText,
        priority: undefined,
        estimatedTime: undefined,
        aiAnalyzed: false, // 重置 AI 分析状态
      }

      const success = await updateTodo(id, updates)
      if (success) {
        showSuccess(t('todoUpdated', '待办事项已更新'))

        // 如果启用了自动分析，触发 AI 分析
        if (analysisConfig.value.autoAnalyzeNewTodos) {
          const updatedTodo = todos.value.find((todo) => todo.id === id)
          if (updatedTodo && !updatedTodo.completed) {
            try {
              await withRetry(
                () =>
                  analyzeSingleTodo(
                    updatedTodo,
                    (id: string, updates: Partial<Todo>) => {
                      // 使用专门的 AI 分析更新函数
                      updateTodoAIAnalysis(id, {
                        priority: updates.priority,
                        estimatedTime: updates.estimatedTime
                          ? updates.estimatedTime.text
                          : undefined,
                        aiAnalyzed: updates.aiAnalyzed,
                      })
                    },
                    { silent: true, showSuccess: false } // 自动分析时静默处理
                  ),
                AI_RETRY_OPTIONS
              )
            } catch (error) {
              logger.warn(
                'Auto AI analysis failed after text update after retries',
                error,
                'TodoManagement'
              )
            }
          }
        }
      }

      return success
    } catch (error) {
      logger.error('Error updating todo text', error, 'TodoManagement')
      showError(t('updateError', '更新失败，请重试'))
      return false
    }
  }

  const result = {
    todos,
    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    hasCompletedHistory,
    isGenerating,
    isSplittingTask,
    isSorting,
    isLoading,
    isAnalyzing,
    isBatchAnalyzing,
    analysisProgress,
    suggestedTodos,
    showSuggestedTodos,
    MAX_TODO_LENGTH,
    duplicateError,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    deleteSuggestedTodo,
    addSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    handleAddSubtasks,
    toggleTodo,
    removeTodo,
    updateTodo,
    updateTodoText,
    batchUpdateTodos,

    analyzeTodo: analyzeTodoAction,
    batchAnalyzeUnanalyzedTodos,

    // 清理机制
    cleanup: () => {
      // 重置所有状态
      filter.value = 'active'
      searchQuery.value = ''
      isGenerating.value = false
      isSplittingTask.value = false
      isSorting.value = false
      isAnalyzing.value = false
      isBatchAnalyzing.value = false
      analysisProgress.value = 0
      suggestedTodos.value = []
      showSuggestedTodos.value = false
      duplicateError.value = ''
    },
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    if (typeof result.cleanup === 'function') {
      result.cleanup()
    }
  })

  return result
}
