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

export async function getSuggestedTodos(
  userMessage: string,
  historicalTodos: string[]
): Promise<string> {
  try {
    const historicalTodosContext =
      historicalTodos.length > 0
        ? `以下是用户的历史待办事项：\n${historicalTodos.join(
            '\n'
          )}\n\n请根据这些历史待办事项来生成建议。`
        : '用户没有历史待办事项。'

    const response = await axios.post<AIResponse>(
      `${API_URL}/v1/chat/completions`,
      {
        model: 'deepseek-coder',
        messages: [
          {
            role: 'system',
            content:
              '你是一个智能助手，专门帮助用户规划每日待办事项和回答相关问题。请提供简洁明了的回答，每个待办事项单独一行。如果用户要求生成建议的待办事项，请直接列出待办事项，不要添加额外的解释。'
          },
          {
            role: 'user',
            content: `${historicalTodosContext}\n\n${userMessage}`
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
