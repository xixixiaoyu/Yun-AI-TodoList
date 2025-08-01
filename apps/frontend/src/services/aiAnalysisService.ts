import i18n from '@/i18n'
import type { AIAnalysisResult, AISubtaskResult, Todo } from '@/types/todo'
// 缓存功能已移除
import { handleError } from '@/utils/logger'
import { handleAIResponse, logAIResponseError } from './aiResponseHandler'
import { getAIResponse } from './deepseekService'

// clearTaskSplittingCache 函数已移除，因为缓存功能已被删除

/**
 * 智能提问结果接口
 */
export interface SmartQuestionResult {
  question: string
  category: 'priority' | 'planning' | 'analysis' | 'improvement' | 'summary'
  reasoning: string
}

/**
 * AI 分析服务
 * 提供 Todo 项目的智能分析功能，包括重要等级评估和时间估算
 */

/**
 * 分析单个 Todo 项目的重要等级和时间估算
 * @param todoText Todo 项目文本
 * @returns AI 分析结果
 */
export async function analyzeTodo(todoText: string): Promise<AIAnalysisResult> {
  // 检查 AI 功能是否可用
  const { checkAIAvailability } = await import('./aiConfigService')

  if (!checkAIAvailability()) {
    throw new Error('AI 功能暂时不可用，请检查 API 密钥配置')
  }

  try {
    const prompt = `作为一个专业的任务管理助手，请分析以下待办事项的重要等级和完成时间估算：

任务：${todoText}

请根据以下标准进行分析：

重要等级评估（1-5星）：
- 1星：日常琐事，可延期处理
- 2星：一般任务，适时完成即可
- 3星：重要任务，需要按时完成
- 4星：高优先级，影响重要目标
- 5星：紧急重要，必须立即处理

时间估算标准：
- 考虑任务的复杂度和工作量
- 使用常见的时间单位：分钟、小时、天
- 给出合理的预估时间范围

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "priority": 数字(1-5),
  "estimatedTime": "时间估算字符串",
  "reasoning": "简短的分析理由"
}`

    const response = await getAIResponse(prompt, 0.3)

    // 尝试解析 JSON 响应
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到有效的JSON格式')
      }

      const result: AIAnalysisResult = JSON.parse(jsonMatch[0])

      // 验证结果格式
      if (!result.priority || !result.estimatedTime) {
        throw new Error('AI 响应格式不完整')
      }

      // 确保 priority 在有效范围内
      result.priority = Math.max(1, Math.min(5, Math.round(result.priority)))

      return result
    } catch (parseError) {
      console.warn('AI 响应解析失败，使用备用解析方法:', response, parseError)

      // 备用解析方法
      const priorityMatch = response.match(/(?:priority|重要|星级|等级).*?(\d)/i)
      const timeMatch = response.match(
        /(?:time|时间|估算).*?([0-9]+(?:\.[0-9]+)?)\s*([分小时天周月])/i
      )

      let priority = 3 // 默认值
      let estimatedTime = '1小时' // 默认值

      if (priorityMatch) {
        priority = Math.max(1, Math.min(5, parseInt(priorityMatch[1])))
      }

      if (timeMatch) {
        const value = timeMatch[1]
        const unit = timeMatch[2]
        estimatedTime = `${value}${unit}`
      }

      return {
        priority,
        estimatedTime,
        reasoning: '基于任务内容的智能分析',
      }
    }
  } catch (error) {
    handleError(error, i18n.global.t('aiAnalysisError'), 'AIAnalysisService')

    // AI 分析失败时抛出错误，不返回默认值
    throw error
  }
}

// 批量分析功能已移除

/**
 * 重新分析已存在的 Todo 项目
 * @param todo Todo 项目
 * @returns 更新后的分析结果
 */
export async function reanalyzeTodo(todo: Todo): Promise<AIAnalysisResult> {
  const result = await analyzeTodo(todo.title)
  return result
}

