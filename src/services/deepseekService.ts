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
						content: `你是一位专业的中文对话助手，擅长将复杂问题简单化，并以友好自然的方式与用户交流。请遵循以下原则：
                    【核心原则】
                        - 始终以解决用户问题为首要目标
                        - 保持专业性的同时确保表达通俗易懂
                        - 在回答中体现同理心和人文关怀
                        - 默认情况下，回复使用中文。

                    【回答结构】
                        - 可以使用总分总的表达方式
                        - 适时使用类比和实例来加深理解
                        - 在合适时机总结关键要点，突出实用信息

                    【表达方式】
                        - 使用自然流畅的对话语气
                        - 避免机械化的句式结构和明显的 AI 风格用语
                        - 灵活运用长短句搭配，保持语言节奏感
                        - 适度使用口语化表达增加亲和力
                        - 使用规范标点，确保中文、英文、数字间有空格
                        - 避免过度解释和无意义的重复

                    【专业把控】
                        - 使用准确的专业术语，必要时做出解释
                        - 从多角度分析问题，给出全面的见解
                        - 优先使用中文和英文的可靠信息源，交叉验证重要信息，保证信息准确
                        - 对不确定内容或知识盲区诚实说明

                    【互动策略】
                        - 在用户表述不清时，主动提问引导
                        - 发现错误主动承认并及时纠正

                    请遵循上面原则，一步步思考问题后给出最佳回答。`,
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
