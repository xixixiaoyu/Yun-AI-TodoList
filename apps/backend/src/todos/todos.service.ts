import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Todo, TodoListResponse, TodoPriority, TodoStats } from '@shared/types'
import { CacheService } from '../common/cache.service'
import { UtilsService } from '../common/services/utils.service'
import { ValidationService } from '../common/validation.service'
import { PrismaService } from '../database/prisma.service'
import { BatchAnalyzeDto } from './dto/batch-analyze.dto'
import { CreateTodoDto } from './dto/create-todo.dto'
import { QueryTodosDto, TodoFilterType, TodoSortField } from './dto/query-todos.dto'
import { ReorderTodosDto } from './dto/reorder-todos.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'

// 缓存键生成器
class CacheKeyGenerator {
  static stats(userId: string): string {
    return `todo:stats:${userId}`
  }

  static list(userId: string, query: string): string {
    return `todo:list:${userId}:${query}`
  }

  static todo(userId: string, pattern: string): string {
    return `todo:${userId}:${pattern}`
  }
}

@Injectable()
export class TodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly validationService: ValidationService,
    private readonly cacheService: CacheService
  ) {}

  async create(userId: string, createTodoDto: CreateTodoDto): Promise<Todo> {
    this.validationService.validateTodoData(createTodoDto)

    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        userId,
        title: {
          equals: createTodoDto.title.trim(),
          mode: 'insensitive',
        },
        completed: false,
      },
    })

    if (existingTodo) {
      throw new ForbiddenException('该待办事项已存在')
    }

    const maxOrder = await this.prisma.todo.aggregate({
      where: { userId },
      _max: { order: true },
    })

    const todo = await this.prisma.todo.create({
      data: {
        id: this.utilsService.generateId(),
        userId,
        title: createTodoDto.title.trim(),
        description: createTodoDto.description,
        priority: createTodoDto.priority,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        estimatedTime: createTodoDto.estimatedTime,
        estimatedMinutes:
          createTodoDto.estimatedMinutes ||
          (createTodoDto.estimatedTime
            ? this.parseEstimatedTimeToMinutes(createTodoDto.estimatedTime)
            : null),
        aiAnalyzed: createTodoDto.aiAnalyzed ?? false,
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    this.cacheService.deletePattern(CacheKeyGenerator.todo(userId, '*'))
    this.cacheService.delete(CacheKeyGenerator.stats(userId))

    return this.mapPrismaTodoToTodo(todo)
  }

  async findAll(userId: string, queryDto: QueryTodosDto): Promise<TodoListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      priority,
      sortBy,
      sortOrder,
      includeStats,
      cursor,
    } = queryDto
    const skip = cursor ? 0 : (page - 1) * limit

    const where: any = {
      userId,
      deletedAt: null,
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) }
    }

    if (search) {
      const searchResults = (await this.prisma.$queryRaw`
        SELECT id FROM todos
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND (
            to_tsvector('english', title) @@ plainto_tsquery('english', ${search})
            OR to_tsvector('english', COALESCE(description, '')) @@ plainto_tsquery('english', ${search})
          )
        ORDER BY
          ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')),
                  plainto_tsquery('english', ${search})) DESC
        LIMIT 100
      `) as Array<{ id: string }>

      if (searchResults.length > 0) {
        where.id = { in: searchResults.map((r) => r.id) }
      } else {
        Object.assign(where, {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        })
      }
    }

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
          where.dueDate = { lte: new Date() }
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

    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

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

    const take = cursor ? limit + 1 : limit

    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy,
        skip: cursor ? 0 : skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          completed: true,
          completedAt: true,
          priority: true,
          order: true,
          dueDate: true,
          estimatedTime: true,
          estimatedMinutes: true,
          aiAnalyzed: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          version: true,
        },
      }),
      cursor ? Promise.resolve(0) : this.prisma.todo.count({ where }),
    ])

    let hasNextPage = false
    let nextCursor: string | undefined
    let actualTodos = todos

    if (cursor && todos.length > limit) {
      hasNextPage = true
      actualTodos = todos.slice(0, -1)
      nextCursor = actualTodos[actualTodos.length - 1]?.createdAt.toISOString()
    }

    let stats: TodoStats | undefined
    if (includeStats) {
      stats = await this.getStats(userId)
    }

    return {
      todos: actualTodos.map(this.mapPrismaTodoToTodo),
      total,
      page,
      limit,
      stats: stats || { total: 0, completed: 0, active: 0, completionRate: 0 },
      hasNextPage,
      nextCursor,
    }
  }

  async findOne(userId: string, id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    })

    if (!todo) {
      throw new NotFoundException('Todo 不存在')
    }

    return this.mapPrismaTodoToTodo(todo)
  }

  async update(userId: string, id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    const updateData: Record<string, unknown> = {
      ...updateTodoDto,
      version: existingTodo.version + 1,
      updatedAt: new Date(),
    }

    if (updateTodoDto.dueDate !== undefined) {
      updateData.dueDate = updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : null
    }

    if (updateTodoDto.completed !== undefined) {
      updateData.completed = updateTodoDto.completed

      if (updateTodoDto.completedAt !== undefined) {
        updateData.completedAt = updateTodoDto.completedAt
          ? new Date(updateTodoDto.completedAt)
          : null
      } else {
        updateData.completedAt = updateTodoDto.completed ? new Date() : null
      }
    } else if (updateTodoDto.completedAt !== undefined) {
      updateData.completedAt = updateTodoDto.completedAt
        ? new Date(updateTodoDto.completedAt)
        : null
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data: updateData,
    })

    return this.mapPrismaTodoToTodo(todo)
  }

  async remove(userId: string, id: string): Promise<void> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    await this.prisma.todo.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        version: existingTodo.version + 1,
      },
    })
  }

  async hardDelete(userId: string, id: string): Promise<void> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    await this.prisma.todo.delete({
      where: { id },
    })
  }

  async batchUpdate(
    userId: string,
    todoIds: string[],
    updateData: Partial<UpdateTodoDto>
  ): Promise<void> {
    if (updateData.title || updateData.priority) {
      this.validationService.validateTodoData(updateData)
    }

    const processedUpdateData: Record<string, unknown> = { ...updateData }

    if (updateData.dueDate !== undefined) {
      processedUpdateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null
    }

    if (updateData.estimatedTime !== undefined) {
      processedUpdateData.estimatedTime = updateData.estimatedTime
      processedUpdateData.estimatedMinutes = updateData.estimatedTime
        ? this.parseEstimatedTimeToMinutes(updateData.estimatedTime)
        : null
    }

    if (updateData.aiAnalyzed !== undefined) {
      processedUpdateData.aiAnalyzed = updateData.aiAnalyzed
    }

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.todo.count({
        where: {
          id: { in: todoIds },
          userId,
          deletedAt: null,
        },
      })

      if (count !== todoIds.length) {
        throw new NotFoundException('部分待办事项不存在或无权访问')
      }

      await tx.todo.updateMany({
        where: {
          id: { in: todoIds },
          userId,
        },
        data: {
          ...processedUpdateData,
          updatedAt: new Date(),
        },
      })
    })
  }

  async batchDelete(userId: string, todoIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const count = await tx.todo.count({
        where: {
          id: { in: todoIds },
          userId,
          deletedAt: null,
        },
      })

      if (count !== todoIds.length) {
        throw new NotFoundException('部分待办事项不存在或无权访问')
      }

      await tx.todo.updateMany({
        where: {
          id: { in: todoIds },
          userId,
        },
        data: {
          deletedAt: new Date(),
        },
      })
    })
  }

  async restore(userId: string, id: string): Promise<Todo> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: { not: null },
      },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在或未被删除')
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data: {
        deletedAt: null,
        version: existingTodo.version + 1,
      },
    })

    return this.mapPrismaTodoToTodo(todo)
  }

  async reorder(userId: string, reorderDto: ReorderTodosDto): Promise<void> {
    const { items } = reorderDto

    const todoIds = items.map((item) => item.todoId)
    const todos = await this.prisma.todo.findMany({
      where: { id: { in: todoIds }, userId },
      select: { id: true },
    })

    if (todos.length !== todoIds.length) {
      throw new ForbiddenException('部分 Todo 不存在或无权限访问')
    }

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
  ): Promise<{ success: number; failed: number; results: Array<Record<string, unknown>> }> {
    const { todoIds, forceReanalyze } = batchAnalyzeDto

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
        if (!forceReanalyze) {
          results.push({
            todoId: todo.id,
            status: 'skipped',
            reason: 'Already analyzed',
          })
          continue
        }

        const analysis = await this.performAIAnalysis(todo.title, todo.description || undefined)

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
    const cacheKey = CacheKeyGenerator.stats(userId)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        const todayStart = new Date(now.setHours(0, 0, 0, 0))
        const todayEnd = new Date(now.setHours(23, 59, 59, 999))
        const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        const stats = await this.prisma.$queryRaw<
          Array<{
            total: bigint
            completed: bigint
            active: bigint
            overdue: bigint
            due_today: bigint
            due_this_week: bigint
          }>
        >`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE completed = true) as completed,
            COUNT(*) FILTER (WHERE completed = false) as active,
            COUNT(*) FILTER (WHERE completed = false AND "dueDate" < NOW()) as overdue,
            COUNT(*) FILTER (WHERE completed = false AND "dueDate" >= ${todayStart} AND "dueDate" <= ${todayEnd}) as due_today,
            COUNT(*) FILTER (WHERE completed = false AND "dueDate" >= NOW() AND "dueDate" <= ${weekEnd}) as due_this_week
          FROM todos
          WHERE "userId" = ${userId} AND "deletedAt" IS NULL
        `

        const result = stats[0]
        const total = Number(result.total)
        const completed = Number(result.completed)
        const active = Number(result.active)
        const completionRate = total > 0 ? Math.round((completed / total) * 100) / 100 : 0

        return {
          total,
          completed,
          active,
          completionRate,
          overdue: Number(result.overdue),
          dueToday: Number(result.due_today),
          dueThisWeek: Number(result.due_this_week),
        }
      },
      2 * 60 * 1000
    )
  }

  private async performAIAnalysis(title: string, description?: string): Promise<Partial<Todo>> {
    const text = `${title} ${description || ''}`.toLowerCase()

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

    return {
      priority: priority as TodoPriority,
    }
  }

  /**
   * 解析时间估算字符串为分钟数
   */
  private parseEstimatedTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0

    const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*[小时|hour|h]/i)
    const minuteMatch = timeStr.match(/(\d+)\s*[分钟|minute|min|m]/i)
    const dayMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*[天|day|d]/i)

    if (dayMatch) return parseFloat(dayMatch[1]) * 8 * 60 // 假设一天工作8小时
    if (hourMatch) return parseFloat(hourMatch[1]) * 60
    if (minuteMatch) return parseInt(minuteMatch[1])

    return 0
  }

  private mapPrismaTodoToTodo(prismaTodo: {
    id: string
    title: string
    description: string | null
    completed: boolean
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    order: number
    priority: number | null
    userId: string
    dueDate: Date | null
    estimatedTime?: string | null
    estimatedMinutes?: number | null
    aiAnalyzed?: boolean
  }): Todo {
    return {
      id: prismaTodo.id,
      title: prismaTodo.title,
      description: prismaTodo.description ?? undefined,
      completed: prismaTodo.completed,
      completedAt: prismaTodo.completedAt?.toISOString(),
      createdAt: prismaTodo.createdAt.toISOString(),
      updatedAt: prismaTodo.updatedAt.toISOString(),
      order: prismaTodo.order,
      priority: (prismaTodo.priority as TodoPriority) ?? undefined,
      userId: prismaTodo.userId,
      dueDate: prismaTodo.dueDate?.toISOString(),
      estimatedTime:
        prismaTodo.estimatedTime && prismaTodo.estimatedMinutes
          ? {
              text: prismaTodo.estimatedTime,
              minutes: prismaTodo.estimatedMinutes,
            }
          : undefined,
      aiAnalyzed: prismaTodo.aiAnalyzed ?? false,
    }
  }
}