/**
 * 根据任务类型和关键词进行智能优先级建议
 * @param todoText Todo 文本
 * @returns 建议的优先级
 */
export function suggestPriorityByKeywords(todoText: string): number {
  const text = todoText.toLowerCase()

  // 高优先级关键词
  const highPriorityKeywords = ['紧急', '立即', '马上', '今天', '截止', '重要', '关键', '必须']
  // 中优先级关键词
  const mediumPriorityKeywords = ['本周', '尽快', '需要', '应该', '计划']
  // 低优先级关键词
  const lowPriorityKeywords = ['有空', '闲时', '可以', '考虑', '想要']

  if (highPriorityKeywords.some((keyword) => text.includes(keyword))) {
    return 5
  } else if (mediumPriorityKeywords.some((keyword) => text.includes(keyword))) {
    return 3
  } else if (lowPriorityKeywords.some((keyword) => text.includes(keyword))) {
    return 1
  }

  return 3 // 默认中等优先级
}

/**
 * 根据任务类型估算时间
 * @param todoText Todo 文本
 * @returns 估算时间
 */
export function estimateTimeByKeywords(todoText: string): string {
  const text = todoText.toLowerCase()

  // 快速任务关键词
  const quickTaskKeywords = ['打电话', '发邮件', '回复', '查看', '确认']
  // 中等任务关键词
  const mediumTaskKeywords = ['写', '整理', '准备', '学习', '阅读']
  // 长时间任务关键词
  const longTaskKeywords = ['开发', '设计', '研究', '分析', '项目']

  if (quickTaskKeywords.some((keyword) => text.includes(keyword))) {
    return '15分钟'
  } else if (mediumTaskKeywords.some((keyword) => text.includes(keyword))) {
    return '1小时'
  } else if (longTaskKeywords.some((keyword) => text.includes(keyword))) {
    return '4小时'
  }

  return '30分钟' // 默认时间
}

/**
 * AI 任务拆分分析
 * 分析待办事项是否可以拆分成多个子任务
 * @param todoText 待办事项文本
 * @returns AI 拆分分析结果
 */
export async function analyzeTaskSplitting(todoText: string): Promise<AISubtaskResult> {
  const prompt = `作为一个专业的任务管理助手，请分析以下待办事项是否可以拆分成多个更小的子任务：

任务：${todoText}

请根据以下标准进行分析：

拆分标准：
- 如果任务包含多个独立的步骤或阶段，建议拆分
- 如果任务过于复杂或耗时较长，建议拆分
- 如果任务涉及多个不同的技能或工具，建议拆分
- 简单的单一动作任务不需要拆分

拆分原则：
- 每个子任务应该是独立可执行的
- 子任务应该有明确的完成标准
- 子任务的粒度适中，不要过于细碎
- 保持子任务之间的逻辑顺序

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "canSplit": true/false,
  "subtasks": ["子任务1", "子任务2", "子任务3"],
  "reasoning": "拆分理由或不拆分的原因",
  "originalTask": "${todoText}"
}`

  // 缓存功能已移除，直接进行 AI 分析

  try {
    const response = await getAIResponse(prompt, 0.3)

    // 定义必需字段
    const requiredFields = ['canSplit', 'subtasks', 'reasoning', 'originalTask']

    // 定义非标准响应的提取规则
    const extractionRules = {
      canSplit: /"?canSplit"?\s*:\s*(true|false)/i,
      reasoning: /"?reasoning"?\s*:\s*"([^"]+)"/i,
      originalTask: /"?originalTask"?\s*:\s*"([^"]+)"/i,
    }

    // 处理 AI 响应
    const data = handleAIResponse(response, requiredFields, extractionRules)

    // 转换数据类型
    const result: AISubtaskResult = {
      canSplit: typeof data.canSplit === 'boolean' ? data.canSplit : false,
      subtasks: Array.isArray(data.subtasks) ? (data.subtasks as string[]) : [],
      reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
      originalTask: typeof data.originalTask === 'string' ? data.originalTask : todoText,
    }

    // 如果不能拆分，确保子任务数组为空
    if (!result.canSplit) {
      result.subtasks = []
    }

    // 缓存功能已移除

    return result
  } catch (error) {
    console.error('AI任务拆分分析失败:', error)
    logAIResponseError(error, 'AI任务拆分分析')

    // 返回默认结果
    const defaultResult: AISubtaskResult = {
      canSplit: false,
      subtasks: [],
      reasoning: 'AI分析服务暂时不可用',
      originalTask: todoText,
    }

    return defaultResult
  }
}

