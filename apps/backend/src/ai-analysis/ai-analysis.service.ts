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
  constructor(private prisma: PrismaService) {}

  /**
   * 解析预估时间字符串为分钟数
   * 支持格式：'30分钟', '2小时', '1.5小时', '90分钟' 等
   */
  private parseEstimatedTime(timeStr: string): number | null {
    if (!timeStr || typeof timeStr !== 'string') {
      return null
    }

    const str = timeStr.trim().toLowerCase()

    // 匹配小时格式：1小时、1.5小时、2h等
    const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:小时|hour|h)/)
    if (hourMatch) {
      return Math.round(parseFloat(hourMatch[1]) * 60)
    }

    // 匹配分钟格式：30分钟、45min等
    const minuteMatch = str.match(/(\d+)\s*(?:分钟|minute|min|m)/)
    if (minuteMatch) {
      return parseInt(minuteMatch[1], 10)
    }

    // 如果只是数字，默认为分钟
    const numberMatch = str.match(/^(\d+)$/)
    if (numberMatch) {
      return parseInt(numberMatch[1], 10)
    }

    return null
  }

  /**
   * 将分钟数转换为可读的时间字符串
   */
  private formatEstimatedTime(minutes: number | null): string | undefined {
    if (!minutes) return undefined

    if (minutes < 60) {
      return `${minutes}分钟`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours}小时`
      } else {
        return `${hours}小时${remainingMinutes}分钟`
      }
    }
  }

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

    // 处理预估时间转换
    const estimatedTimeInMinutes = data.estimatedTime
      ? this.parseEstimatedTime(data.estimatedTime)
      : null

    // 直接更新 Todo 表，包含 AI 分析结果
    const updatedTodo = await this.prisma.todo.update({
      where: { id: data.todoId },
      data: {
        priority: data.priority,
        estimatedTime: estimatedTimeInMinutes,
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
      estimatedTime: this.formatEstimatedTime(updatedTodo.estimatedTime),
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
      estimatedTime: this.formatEstimatedTime(todo.estimatedTime),
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
      estimatedTime: this.formatEstimatedTime(todo.estimatedTime),
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
      })

      if (!todo) {
        throw new NotFoundException('Todo not found')
      }

      // 这里应该调用实际的 AI 服务（如 DeepSeek）
      // 暂时返回一个基于规则的分析结果
      const analysis = this.generateEnhancedAnalysis(todo.title, todo.description || undefined)

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
    description?: string
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
