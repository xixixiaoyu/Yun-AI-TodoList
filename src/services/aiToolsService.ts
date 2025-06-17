import type { SearchOptions } from './searchService'
import { googleSearchService } from './searchService'

// 工具调用接口
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

// 工具调用结果接口
export interface ToolCallResult {
  tool_call_id: string
  role: 'tool'
  content: string
}

// 可用工具定义
export const AVAILABLE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: '搜索网络信息，获取最新的、准确的信息来回答用户问题',
      parameters: {
        type: 'object',
        properties: {
          queries: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: '搜索查询关键词数组，可以包含多个相关的搜索词',
          },
          limit: {
            type: 'number',
            description: '每个查询返回的结果数量，默认为 5',
            default: 5,
          },
          locale: {
            type: 'string',
            description: '搜索语言，如 zh-CN（中文）或 en-US（英文）',
            default: 'zh-CN',
          },
        },
        required: ['queries'],
      },
    },
  },
]

/**
 * 执行工具调用
 * @param toolCall 工具调用信息
 * @returns 工具调用结果
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolCallResult> {
  const { function: func } = toolCall

  try {
    let result: string

    switch (func.name) {
      case 'search_web':
        result = await handleWebSearch(func.arguments)
        break
      default:
        result = `错误：未知的工具函数 "${func.name}"`
    }

    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: result,
    }
  } catch (error) {
    console.error('工具调用执行失败:', error)
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: `工具调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 处理网络搜索工具调用
 */
async function handleWebSearch(argumentsStr: string): Promise<string> {
  try {
    const args = JSON.parse(argumentsStr)
    const { queries, limit = 10, locale = 'zh-CN' } = args

    if (!Array.isArray(queries) || queries.length === 0) {
      return '错误：搜索查询不能为空'
    }

    const searchOptions: SearchOptions = {
      limit: Math.min(limit, 10), // 限制最大结果数
      locale,
    }

    console.warn('🔍 AI 助手正在搜索:', queries)

    const searchResult = await googleSearchService.search(queries, searchOptions)

    // 格式化搜索结果为 AI 可理解的文本
    let formattedResult = '搜索结果：\n\n'

    for (const search of searchResult.searches) {
      formattedResult += `关键词："${search.query}"\n`
      formattedResult += `找到 ${search.results.length} 个结果：\n\n`

      for (let i = 0; i < search.results.length; i++) {
        const result = search.results[i]
        formattedResult += `${i + 1}. ${result.title}\n`
        formattedResult += `   链接：${result.link}\n`
        formattedResult += `   摘要：${result.snippet}\n\n`
      }

      formattedResult += '---\n\n'
    }

    console.warn('✅ 搜索完成，结果已格式化')
    return formattedResult
  } catch (error) {
    console.error('搜索工具执行失败:', error)
    return `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 检查消息是否需要搜索
 * 基于关键词和上下文判断是否应该触发搜索
 */
export function shouldTriggerSearch(message: string): boolean {
  const searchTriggers = [
    // 时间相关
    '最新',
    '最近',
    '今天',
    '昨天',
    '本周',
    '本月',
    '2024',
    '2025',
    // 新闻事件
    '新闻',
    '事件',
    '发生了什么',
    '怎么了',
    '情况',
    // 实时信息
    '价格',
    '股价',
    '汇率',
    '天气',
    '温度',
    // 技术更新
    '版本',
    '更新',
    '发布',
    '新功能',
    // 比较和选择
    '哪个好',
    '推荐',
    '比较',
    '选择',
    // 具体查询
    '在哪里',
    '怎么去',
    '地址',
    '电话',
    // 学习研究
    '教程',
    '如何',
    '方法',
    '步骤',
  ]

  const lowerMessage = message.toLowerCase()
  return searchTriggers.some(
    (trigger) => lowerMessage.includes(trigger) || lowerMessage.includes(trigger.toLowerCase())
  )
}

/**
 * 从用户消息中提取搜索关键词
 */
export function extractSearchKeywords(message: string): string[] {
  // 简单的关键词提取逻辑
  // 在实际应用中，可以使用更复杂的 NLP 技术

  // 移除常见的停用词
  const stopWords = [
    '的',
    '了',
    '在',
    '是',
    '我',
    '有',
    '和',
    '就',
    '不',
    '人',
    '都',
    '一',
    '一个',
    '上',
    '也',
    '很',
    '到',
    '说',
    '要',
    '去',
    '你',
    '会',
    '着',
    '没有',
    '看',
    '好',
    '自己',
    '这',
    '那',
    '什么',
    '怎么',
    '为什么',
    '哪里',
    '如何',
    '请',
    '帮我',
  ]

  // 分词（简单的空格和标点分割）
  const words = message
    .replace(/[，。！？；：""''（）【】]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.includes(word))

  // 如果提取的关键词太少，使用原始消息
  if (words.length === 0) {
    return [message.slice(0, 50)] // 限制长度
  }

  // 返回前3个最相关的关键词
  return words.slice(0, 3)
}

/**
 * 生成带搜索功能的系统提示词
 */
export function getSystemPromptWithSearch(): string {
  return `你是一个智能助手，具有搜索网络信息的能力。

当用户询问以下类型的问题时，你应该使用 search_web 工具来获取最新、准确的信息：
1. 最新新闻、事件或趋势
2. 实时数据（价格、股价、天气等）
3. 技术更新、产品发布
4. 地点信息、营业时间
5. 比较和推荐
6. 学习教程和方法

使用搜索工具的步骤：
1. 分析用户问题，确定需要搜索的关键信息
2. 调用 search_web 工具，使用相关的搜索关键词
3. 基于搜索结果提供准确、有用的回答
4. 在回答中引用搜索来源，提高可信度

注意事项：
- 优先使用搜索结果中的信息
- 如果搜索结果不够准确，可以说明并提供一般性建议
- 始终保持友好、专业的语调
- 用中文回复，除非用户明确要求其他语言

现在请根据用户的问题提供帮助。`
}