/**
 * 为子任务分析重要等级和时间估算
 * @param subtasks 子任务文本数组
 * @param originalTask 原始任务文本
 * @returns 包含重要等级和时间估算的子任务分析结果
 */
export async function analyzeSubtasksDetails(
  subtasks: string[],
  originalTask: string
): Promise<
  Array<{ title: string; priority: number; estimatedTime: string; estimatedMinutes: number }>
> {
  const prompt = `作为一个专业的任务管理助手，请为以下子任务分析重要等级和时间估算：

原始任务：${originalTask}

子任务列表：
${subtasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

请为每个子任务分析：
1. 重要等级（1-5星，5星最重要）
2. 时间估算（如：30分钟、2小时、1天等）

分析标准：
- 重要等级基于：对整体目标的影响、紧急程度、依赖关系
- 时间估算基于：任务复杂度、所需技能、预期工作量
- 考虑子任务在整个项目中的相对重要性

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "subtasks": [
    {
      "title": "子任务1",
      "priority": 3,
      "estimatedTime": "1小时",
      "estimatedMinutes": 60
    },
    {
      "title": "子任务2",
      "priority": 4,
      "estimatedTime": "30分钟",
      "estimatedMinutes": 30
    }
  ]
}`

  try {
    const response = await getAIResponse(prompt, 0.3)

    // 定义必需字段
    const requiredFields = ['subtasks']

    // 处理 AI 响应
    const data = handleAIResponse(response, requiredFields, {})

    // 验证和转换数据
    if (Array.isArray(data.subtasks)) {
      return (data.subtasks as any[]).map((subtask, index) => {
        // 确保每个子任务都有必需的字段
        const title = typeof subtask.title === 'string' ? subtask.title : subtasks[index] || ''
        const priority =
          typeof subtask.priority === 'number' && subtask.priority >= 1 && subtask.priority <= 5
            ? subtask.priority
            : suggestPriorityByKeywords(title)
        const estimatedTime =
          typeof subtask.estimatedTime === 'string'
            ? subtask.estimatedTime
            : estimateTimeByKeywords(title)
        const estimatedMinutes =
          typeof subtask.estimatedMinutes === 'number' && subtask.estimatedMinutes > 0
            ? subtask.estimatedMinutes
            : parseTimeToMinutes(estimatedTime)

        return {
          title,
          priority,
          estimatedTime,
          estimatedMinutes,
        }
      })
    }

    // 如果 AI 响应格式不正确，使用关键词分析作为后备
    return subtasks.map((title) => ({
      title,
      priority: suggestPriorityByKeywords(title),
      estimatedTime: estimateTimeByKeywords(title),
      estimatedMinutes: parseTimeToMinutes(estimateTimeByKeywords(title)),
    }))
  } catch (error) {
    console.error('AI子任务详情分析失败:', error)
    logAIResponseError(error, 'AI子任务详情分析')

    // 返回使用关键词分析的默认结果
    return subtasks.map((title) => ({
      title,
      priority: suggestPriorityByKeywords(title),
      estimatedTime: estimateTimeByKeywords(title),
      estimatedMinutes: parseTimeToMinutes(estimateTimeByKeywords(title)),
    }))
  }
}

