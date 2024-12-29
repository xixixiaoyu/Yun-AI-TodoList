export interface AIStreamResponse {
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

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}
