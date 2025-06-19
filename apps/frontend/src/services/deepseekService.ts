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
      // 为旧配置添加默认值
      return {
        enabled: parsedConfig.enabled || false,
        activePromptId: parsedConfig.activePromptId || null,
        defaultPromptContent:
          parsedConfig.defaultPromptContent || '你是一个智能助手，可以回答各种问题并提供帮助。',
        includeLanguageInstruction:
          parsedConfig.includeLanguageInstruction !== undefined
            ? parsedConfig.includeLanguageInstruction
            : true,
      }
    }
  } catch (error) {
    logger.warn('获取系统提示词配置失败', error, 'DeepSeekService')
  }
  return {
    enabled: false,
    activePromptId: null,
    defaultPromptContent: '你是一个智能助手，可以回答各种问题并提供帮助。',
    includeLanguageInstruction: true, // 默认启用语言指令
  }
}

// 获取激活的系统提示词内容
const getActiveSystemPromptContent = (language = 'zh') => {
  const config = getSystemPromptConfig()
  const includeLanguageInstruction = config.includeLanguageInstruction !== false // 默认为true

  if (!config.enabled || !config.activePromptId) {
    // 使用默认系统提示词
    const languageInstruction = includeLanguageInstruction
      ? language === 'zh'
        ? '请用中文回复。'
        : '请用英文回复。'
      : ''
    return `${config.defaultPromptContent}${languageInstruction}`
  }

  try {
    const prompts = localStorage.getItem('system_prompts')
    if (prompts) {
      const promptList = JSON.parse(prompts)
      const activePrompt = promptList.find((p: any) => p.id === config.activePromptId && p.isActive)
      if (activePrompt) {
        const languageInstruction = includeLanguageInstruction
          ? language === 'zh'
            ? ' 默认使用中文回复。'
            : ' 默认使用英文回复。'
          : ''
        return `${activePrompt.content}${languageInstruction}`
      }
    }
  } catch (error) {
    logger.warn('获取激活系统提示词失败，使用默认提示词', error, 'DeepSeekService')
  }

  // 回退到默认提示词
  const languageInstruction = includeLanguageInstruction
    ? language === 'zh'
      ? '默认使用中文回复'
      : '默认使用英文回复。'
    : ''
  return `${config.defaultPromptContent}${languageInstruction}`
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
  language = 'zh'
): Promise<void> {
  let buffer = ''
  let isReading = true

  try {
    abortController = new AbortController()
    const signal = abortController.signal

    // 构建包含系统提示词的消息列表
    const systemPromptContent = getActiveSystemPromptContent(language)
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
            if (content) {
              onChunk(content)
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

export async function getAIResponse(
  userMessage: string,
  language = 'zh',
  temperature = 0.5
): Promise<string> {
  try {
    const systemPromptContent = getActiveSystemPromptContent(language)

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
              '你是一个顶级的文本优化助手，请优化文本使其更自然流畅、标点符号使用更正确、更符合用户的意图，优化后的文本请直接返回，不要添加任何解释。',
          },
          {
            role: 'user',
            content: `请优化文本：\n"${text}"`,
          },
        ],
        temperature: 0.5,
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
