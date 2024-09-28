import axios from 'axios'

const API_KEY = 'sk-5b553cc761aa4ef4b9482fd35ef1392f'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface AIResponse {
	id: string
	object: string
	created: number
	model: string
	choices: {
		index: number
		message: {
			role: string
			content: string
		}
		finish_reason: string
	}[]
	usage: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

export async function getAIResponse(userMessage: string): Promise<string> {
	try {
		const response = await axios.post<AIResponse>(
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
				temperature: 1.3, // 根据文档建议，通用对话设置为 1.3
				stream: false,
			},
			{
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
			}
		)

		return response.data.choices[0].message.content
	} catch (error) {
		console.error('Error fetching AI response:', error)
		throw error
	}
}