/**
 * 解析时间文本为分钟数
 * @param timeText 时间文本，如 "30分钟"、"2小时"、"1天"
 * @returns 对应的分钟数
 */
function parseTimeToMinutes(timeText: string): number {
  const text = timeText.toLowerCase().trim()

  // 匹配数字
  const numberMatch = text.match(/\d+/)
  if (!numberMatch) return 30 // 默认30分钟

  const number = parseInt(numberMatch[0])

  // 根据单位转换
  if (text.includes('分钟') || text.includes('分') || text.includes('min')) {
    return number
  } else if (text.includes('小时') || text.includes('时') || text.includes('hour')) {
    return number * 60
  } else if (text.includes('天') || text.includes('日') || text.includes('day')) {
    return number * 8 * 60 // 假设一天工作8小时
  } else if (text.includes('周') || text.includes('week')) {
    return number * 5 * 8 * 60 // 假设一周工作5天
  }

  // 默认按分钟处理
  return number
}

/**
 * 生成包含待办事项信息的系统提示词
 * @param todos 待办事项列表
 * @returns 系统提示词内容
 */
export function generateTodoSystemPrompt(todos: Todo[]): string {
  // 分析待办事项数据
  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)
  const highPriorityTodos = activeTodos.filter((todo) => todo.priority && todo.priority >= 4)
  const mediumPriorityTodos = activeTodos.filter(
    (todo) => todo.priority && todo.priority >= 2 && todo.priority < 4
  )
  const lowPriorityTodos = activeTodos.filter((todo) => !todo.priority || todo.priority < 2)
  const unanalyzedTodos = activeTodos.filter((todo) => !todo.aiAnalyzed)
  const todosWithEstimation = activeTodos.filter((todo) => todo.estimatedTime)
  // 分析任务创建时间分布
  const recentTodos = activeTodos.filter((todo) => {
    const createdDate = new Date(todo.createdAt)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    return createdDate > threeDaysAgo
  })
  const oldTodos = activeTodos.filter((todo) => {
    const createdDate = new Date(todo.createdAt)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return createdDate < weekAgo
  })

  // 构建数据摘要
  const dataSummary = {
    totalActive: activeTodos.length,
    totalCompleted: completedTodos.length,
    highPriority: highPriorityTodos.length,
    mediumPriority: mediumPriorityTodos.length,
    lowPriority: lowPriorityTodos.length,
    unanalyzed: unanalyzedTodos.length,
    withEstimation: todosWithEstimation.length,
    recentCreated: recentTodos.length,
    oldTasks: oldTodos.length,
    topTags: '暂无标签',
    recentCompleted: completedTodos.filter((todo) => {
      const completedDate = new Date(todo.completedAt || todo.updatedAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return completedDate > weekAgo
    }).length,
  }

  // 获取详细的任务列表（按优先级排序）
  const sortedActiveTodos = [...activeTodos].sort((a, b) => {
    const priorityA = a.priority || 0
    const priorityB = b.priority || 0
    return priorityB - priorityA // 高优先级在前
  })

  const activeTasksDetail = sortedActiveTodos
    .map((todo, index) => {
      const priority = todo.priority ? `${todo.priority}星` : '无'
      const estimation = todo.estimatedTime || '未估算'
      // 检查todo对象是否有tags属性
      const tags =
        'tags' in todo && Array.isArray(todo.tags) && todo.tags.length > 0
          ? `[标签:${todo.tags.join(',')}]`
          : ''
      return `${index + 1}. ${todo.title} [优先级:${priority}] [时间:${estimation}]${tags ? ' ' + tags : ''}`
    })
    .join('\n')

  // 获取最近完成的任务详情（按完成时间倒序）
  const sortedCompletedTodos = [...completedTodos]
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt).getTime()
      const dateB = new Date(b.completedAt || b.updatedAt).getTime()
      return dateB - dateA // 最近完成的在前
    })
    .slice(0, 10) // 只取最近10个

  const completedTasksDetail = sortedCompletedTodos
    .slice(0, 5) // 只显示最近5个
    .map((todo, index) => {
      const priority = todo.priority ? `${todo.priority}星` : '无'
      const estimation = todo.estimatedTime || '未估算'

      // 计算完成用时
      const createdTime = new Date(todo.createdAt).getTime()
      const completedTime = new Date(todo.completedAt || todo.updatedAt).getTime()
      const daysToComplete = Math.floor((completedTime - createdTime) / (1000 * 60 * 60 * 24))
      const completionSpeed = daysToComplete === 0 ? '当天' : `${daysToComplete}天`

      return `${index + 1}. ${todo.title} [优先级:${priority}] [用时:${completionSpeed}] [预估:${estimation}]`
    })
    .join('\n')

  // 生成精简的系统提示词
  const systemPrompt = `你是专业的任务管理助手。用户当前有 ${dataSummary.totalActive} 个待完成任务和 ${dataSummary.totalCompleted} 个已完成任务。请基于以下具体任务信息提供个性化建议。

## 待完成任务 (${dataSummary.totalActive}个)
${activeTodos.length > 0 ? activeTasksDetail : '暂无待完成任务'}

## 最近完成任务 (最新5个)
${completedTodos.length > 0 ? completedTasksDetail : '暂无已完成任务'}

请基于以上具体任务信息回答用户问题，提供针对性的任务管理建议。可以直接引用任务内容、优先级和时间信息。`

  return systemPrompt
}

