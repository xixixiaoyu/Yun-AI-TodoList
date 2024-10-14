const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface AIStreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    delta: {
      content?: string
    }
    index: number
    finish_reason: string | null
  }[]
}

let abortController: AbortController | null = null

export function abortCurrentRequest() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

export async function getAIResponse(
  userMessage: string,
  language: string = 'zh',
  temperature: number = 0.5
): Promise<string> {
  try {
    const languageInstruction = language === 'zh' ? '请用中文回复。' : '请用英文回复。'

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个智能助手，可以回答各种问题并提供帮助。${languageInstruction}`,
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
      throw new Error(`HTTP 错误! 状态: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error('无效的 AI 响应格式')
    }
  } catch (error) {
    console.error('获取 AI 响应时出错:', error)
    if (error instanceof Error) {
      if (error.message.startsWith('HTTP 错误')) {
        throw new Error(`API 错误: ${error.message}`)
      } else if (error.message === '无效的 AI 响应格式') {
        throw error
      } else {
        throw new Error('无法连接到 AI 服务，请检查您的网络连接')
      }
    }
    throw new Error('生成建议待办事项时出现未知错误')
  }
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function getAIStreamResponse(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  let buffer = ''

  try {
    abortController = new AbortController()
    const signal = abortController.signal

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个知识广泛丰富的智能对话助手，可以提供专业详尽的回答。注意中文和数字，中文和英文之间需要空格。回答请通俗易懂，自然流畅，经过彻底的研究和反复的思考，提供准确可靠的信息。`,
          },
          ...messages, // 包含历史消息
        ],
        temperature: 0.5,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onChunk('[DONE]')
        break
      }

      buffer += new TextDecoder().decode(value)
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6)
          if (jsonData === '[DONE]') {
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
            console.error('解析 JSON 时出错:', error)
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('请求被中断')
      onChunk('[ABORTED]')
    } else {
      console.error('获取 AI 响应时出错:', error)
      throw error
    }
  } finally {
    abortController = null
  }
}

export async function getAITagSuggestions(todoText: string, locale: string): Promise<string[]> {
  const prompt = `为以下待办事项推荐一到三个最合适的标签，只从以下分类中选择：学习、娱乐、工作、生活、其他。只返回标签，用逗号分隔：\n${todoText}`
  try {
    const response = await getAIResponse(prompt, locale, 1.0)
    return response.split(',').map(tag => tag.trim())
  } catch (error) {
    console.error('获取 AI 标签建议时出错:', error)
    return []
  }
}
