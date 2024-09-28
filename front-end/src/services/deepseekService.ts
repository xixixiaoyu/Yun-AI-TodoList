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
						content: '你是一个智能助手,可以回答各种问题并提供帮助。',
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
			}
		)

		return response.data.choices[0].delta.content || ''
	} catch (error) {
		console.error('Error fetching AI response:', error)
		throw error
	}
}

export async function getAIStreamResponse(
	userMessage: string,
	onChunk: (chunk: string) => void
): Promise<void> {
	let buffer = ''

	try {
		await axios.post(
			API_URL,
			{
				model: 'deepseek-chat',
				messages: [
					{
						role: 'system',
						content: '你是一个智能助手,可以回答各种问题并提供帮助。',
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
								if (content) {
									onChunk(content)
								}
							} catch (error) {
								console.error('Error parsing JSON:', error)
							}
						}
					}
				},
			}
		)
	} catch (error) {
		console.error('Error fetching AI response:', error)
		throw error
	}
}