/**
 * 生成基于待办事项数据的智能提问
 * @param todos 待办事项列表
 * @returns 智能提问结果
 */
export async function generateSmartQuestion(todos: Todo[]): Promise<SmartQuestionResult> {
  try {
    // 分析待办事项数据
    const activeTodos = todos.filter((todo) => !todo.completed)
    const completedTodos = todos.filter((todo) => todo.completed)
    const highPriorityTodos = activeTodos.filter((todo) => todo.priority && todo.priority >= 4)
    const unanalyzedTodos = activeTodos.filter((todo) => !todo.aiAnalyzed)
    const todosWithEstimation = activeTodos.filter((todo) => todo.estimatedTime)

    // 构建数据摘要
    const dataSummary = {
      totalActive: activeTodos.length,
      totalCompleted: completedTodos.length,
      highPriority: highPriorityTodos.length,
      unanalyzed: unanalyzedTodos.length,
      withEstimation: todosWithEstimation.length,
      recentCompleted: completedTodos.filter((todo) => {
        const completedDate = new Date(todo.completedAt || todo.updatedAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return completedDate > weekAgo
      }).length,
    }

    // 获取任务样本
    const activeSamples = activeTodos.slice(0, 3).map((todo) => ({
      text: todo.title,
      priority: todo.priority || 0,
      estimatedTime: todo.estimatedTime || '未估算',
    }))

    const completedSamples = completedTodos.slice(-3).map((todo) => ({
      text: todo.title,
      completedAt: todo.completedAt || todo.updatedAt,
    }))

    const prompt = `作为一个专业的任务管理顾问，请基于以下待办事项数据生成一个有价值的智能提问：

数据概览：
- 待完成任务：${dataSummary.totalActive} 个
- 已完成任务：${dataSummary.totalCompleted} 个
- 高优先级任务：${dataSummary.highPriority} 个
- 未分析任务：${dataSummary.unanalyzed} 个
- 有时间估算的任务：${dataSummary.withEstimation} 个
- 近一周完成任务：${dataSummary.recentCompleted} 个

待完成任务样本：
${activeSamples
  .map(
    (todo, index) =>
      `${index + 1}. ${todo.text} (优先级: ${todo.priority}/5, 预估: ${todo.estimatedTime})`
  )
  .join('\n')}

最近完成任务样本：
${completedSamples
  .map(
    (todo, index) =>
      `${index + 1}. ${todo.text} (完成时间: ${new Date(todo.completedAt).toLocaleDateString()})`
  )
  .join('\n')}

请根据以上数据生成一个智能提问，帮助用户：
1. 优化任务优先级和时间安排
2. 分析工作效率和完成模式
3. 发现任务管理中的问题和改进机会
4. 提供个性化的生产力建议
5. 总结工作成果和进展

提问类型：
- priority: 关于优先级和重要性的问题
- planning: 关于时间规划和安排的问题
- analysis: 关于效率分析和模式识别的问题
- improvement: 关于改进建议和优化的问题
- summary: 关于总结和回顾的问题

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "question": "具体的智能提问内容",
  "category": "问题类型(priority/planning/analysis/improvement/summary)",
  "reasoning": "为什么提出这个问题的理由"
}`

    const response = await getAIResponse(prompt, 0.3)

    // 尝试解析 JSON 响应
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到有效的JSON格式')
      }

      const result: SmartQuestionResult = JSON.parse(jsonMatch[0])

      // 验证结果格式
      if (
        typeof result.question !== 'string' ||
        typeof result.category !== 'string' ||
        typeof result.reasoning !== 'string' ||
        !['priority', 'planning', 'analysis', 'improvement', 'summary'].includes(result.category)
      ) {
        throw new Error('AI返回的数据格式不正确')
      }

      return result
    } catch (parseError) {
      console.warn('解析AI智能提问响应失败:', parseError)
      console.warn('原始响应:', response)

      // 返回默认问题
      return generateFallbackQuestion(todos)
    }
  } catch (error) {
    console.error('生成智能提问失败:', error)
    handleError(error, '生成智能提问失败')

    // 返回默认问题
    return generateFallbackQuestion(todos)
  }
}

