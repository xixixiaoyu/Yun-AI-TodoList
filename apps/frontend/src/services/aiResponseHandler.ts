import { handleError } from '@/utils/logger'

/**
 * AI 响应处理模块
 * 提供通用的 AI 响应解析、验证和错误处理功能
 */

/**
 * 解析 AI 响应的 JSON 数据
 * @param response AI 服务返回的原始响应
 * @returns 解析后的 JSON 对象
 */
export function parseAIResponse(response: string): Record<string, unknown> {
  try {
    // 尝试直接解析 JSON
    return JSON.parse(response)
  } catch (error) {
    // 如果直接解析失败，尝试提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (extractedError) {
        console.warn('解析提取的 JSON 部分失败:', extractedError)
        throw new Error('无法解析 AI 响应')
      }
    }

    throw new Error('AI 响应中未找到有效的 JSON 格式' + error)
  }
}

/**
 * 验证 AI 响应数据的完整性
 * @param data 解析后的数据
 * @param requiredFields 必需的字段列表
 * @returns 验证结果
 */
export function validateAIResponse(
  data: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return requiredFields.every(
    (field) =>
      Object.prototype.hasOwnProperty.call(data, field) &&
      data[field] !== undefined &&
      data[field] !== null
  )
}

/**
 * 从非标准格式中提取关键信息
 * @param response AI 服务返回的原始响应
 * @param extractionRules 提取规则
 * @returns 提取的数据
 */
export function extractFromNonStandardResponse(
  response: string,
  extractionRules: Record<string, RegExp>
): Record<string, unknown> {
  const extractedData: Record<string, unknown> = {}

  for (const [key, regex] of Object.entries(extractionRules)) {
    const match = response.match(regex)
    if (match && match[1]) {
      extractedData[key] = match[1].trim()
    }
  }

  return extractedData
}

/**
 * 处理 AI 响应的通用函数
 * @param response AI 服务返回的原始响应
 * @param requiredFields 必需的字段列表
 * @param extractionRules 非标准响应的提取规则（可选）
 * @returns 处理后的数据
 */
export function handleAIResponse(
  response: string,
  requiredFields: string[],
  extractionRules?: Record<string, RegExp>
): Record<string, unknown> {
  try {
    // 尝试解析标准 JSON 响应
    const data = parseAIResponse(response)

    // 验证必需字段
    if (validateAIResponse(data, requiredFields)) {
      return data
    }

    throw new Error('AI 响应缺少必需字段')
  } catch (error) {
    console.warn('解析标准 AI 响应失败:', error)

    // 如果提供了提取规则，尝试从非标准响应中提取数据
    if (extractionRules) {
      try {
        const extractedData = extractFromNonStandardResponse(response, extractionRules)

        // 验证提取的数据是否包含必需字段
        if (validateAIResponse(extractedData, requiredFields)) {
          return extractedData
        }

        console.warn('从非标准响应中提取的数据不完整')
      } catch (extractionError) {
        console.warn('从非标准响应中提取数据失败:', extractionError)
      }
    }

    // 如果所有方法都失败，抛出错误
    throw new Error('无法处理 AI 响应')
  }
}

/**
 * 创建默认响应数据
 * @param defaultData 默认数据
 * @returns 默认响应数据
 */
export function createDefaultResponse(
  defaultData: Record<string, unknown>
): Record<string, unknown> {
  return { ...defaultData }
}

/**
 * 记录 AI 响应处理错误
 * @param error 错误对象
 * @param context 错误上下文
 */
export function logAIResponseError(error: unknown, context: string): void {
  handleError(error, `AI 响应处理失败: ${context}`)
}
