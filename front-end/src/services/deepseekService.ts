import axios from 'axios'

const API_KEY = 'sk-5b553cc761aa4ef4b9482fd35ef1392f'
const API_URL = 'https://api.deepseek.com'

export async function getSuggestedTodos(userMessage: string) {
  try {
    const response = await axios.post(
      `${API_URL}/v1/chat/completions`,
      {
        model: 'deepseek-coder',
        messages: [
          {
            role: 'system',
            content: '你是一个智能助手，专门帮助用户规划每日待办事项和回答相关问题。'
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

    const aiResponse = response.data.choices[0].message.content
    return aiResponse.split('\n').filter((item: string) => item.trim() !== '')
  } catch (error) {
    console.error('Error fetching AI response:', error)
    throw error
  }
}