/**
 * 生成备用问题（当AI服务不可用时）
 * @param todos 待办事项列表
 * @returns 备用智能提问结果
 */
export function generateFallbackQuestion(todos: Todo[]): SmartQuestionResult {
  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)
  const highPriorityTodos = activeTodos.filter((todo) => todo.priority && todo.priority >= 4)

  // 根据数据特征选择合适的备用问题
  const fallbackQuestions = [
    {
      condition: () => activeTodos.length > 10,
      question: `你目前有 ${activeTodos.length} 个待完成任务，哪些是最重要且紧急的？建议如何优化任务优先级？`,
      category: 'priority' as const,
      reasoning: '任务数量较多，需要优化优先级管理',
    },
    {
      condition: () => highPriorityTodos.length > 3,
      question: `你有 ${highPriorityTodos.length} 个高优先级任务，如何合理安排时间来高效完成它们？`,
      category: 'planning' as const,
      reasoning: '高优先级任务较多，需要时间规划建议',
    },
    {
      condition: () => completedTodos.length > activeTodos.length,
      question: `你已经完成了 ${completedTodos.length} 个任务，表现很棒！从这些完成的任务中，你学到了什么提高效率的方法？`,
      category: 'summary' as const,
      reasoning: '完成任务较多，适合进行总结回顾',
    },
    {
      condition: () => activeTodos.filter((todo) => !todo.aiAnalyzed).length > 5,
      question: `你有多个任务还未进行AI分析，是否需要批量分析来获得优先级和时间估算建议？`,
      category: 'improvement' as const,
      reasoning: '未分析任务较多，建议使用AI分析功能',
    },
  ]

  // 找到第一个符合条件的问题
  const matchedQuestion = fallbackQuestions.find((q) => q.condition())

  if (matchedQuestion) {
    return {
      question: matchedQuestion.question,
      category: matchedQuestion.category,
      reasoning: matchedQuestion.reasoning,
    }
  }

  // 默认通用问题
  return {
    question: '基于你当前的任务情况，有什么需要我帮助分析或建议的吗？',
    category: 'analysis',
    reasoning: '提供通用的任务管理咨询',
  }
}
