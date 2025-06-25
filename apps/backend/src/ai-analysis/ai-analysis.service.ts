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

    // 暂时直接更新 Todo 表，等 Prisma 客户端生成后再使用独立的 AI 分析表
    await this.prisma.todo.update({
      where: { id: data.todoId },
      data: {
        priority: data.priority,
        estimatedTime: data.estimatedTime,
        aiAnalyzed: true,
        updatedAt: new Date(),
      },
    })

    // 返回 AIAnalysis 对象
    return {
      todoId: data.todoId,
      userId,
      priority: data.priority,
      estimatedTime: data.estimatedTime,
      reasoning: data.reasoning,
      analyzedAt: new Date().toISOString(),
    }
  }

  /**
   * 获取 Todo 的最新 AI 分析
   */
  async getLatestAnalysis(userId: string, todoId: string): Promise<AIAnalysis | null> {
    // 暂时从 Todo 表获取分析数据
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
      reasoning: `AI 分析结果：优先级 ${todo.priority || 'N/A'}，预计时间 ${todo.estimatedTime || 'N/A'}`,
      analyzedAt: todo.updatedAt?.toISOString() || todo.createdAt.toISOString(),
    }
  }
}
