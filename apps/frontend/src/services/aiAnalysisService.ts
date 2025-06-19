import i18n from '@/i18n'
import type { AIAnalysisResult, Todo } from '@/types/todo'
import { handleError } from '@/utils/logger'
import { getAIResponse } from './deepseekService'

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

      const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult

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

/**
 * 批量分析多个 Todo 项目
 * @param todos Todo 项目列表
 * @returns 分析结果映射
 */
export async function batchAnalyzeTodos(todos: Todo[]): Promise<Map<number, AIAnalysisResult>> {
  const results = new Map<number, AIAnalysisResult>()

  // 过滤出需要分析的 Todo（未分析过的）
  const todosToAnalyze = todos.filter((todo) => !todo.aiAnalyzed && !todo.completed)

  if (todosToAnalyze.length === 0) {
    return results
  }

  try {
    // 构建批量分析的提示词
    const todoList = todosToAnalyze
      .map((todo, index) => `${index + 1}. ${todo.text} (ID: ${todo.id})`)
      .join('\n')

    const prompt = `作为一个专业的任务管理助手，请批量分析以下待办事项的重要等级和完成时间估算：

${todoList}

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
  "analyses": [
    {
      "id": Todo的ID,
      "priority": 数字(1-5),
      "estimatedTime": "时间估算字符串",
      "reasoning": "简短的分析理由"
    }
  ]
}`

    const response = await getAIResponse(prompt, 0.3)
    console.warn('批量分析 AI 响应:', response)

    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到有效的JSON格式')
      }

      const result = JSON.parse(jsonMatch[0])
      console.warn('解析的批量分析结果:', result)

      if (result.analyses && Array.isArray(result.analyses)) {
        result.analyses.forEach((analysis: Record<string, unknown>) => {
          console.warn('处理分析项:', analysis)
          if (analysis.id && analysis.priority && analysis.estimatedTime) {
            // 确保 ID 类型一致（转换为数字）
            const todoId = typeof analysis.id === 'string' ? parseInt(analysis.id) : analysis.id
            console.warn(`设置结果 - 原始ID: ${analysis.id}, 转换后ID: ${todoId}`)
            results.set(todoId, {
              priority: Math.max(1, Math.min(5, Math.round(Number(analysis.priority)))),
              estimatedTime: analysis.estimatedTime,
              reasoning: analysis.reasoning || '批量分析结果',
            })
          }
        })
      }
    } catch (parseError) {
      console.warn('批量分析响应解析失败，使用单个分析方法:', parseError)

      // 如果批量分析失败，回退到单个分析
      for (const todo of todosToAnalyze.slice(0, 3)) {
        // 限制数量避免过多请求
        try {
          console.warn(`单个分析任务 ${todo.id}: ${todo.text}`)
          const analysis = await analyzeTodo(todo.text)
          console.warn(`任务 ${todo.id} 单个分析结果:`, analysis)
          results.set(todo.id, analysis)

          // 添加延迟避免请求过于频繁
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.warn(`分析 Todo ${todo.id} 失败:`, error)
        }
      }
    }
  } catch (error) {
    handleError(error, i18n.global.t('batchAnalysisError'), 'AIAnalysisService')
  }

  return results
}

/**
 * 重新分析已存在的 Todo 项目
 * @param todo Todo 项目
 * @returns 更新后的分析结果
 */
export async function reanalyzeTodo(todo: Todo): Promise<AIAnalysisResult> {
  const result = await analyzeTodo(todo.text)
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
