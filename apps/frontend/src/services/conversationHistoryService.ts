import type { Conversation } from './types'

export interface ConversationFilter {
  keyword?: string
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  messageCount?: {
    min?: number
    max?: number
  }
}

export interface ConversationStats {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  oldestConversation?: Date
  newestConversation?: Date
  storageSize: number
}

export interface ExportOptions {
  format: 'json' | 'markdown' | 'txt'
  includeMetadata: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  conversations?: string[] // conversation IDs
}

/**
 * 增强的对话历史记录管理服务
 * 提供搜索、分类、导出、统计等高级功能
 */
export class ConversationHistoryService {
  private static readonly STORAGE_KEY = 'conversationHistory'
  private static readonly BACKUP_KEY = 'conversationHistory_backup'
  private static readonly METADATA_KEY = 'conversationMetadata'
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024 // 50MB

  /**
   * 获取所有对话历史
   */
  static getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取对话历史失败:', error)
      return this.restoreFromBackup()
    }
  }

  /**
   * 保存对话历史
   */
  static saveConversations(conversations: Conversation[]): boolean {
    try {
      // 检查存储大小
      const dataSize = new Blob([JSON.stringify(conversations)]).size
      if (dataSize > this.MAX_STORAGE_SIZE) {
        console.warn('对话历史数据过大，开始清理旧数据')
        conversations = this.cleanupOldData(conversations)
      }

      // 创建备份
      const currentData = localStorage.getItem(this.STORAGE_KEY)
      if (currentData) {
        localStorage.setItem(this.BACKUP_KEY, currentData)
      }

      // 保存新数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))

      // 更新元数据
      this.updateMetadata(conversations)

      return true
    } catch (error) {
      console.error('保存对话历史失败:', error)
      return false
    }
  }

  /**
   * 搜索对话
   */
  static searchConversations(filter: ConversationFilter): Conversation[] {
    const conversations = this.getConversations()

    return conversations.filter((conversation) => {
      // 关键词搜索
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase()
        const titleMatch = conversation.title.toLowerCase().includes(keyword)
        const messageMatch = conversation.messages.some((msg) =>
          msg.content.toLowerCase().includes(keyword)
        )
        if (!titleMatch && !messageMatch) return false
      }

      // 日期范围过滤
      if (filter.dateRange) {
        const conversationDate = new Date(conversation.createdAt)
        if (conversationDate < filter.dateRange.start || conversationDate > filter.dateRange.end) {
          return false
        }
      }

      // 标签过滤
      if (filter.tags && filter.tags.length > 0) {
        const conversationTags = conversation.tags || []
        if (!filter.tags.some((tag) => conversationTags.includes(tag))) {
          return false
        }
      }

      // 消息数量过滤
      if (filter.messageCount) {
        const messageCount = conversation.messages.length
        if (filter.messageCount.min && messageCount < filter.messageCount.min) {
          return false
        }
        if (filter.messageCount.max && messageCount > filter.messageCount.max) {
          return false
        }
      }

      return true
    })
  }

  /**
   * 获取对话统计信息
   */
  static getStats(): ConversationStats {
    const conversations = this.getConversations()
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)

    const dates = conversations.map((conv) => new Date(conv.createdAt))
    const oldestConversation =
      dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined
    const newestConversation =
      dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined

    const storageData = localStorage.getItem(this.STORAGE_KEY) || ''
    const storageSize = new Blob([storageData]).size

    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation:
        conversations.length > 0 ? totalMessages / conversations.length : 0,
      oldestConversation,
      newestConversation,
      storageSize,
    }
  }

  /**
   * 导出对话数据
   */
  static async exportConversations(options: ExportOptions): Promise<string> {
    let conversations = this.getConversations()

    // 按选项过滤对话
    if (options.conversations) {
      conversations = conversations.filter(
        (conv) => options.conversations?.includes(conv.id) ?? false
      )
    }

    if (options.dateRange) {
      conversations = conversations.filter((conv) => {
        const date = new Date(conv.createdAt)
        return options.dateRange && date >= options.dateRange.start && date <= options.dateRange.end
      })
    }

    switch (options.format) {
      case 'json':
        return this.exportAsJSON(conversations, options.includeMetadata)
      case 'markdown':
        return this.exportAsMarkdown(conversations, options.includeMetadata)
      case 'txt':
        return this.exportAsText(conversations, options.includeMetadata)
      default:
        throw new Error(`不支持的导出格式: ${options.format}`)
    }
  }

  /**
   * 清理旧数据
   */
  private static cleanupOldData(conversations: Conversation[]): Conversation[] {
    // 按创建时间排序，保留最新的对话
    const sorted = conversations.sort((a, b) => b.createdAt - a.createdAt)

    // 保留最新的 100 个对话，或者总大小不超过限制
    let totalSize = 0
    const cleaned: Conversation[] = []

    for (const conversation of sorted) {
      const conversationSize = new Blob([JSON.stringify(conversation)]).size
      if (totalSize + conversationSize > this.MAX_STORAGE_SIZE * 0.8 && cleaned.length >= 50) {
        break
      }
      cleaned.push(conversation)
      totalSize += conversationSize
    }

    return cleaned
  }

  /**
   * 从备份恢复数据
   */
  private static restoreFromBackup(): Conversation[] {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY)
      if (backupData) {
        console.warn('从备份恢复对话历史')
        return JSON.parse(backupData)
      }
    } catch (error) {
      console.error('从备份恢复失败:', error)
    }
    return []
  }

  /**
   * 更新元数据
   */
  private static updateMetadata(conversations: Conversation[]): void {
    const metadata = {
      lastUpdated: Date.now(),
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
    }

    try {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('更新元数据失败:', error)
    }
  }

  /**
   * 导出为 JSON 格式
   */
  private static exportAsJSON(conversations: Conversation[], includeMetadata: boolean): string {
    const data: {
      conversations: Conversation[]
      metadata?: {
        exportDate: string
        totalConversations: number
        totalMessages: number
        version: string
      }
    } = { conversations }

    if (includeMetadata) {
      data.metadata = {
        exportDate: new Date().toISOString(),
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      }
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * 导出为 Markdown 格式
   */
  private static exportAsMarkdown(conversations: Conversation[], includeMetadata: boolean): string {
    let markdown = '# 对话历史导出\n\n'

    if (includeMetadata) {
      markdown += `**导出时间**: ${new Date().toLocaleString()}\n`
      markdown += `**对话数量**: ${conversations.length}\n`
      markdown += `**消息总数**: ${conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}\n\n`
      markdown += '---\n\n'
    }

    conversations.forEach((conversation, index) => {
      markdown += `## ${index + 1}. ${conversation.title}\n\n`
      markdown += `**创建时间**: ${new Date(conversation.createdAt).toLocaleString()}\n`
      markdown += `**最后更新**: ${new Date(conversation.lastUpdated).toLocaleString()}\n`
      markdown += `**消息数量**: ${conversation.messages.length}\n\n`

      conversation.messages.forEach((message) => {
        const role = message.role === 'user' ? '👤 用户' : '🤖 AI助手'
        markdown += `### ${role}\n\n`
        markdown += `${message.content}\n\n`
      })

      markdown += '---\n\n'
    })

    return markdown
  }

  /**
   * 导出为纯文本格式
   */
  private static exportAsText(conversations: Conversation[], includeMetadata: boolean): string {
    let text = '对话历史导出\n' + '='.repeat(50) + '\n\n'

    if (includeMetadata) {
      text += `导出时间: ${new Date().toLocaleString()}\n`
      text += `对话数量: ${conversations.length}\n`
      text += `消息总数: ${conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}\n\n`
      text += '-'.repeat(50) + '\n\n'
    }

    conversations.forEach((conversation, index) => {
      text += `${index + 1}. ${conversation.title}\n`
      text += `创建时间: ${new Date(conversation.createdAt).toLocaleString()}\n`
      text += `最后更新: ${new Date(conversation.lastUpdated).toLocaleString()}\n`
      text += `消息数量: ${conversation.messages.length}\n\n`

      conversation.messages.forEach((message) => {
        const role = message.role === 'user' ? '[用户]' : '[AI助手]'
        text += `${role}: ${message.content}\n\n`
      })

      text += '-'.repeat(50) + '\n\n'
    })

    return text
  }
}
