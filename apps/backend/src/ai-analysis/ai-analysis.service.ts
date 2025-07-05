/**
 * AI 分析服务
 * 管理 AI 分析结果的存储和检索
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import type { AIAnalysis } from '@shared/types'
import { PrismaService } from '../database/prisma.service'

export interface CreateAIAnalysisDto {
  todoId: string
  priority?: number
  estimatedTime?: string
  reasoning?: string
}

@Injectable()
export class AIAnalysisService {
  constructor(
    private prisma: PrismaService,
    private llamaIndexService: LlamaIndexService
  ) {}

  /**
   * 创建 AI 分析记录
   */
  async createAnalysis(userId: string, data: CreateAIAnalysisDto): Promise<AIAnalysis> {
    // 验证 Todo 是否存在且属于用户
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: data.todoId,
        userId,
      },
    })

    if (!todo) {
      throw new NotFoundException('Todo not found')
    }

    // 直接更新 Todo 表，包含 AI 分析结果
    const updatedTodo = await this.prisma.todo.update({
      where: { id: data.todoId },
      data: {
        priority: data.priority,
        estimatedTime: data.estimatedTime,
        aiReasoning: data.reasoning,
        aiAnalyzed: true,
        updatedAt: new Date(),
      },
    })

    // 返回 AIAnalysis 对象
    return {
      todoId: updatedTodo.id,
      userId,
      priority: updatedTodo.priority || undefined,
      estimatedTime: updatedTodo.estimatedTime || undefined,
      reasoning: updatedTodo.aiReasoning || undefined,
      analyzedAt: updatedTodo.updatedAt.toISOString(),
    }
  }

  /**
   * 获取 Todo 的最新 AI 分析
   */
  async getLatestAnalysis(userId: string, todoId: string): Promise<AIAnalysis | null> {
    // 从 Todo 表获取分析数据
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
        aiAnalyzed: true,
      },
    })

    if (!todo || !todo.aiAnalyzed) {
      return null
    }

    return {
      todoId: todo.id,
      userId,
      priority: todo.priority || undefined,
      estimatedTime: todo.estimatedTime || undefined,
      reasoning: todo.aiReasoning || undefined,
      analyzedAt: todo.updatedAt?.toISOString() || todo.createdAt.toISOString(),
    }
  }

  /**
   * 获取用户的所有 AI 分析记录
   */
  async getUserAnalyses(userId: string): Promise<AIAnalysis[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        userId,
        aiAnalyzed: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return todos.map((todo) => ({
      todoId: todo.id,
      userId,
      priority: todo.priority || undefined,
      estimatedTime: todo.estimatedTime || undefined,
      reasoning: todo.aiReasoning || undefined,
      analyzedAt: todo.updatedAt?.toISOString() || todo.createdAt.toISOString(),
    }))
  }

  /**
   * 删除 AI 分析记录
   */
  async deleteAnalysis(userId: string, todoId: string): Promise<void> {
    // 验证 Todo 是否存在且属于用户
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
        aiAnalyzed: true,
      },
    })

    if (!todo) {
      throw new NotFoundException('AI analysis not found')
    }

    // 清除 Todo 的 AI 分析数据
    await this.prisma.todo.update({
      where: { id: todoId },
      data: {
        aiAnalyzed: false,
        priority: null,
        estimatedTime: null,
        aiReasoning: null,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * 基于文档内容进行 AI 分析
   */
  async createDocumentBasedAnalysis(
    userId: string,
    todoId: string,
    documentQuery?: string
  ): Promise<AIAnalysis> {
    try {
      // 获取 Todo 信息
      const todo = await this.prisma.todo.findFirst({
        where: { id: todoId, userId },
        include: { document: true },
      })

      if (!todo) {
        throw new NotFoundException('Todo not found')
      }

      let contextualInfo = ''

      // 如果有关联文档，从文档中获取相关信息
      if (todo.documentId) {
        const query = documentQuery || `${todo.title} ${todo.description || ''}`
        try {
          const documentAnswer = await this.llamaIndexService.queryDocuments(query)
          contextualInfo = `\n\n基于相关文档的上下文信息：\n${documentAnswer}`
        } catch (error) {
          console.warn('Failed to query document for context:', error)
        }
      } else {
        // 如果没有关联文档，尝试搜索相关文档
        const searchQuery = `${todo.title} ${todo.description || ''}`
        try {
          const searchResults = await this.llamaIndexService.searchDocuments(searchQuery, 3, 0.6)
          if (searchResults.length > 0) {
            contextualInfo = `\n\n基于相关文档的参考信息：\n${searchResults
              .map((result, index) => `${index + 1}. ${result.content.substring(0, 200)}...`)
              .join('\n')}`
          }
        } catch (error) {
          console.warn('Failed to search documents for context:', error)
        }
      }

      // 构建增强的分析提示
      const enhancedPrompt = `
请分析以下待办事项，并基于提供的上下文信息给出更准确的评估：

待办事项：${todo.title}
描述：${todo.description || '无'}
${contextualInfo}

请提供：
1. 优先级评估（1-5，5为最高）
2. 时间估算
3. 详细的分析理由

请以JSON格式返回：
{
  "priority": 数字,
  "estimatedTime": "时间字符串",
  "reasoning": "分析理由"
}
`

      // 这里应该调用实际的 AI 服务（如 DeepSeek）
      // 暂时返回一个基于规则的分析结果
      const analysis = this.generateEnhancedAnalysis(todo.title, todo.description, contextualInfo)

      // 创建分析记录
      return this.createAnalysis(userId, {
        todoId,
        priority: analysis.priority,
        estimatedTime: analysis.estimatedTime,
        reasoning: analysis.reasoning,
      })
    } catch (error) {
      console.error('Failed to create document-based analysis:', error)
      throw error
    }
  }

  /**
   * 生成增强的分析结果（基于规则的实现，可以替换为实际的 AI 调用）
   */
  private generateEnhancedAnalysis(
    title: string,
    description?: string,
    contextualInfo?: string
  ): { priority: number; estimatedTime: string; reasoning: string } {
    const text = `${title} ${description || ''}`.toLowerCase()
    let priority = 3
    let estimatedTime = '1小时'
    let reasoning = '基于任务内容的标准分析'

    // 基于关键词的优先级分析
    if (text.includes('紧急') || text.includes('urgent') || text.includes('asap')) {
      priority = 5
    } else if (text.includes('重要') || text.includes('important') || text.includes('关键')) {
      priority = 4
    } else if (text.includes('可选') || text.includes('optional') || text.includes('有空')) {
      priority = 2
    }

    // 基于任务类型的时间估算
    if (text.includes('项目') || text.includes('project') || text.includes('开发')) {
      estimatedTime = '4-8小时'
    } else if (text.includes('会议') || text.includes('meeting')) {
      estimatedTime = '1-2小时'
    } else if (text.includes('学习') || text.includes('研究')) {
      estimatedTime = '2-4小时'
    }

    // 如果有上下文信息，调整分析
    if (contextualInfo && contextualInfo.trim()) {
      reasoning = `基于任务内容和相关文档的综合分析。${
        contextualInfo.includes('复杂') || contextualInfo.includes('困难')
          ? '文档显示此任务可能较为复杂，建议预留更多时间。'
          : ''
      }`

      // 根据上下文调整时间估算
      if (contextualInfo.includes('复杂') || contextualInfo.includes('详细')) {
        const currentHours = parseInt(estimatedTime.match(/\d+/)?.[0] || '1')
        estimatedTime = `${Math.min(currentHours * 1.5, 8)}小时`
      }
    }

    return { priority, estimatedTime, reasoning }
  }

  /**
   * 批量基于文档的 AI 分析
   */
  async batchDocumentBasedAnalysis(
    userId: string,
    todoIds: string[]
  ): Promise<{ todoId: string; success: boolean; analysis?: AIAnalysis; error?: string }[]> {
    const results = []

    for (const todoId of todoIds) {
      try {
        const analysis = await this.createDocumentBasedAnalysis(userId, todoId)
        results.push({ todoId, success: true, analysis })
      } catch (error) {
        results.push({
          todoId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }
}
