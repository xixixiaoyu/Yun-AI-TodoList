import axios from 'axios'

const API_KEY = 'sk-5b553cc761aa4ef4b9482fd35ef1392f'
const API_URL = 'https://api.deepseek.com'

interface AIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function getAIResponse(userMessage: string): Promise<string> {
  try {
    const response = await axios.post<AIResponse>(
      `${API_URL}/v1/chat/completions`,
      {
        model: 'deepseek-coder',
        messages: [
          {
            role: 'system',
            content: '你是一个智能助手，可以回答各种问题并提供帮助。'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Error fetching AI response:', error)
    throw error
  }
}
