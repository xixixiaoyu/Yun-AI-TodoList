import i18n from '../i18n'
import { logger } from '../utils/logger'
import { getAIModel, getApiKey } from './configService'
import { AIStreamResponse, Message } from './types'

// 获取系统提示词配置
const getSystemPromptConfig = () => {
  try {
    const config = localStorage.getItem('system_prompt_config')
    if (config) {
      const parsedConfig = JSON.parse(config)
      return {
        enabled: parsedConfig.enabled || false,
        activePromptId: parsedConfig.activePromptId || null,
      }
    }
  } catch (error) {
    logger.warn('获取系统提示词配置失败', error, 'DeepSeekService')
  }
  return {
    enabled: false,
    activePromptId: null,
  }
}

// 获取激活的系统提示词内容
const getActiveSystemPromptContent = () => {
  const config = getSystemPromptConfig()

  if (!config.enabled || !config.activePromptId) {
    return ''
  }

  try {
    const prompts = localStorage.getItem('system_prompts')
    if (prompts) {
      const promptList = JSON.parse(prompts)
      const activePrompt = promptList.find((p: any) => p.id === config.activePromptId && p.isActive)
      if (activePrompt) {
        return activePrompt.content
      }
    }
  } catch (error) {
    logger.warn('获取激活系统提示词失败', error, 'DeepSeekService')
  }

  return ''
}

// 错误处理函数
function handleError(error: unknown, context: string, source: string) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logger.error(`${context}: ${errorMessage}`, error, source)
}

const API_URL = 'https://api.deepseek.com/chat/completions'

let abortController: AbortController | null = null

export function abortCurrentRequest() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

const getHeaders = () => {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(i18n.global.t('configureApiKey'))
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export async function getAIStreamResponse(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onThinking?: (thinking: string) => void
): Promise<void> {
  let buffer = ''
  let isReading = true

  try {
    abortController = new AbortController()
    const signal = abortController.signal

    // 构建包含系统提示词的消息列表
    const systemPromptContent = getActiveSystemPromptContent()
    const messagesWithSystemPrompt: Message[] = [
      {
        role: 'system',
        content: systemPromptContent,
      },
      ...messages,
    ]

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: getAIModel(),
        messages: messagesWithSystemPrompt,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(i18n.global.t('streamError'))
    }

    while (isReading) {
      const { done, value } = await reader.read()
      if (done) {
        isReading = false
        break
      }

      buffer += new TextDecoder().decode(value)
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6)
          if (jsonData === '[DONE]') {
            isReading = false
            onChunk('[DONE]')
            return
          }
          try {
            const parsedData: AIStreamResponse = JSON.parse(jsonData)
            const content = parsedData.choices[0]?.delta?.content
            const reasoningContent = parsedData.choices[0]?.delta?.reasoning_content

            if (content) {
              onChunk(content)
            }

            if (reasoningContent && onThinking) {
              onThinking(reasoningContent)
            }
          } catch (error) {
            handleError(error, i18n.global.t('jsonParseError'), 'DeepSeekService')
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(i18n.global.t('requestAborted'), error, 'DeepSeekService')
      onChunk('[ABORTED]')
    } else {
      handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
      throw error
    }
  } finally {
    abortController = null
  }
}

export async function getAIResponse(userMessage: string, temperature = 0.3): Promise<string> {
  try {
    const systemPromptContent = getActiveSystemPromptContent()

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: getAIModel(),
        messages: [
          {
            role: 'system',
            content: systemPromptContent,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
    if (error instanceof Error) {
      if (error.message === i18n.global.t('configureApiKey')) {
        throw error
      } else if (error.message.startsWith('HTTP 错误')) {
        throw new Error(i18n.global.t('apiError', { error: error.message }))
      } else if (error.message === i18n.global.t('invalidAiResponse')) {
        throw error
      } else {
        throw new Error(i18n.global.t('networkConnectionError'))
      }
    }
    throw new Error(i18n.global.t('unknownError'))
  }
}

export async function optimizeText(text: string): Promise<string> {
  try {
    // 文本优化使用专门的系统提示词，不受用户自定义系统提示词影响
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: getAIModel(),
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的文本优化助手，擅长提升文本质量。请按以下要求优化文本：\n1. 使表达更自然流畅、逻辑清晰\n2. 修正语法错误和标点符号使用\n3. 保持原意的同时提升表达效果\n4. 确保语言风格一致且符合语境\n5. 直接返回优化后的文本，无需返回其他任何多余内容',
          },
          {
            role: 'user',
            content: `请优化文本：\n"${text}"`,
          },
        ],
        temperature: 0.3,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('textOptimizationError'), 'DeepSeekService')
    throw error
  }
}
