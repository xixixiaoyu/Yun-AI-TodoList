export interface AIStreamResponse {
  choices: {
    delta: {
      content?: string
    }
  }[]
}

export interface Message {
  role: 'user' | 'system' | 'assistant'
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  lastUpdated: string
  tags?: string[]
  summary?: string
  messageCount?: number
  wordCount?: number
}

export type AIModel = 'deepseek-chat' | 'deepseek-reasoner'

export interface ModelOption {
  value: AIModel
  label: string
  description: string
}
