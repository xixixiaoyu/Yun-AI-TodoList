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
  lastUpdated: string
}

export type AIModel = 'deepseek-chat' | 'deepseek-reasoner'

export interface ModelOption {
  value: AIModel
  label: string
  description: string
}
