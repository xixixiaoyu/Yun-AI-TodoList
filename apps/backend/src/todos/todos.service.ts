import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { AIAnalysisResult, Todo, TodoListResponse, TodoStats } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { PrismaService } from '../database/prisma.service'
import { BatchAnalyzeDto } from './dto/batch-analyze.dto'
import { CreateTodoDto } from './dto/create-todo.dto'
import { QueryTodosDto, TodoFilterType, TodoSortField } from './dto/query-todos.dto'
import { ReorderTodosDto } from './dto/reorder-todos.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'

@Injectable()
export class TodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService
  ) {}

  async create(userId: string, createTodoDto: CreateTodoDto): Promise<Todo> {
    // 获取当前用户的最大排序值
    const maxOrder = await this.prisma.todo.aggregate({
      where: { userId },
      _max: { order: true },
    })

    const todo = await this.prisma.todo.create({
      data: {
        id: this.utilsService.generateId(),
        userId,
        title: createTodoDto.title,
        description: createTodoDto.description,
        tags: JSON.stringify(createTodoDto.tags || []),
        priority: createTodoDto.priority,
        estimatedTime: createTodoDto.estimatedTime,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    return this.mapPrismaTodoToTodo(todo)
  }

  async findAll(userId: string, queryDto: QueryTodosDto): Promise<TodoListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      tags,
      priority,
      sortBy,
      sortOrder,
      includeStats,
    } = queryDto
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = { userId }

    // 搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 类型过滤
    if (type && type !== TodoFilterType.ALL) {
      switch (type) {
        case TodoFilterType.ACTIVE:
          where.completed = false
          break
        case TodoFilterType.COMPLETED:
          where.completed = true
          break
        case TodoFilterType.OVERDUE:
          where.completed = false
          where.dueDate = { lt: new Date() }
          break
        case TodoFilterType.TODAY: {
          const today = new Date()
          const startOfDay = new Date(today.setHours(0, 0, 0, 0))
          const endOfDay = new Date(today.setHours(23, 59, 59, 999))
          where.dueDate = { gte: startOfDay, lte: endOfDay }
          break
        }
        case TodoFilterType.WEEK: {
          const startOfWeek = new Date()
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(endOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          where.dueDate = { gte: startOfWeek, lte: endOfWeek }
          break
        }
      }
    }

    // 标签过滤
    if (tags && tags.length > 0) {
      where.tags = {
        contains: JSON.stringify(tags),
      }
    }

    // 优先级过滤
    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

    // 排序
    const orderBy: any = {}
    if (sortBy === TodoSortField.CREATED_AT) {
      orderBy.createdAt = sortOrder
    } else if (sortBy === TodoSortField.COMPLETED_AT) {
      orderBy.completedAt = sortOrder
    } else if (sortBy === TodoSortField.TITLE) {
      orderBy.title = sortOrder
    } else if (sortBy === TodoSortField.PRIORITY) {
      orderBy.priority = sortOrder
    } else if (sortBy === TodoSortField.DUE_DATE) {
      orderBy.dueDate = sortOrder
    } else {
      orderBy.order = sortOrder
    }

    // 执行查询
    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.todo.count({ where }),
    ])

    // 获取统计信息
    let stats: TodoStats | undefined
    if (includeStats) {
      stats = await this.getStats(userId)
    }

    return {
      todos: todos.map((todo) => this.mapPrismaTodoToTodo(todo)),
      total,
      page,
      limit,
      stats: stats!,
    }
  }

  async findOne(userId: string, id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    })

    if (!todo) {
      throw new NotFoundException('Todo 不存在')
    }

    return this.mapPrismaTodoToTodo(todo)
  }

  async update(userId: string, id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    const updateData: any = {
      ...updateTodoDto,
      updatedAt: new Date(),
    }

    // 处理标签
    if (updateTodoDto.tags !== undefined) {
      updateData.tags = JSON.stringify(updateTodoDto.tags)
    }

    // 处理截止日期
    if (updateTodoDto.dueDate !== undefined) {
      updateData.dueDate = updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : null
    }

    // 处理完成状态
    if (updateTodoDto.completed !== undefined) {
      updateData.completed = updateTodoDto.completed
      updateData.completedAt = updateTodoDto.completed ? new Date() : null
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data: updateData,
    })

    // 记录历史
    await this.createHistory(userId, id, 'updated', updateTodoDto)

    return this.mapPrismaTodoToTodo(todo)
  }

  async remove(userId: string, id: string): Promise<void> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    // 记录历史
    await this.createHistory(userId, id, 'deleted', existingTodo)

    await this.prisma.todo.delete({
      where: { id },
    })
  }

  async reorder(userId: string, reorderDto: ReorderTodosDto): Promise<void> {
    const { items } = reorderDto

    // 验证所有 Todo 都属于当前用户
    const todoIds = items.map((item) => item.todoId)
    const todos = await this.prisma.todo.findMany({
      where: { id: { in: todoIds }, userId },
      select: { id: true },
    })

    if (todos.length !== todoIds.length) {
      throw new ForbiddenException('部分 Todo 不存在或无权限访问')
    }

    // 批量更新排序
    const updatePromises = items.map((item) =>
      this.prisma.todo.update({
        where: { id: item.todoId },
        data: { order: item.newOrder },
      })
    )

    await Promise.all(updatePromises)
  }

  async batchAnalyze(
    userId: string,
    batchAnalyzeDto: BatchAnalyzeDto
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const { todoIds, enablePriorityAnalysis, enableTimeEstimation, forceReanalyze } =
      batchAnalyzeDto

    // 验证所有 Todo 都属于当前用户
    const todos = await this.prisma.todo.findMany({
      where: { id: { in: todoIds }, userId },
    })

    if (todos.length !== todoIds.length) {
      throw new ForbiddenException('部分 Todo 不存在或无权限访问')
    }

    const results = []
    let success = 0
    let failed = 0

    for (const todo of todos) {
      try {
        // 如果已经分析过且不强制重新分析，跳过
        if (todo.aiAnalyzed && !forceReanalyze) {
          results.push({
            todoId: todo.id,
            status: 'skipped',
            reason: 'Already analyzed',
          })
          continue
        }

        // 模拟 AI 分析（实际项目中这里会调用 AI 服务）
        const analysis = await this.performAIAnalysis(todo.title, todo.description || undefined, {
          enablePriorityAnalysis,
          enableTimeEstimation,
        })

        // 更新 Todo
        await this.prisma.todo.update({
          where: { id: todo.id },
          data: {
            priority: enablePriorityAnalysis ? analysis.priority : todo.priority,
            estimatedTime: enableTimeEstimation ? analysis.estimatedTime : todo.estimatedTime,
            aiAnalyzed: true,
          },
        })

        results.push({
          todoId: todo.id,
          status: 'success',
          analysis,
        })
        success++
      } catch (error) {
        results.push({
          todoId: todo.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }

    return { success, failed, results }
  }

  async getStats(userId: string): Promise<TodoStats> {
    const [total, completed, overdue, dueToday, dueThisWeek] = await Promise.all([
      this.prisma.todo.count({ where: { userId } }),
      this.prisma.todo.count({ where: { userId, completed: true } }),
      this.prisma.todo.count({
        where: {
          userId,
          completed: false,
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.todo.count({
        where: {
          userId,
          completed: false,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.todo.count({
        where: {
          userId,
          completed: false,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const active = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) / 100 : 0

    return {
      total,
      completed,
      active,
      completionRate,
      overdue,
      dueToday,
      dueThisWeek,
    }
  }

  private async performAIAnalysis(
    title: string,
    description?: string,
    _options?: any
  ): Promise<AIAnalysisResult> {
    // 模拟 AI 分析逻辑
    // 实际项目中这里会调用 DeepSeek 或其他 AI 服务

    const text = `${title} ${description || ''}`.toLowerCase()

    // 简单的优先级分析
    let priority = 3 // 默认优先级
    if (
      text.includes('紧急') ||
      text.includes('urgent') ||
      text.includes('重要') ||
      text.includes('important')
    ) {
      priority = 5
    } else if (text.includes('高') || text.includes('high')) {
      priority = 4
    } else if (text.includes('低') || text.includes('low')) {
      priority = 2
    } else if (text.includes('简单') || text.includes('easy')) {
      priority = 1
    }

    // 简单的时间估算
    let estimatedTime = '30分钟' // 默认时间
    if (
      text.includes('项目') ||
      text.includes('project') ||
      text.includes('开发') ||
      text.includes('develop')
    ) {
      estimatedTime = '2小时'
    } else if (
      text.includes('文档') ||
      text.includes('document') ||
      text.includes('写') ||
      text.includes('write')
    ) {
      estimatedTime = '1小时'
    } else if (
      text.includes('会议') ||
      text.includes('meeting') ||
      text.includes('讨论') ||
      text.includes('discuss')
    ) {
      estimatedTime = '45分钟'
    } else if (
      text.includes('学习') ||
      text.includes('learn') ||
      text.includes('研究') ||
      text.includes('research')
    ) {
      estimatedTime = '1.5小时'
    }

    return {
      priority,
      estimatedTime,
      reasoning: `基于关键词分析：优先级 ${priority}/5，预计耗时 ${estimatedTime}`,
    }
  }

  private async createHistory(
    userId: string,
    todoId: string,
    action: string,
    changes?: any
  ): Promise<void> {
    try {
      await this.prisma.todoHistory.create({
        data: {
          id: this.utilsService.generateId(),
          todoId,
          userId,
          action,
          changes: changes ? JSON.stringify(changes) : undefined,
        },
      })
    } catch (error) {
      // 历史记录失败不应该影响主要操作
      console.error('Failed to create todo history:', error)
    }
  }

  private mapPrismaTodoToTodo(prismaTodo: any): Todo {
    return {
      id: prismaTodo.id,
      title: prismaTodo.title,
      description: prismaTodo.description,
      completed: prismaTodo.completed,
      completedAt: prismaTodo.completedAt?.toISOString(),
      tags: prismaTodo.tags ? JSON.parse(prismaTodo.tags) : [],
      createdAt: prismaTodo.createdAt.toISOString(),
      updatedAt: prismaTodo.updatedAt.toISOString(),
      order: prismaTodo.order,
      priority: prismaTodo.priority,
      estimatedTime: prismaTodo.estimatedTime,
      aiAnalyzed: prismaTodo.aiAnalyzed,
      userId: prismaTodo.userId,
      dueDate: prismaTodo.dueDate?.toISOString(),
    }
  }
}
