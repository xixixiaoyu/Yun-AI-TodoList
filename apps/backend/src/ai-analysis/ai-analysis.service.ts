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
}
