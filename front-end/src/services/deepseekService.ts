import axios from 'axios'

const API_KEY = 'sk-5b553cc761aa4ef4b9482fd35ef1392f'
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

const temperature = 0.5

export async function getAIResponse(userMessage: string): Promise<string> {
	try {
		const response = await axios.post<AIStreamResponse>(
			API_URL,
			{
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content: '你是一个智能助手，可以回答各种问题并提供帮助。',
					},
					{
						role: 'user',
						content: userMessage,
					},
				],
				temperature: temperature,
				stream: false,
			},
			{
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				timeout: 30000, // 设置 30 秒超时
			}
		)

		if (response.data && response.data.choices && response.data.choices.length > 0) {
			// 修改这里：检查 message 属性而不是 delta
			return response.data.choices[0].message?.content || ''
		} else {
			throw new Error('无效的 AI 响应格式')
		}
	} catch (error) {
		console.error('获取 AI 响应时出错:', error)
		if (axios.isAxiosError(error)) {
			if (error.response) {
				throw new Error(
					`API 错误: ${error.response.status} - ${
						error.response.data.error?.message || '未知错误'
					}`
				)
			} else if (error.request) {
				throw new Error('无法连接到 AI 服务，请检查您的网络连接')
			}
		}
		throw new Error('生成建议待办事项时出现未知错误')
	}
}

export async function getAIStreamResponse(
	userMessage: string,
	onChunk: (chunk: string) => void
): Promise<void> {
	let buffer = ''
	let lastChunk = ''

	try {
		await axios.post(
			API_URL,
			{
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content:
							'你是一个智能助手，可以回答各种问题并提供帮助。请保持简洁，避免重复。',
					},
					{
						role: 'user',
						content: userMessage,
					},
				],
				temperature: temperature,
				stream: true,
			},
			{
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				responseType: 'stream',
				onDownloadProgress: progressEvent => {
					const chunk = progressEvent.event.target?.response || ''
					buffer += chunk
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
								const content = parsedData.choices[0].delta.content
								if (content && content !== lastChunk) {
									onChunk(content)
									lastChunk = content
								}
							} catch (error) {
								console.error('解析 JSON 时出错:', error)
							}
						}
					}
				},
			}
		)
	} catch (error) {
		console.error('获取 AI 响应时出错:', error)
		throw error
	}
}
