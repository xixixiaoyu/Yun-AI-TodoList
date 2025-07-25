import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { AIAnalysisResult, Todo, TodoListResponse, TodoStats } from '@shared/types'
// import { AIAnalysisService } from '../ai-analysis/ai-analysis.service'
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
    // private readonly aiAnalysisService: AIAnalysisService
  ) {}

  async create(userId: string, createTodoDto: CreateTodoDto): Promise<Todo> {
    // 验证输入数据
    this.validationService.validateTodoData(createTodoDto)

    // 检查是否存在相同标题的未完成待办事项
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        userId,
        title: {
          equals: createTodoDto.title.trim(),
          mode: 'insensitive', // 忽略大小写
        },
        completed: false, // 只检查未完成的待办事项
      },
    })

    if (existingTodo) {
      throw new ForbiddenException('该待办事项已存在')
    }

    // 获取当前用户的最大排序值
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
        estimatedTime: createTodoDto.estimatedTime
          ? this.parseEstimatedTime(createTodoDto.estimatedTime)
          : null,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    // 清除相关缓存
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
      cursor, // 添加游标支持
    } = queryDto
    const skip = cursor ? 0 : (page - 1) * limit // 使用游标时不需要 skip

    // 构建查询条件
    const where: {
      userId: string
      deletedAt: null
      createdAt?: { lt: Date }
      id?: { in: string[] }
      completed?: boolean
      priority?: { in: number[] }
      dueDate?: { lte: Date } | { gte: Date; lte: Date }
    } = {
      userId,
      deletedAt: null, // 排除软删除的待办事项
    }

    // 游标分页支持
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) }
    }

    // 搜索条件 - 优化为全文搜索
    if (search) {
      // 使用 PostgreSQL 全文搜索提升性能
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
        // 如果全文搜索没有结果，回退到模糊搜索
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }
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

    // 优先级过滤
    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

    // 排序
    const orderBy: {
      createdAt?: 'asc' | 'desc'
      completedAt?: 'asc' | 'desc'
      title?: 'asc' | 'desc'
      priority?: 'asc' | 'desc'
      dueDate?: 'asc' | 'desc'
      order?: 'asc' | 'desc'
    } = {}
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

    // 执行查询 - 优化为游标分页
    const take = cursor ? limit + 1 : limit // 游标分页时多取一个判断是否有下一页

    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy,
        skip: cursor ? 0 : skip, // 游标分页不使用 skip
        take,
        // 优化：只选择必要字段
        select: {
          id: true,
          title: true,
          description: true,
          completed: true,
          completedAt: true,
          priority: true,
          estimatedTime: true,
          aiAnalyzed: true,
          order: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          aiReasoning: true,
          version: true,
        },
      }),
      // 只在非游标分页时计算总数（游标分页通常不需要总数）
      cursor ? Promise.resolve(0) : this.prisma.todo.count({ where }),
    ])

    // 处理游标分页结果
    let hasNextPage = false
    let nextCursor: string | undefined
    let actualTodos = todos

    if (cursor && todos.length > limit) {
      hasNextPage = true
      actualTodos = todos.slice(0, -1) // 移除多取的一个
      nextCursor = actualTodos[actualTodos.length - 1]?.createdAt.toISOString()
    }

    // 获取统计信息
    let stats: TodoStats | undefined
    if (includeStats) {
      stats = await this.getStats(userId)
    }

    return {
      todos: actualTodos.map((todo: any) => this.mapPrismaTodoToTodo(todo)),
      total,
      page,
      limit,
      stats: stats || { total: 0, completed: 0, active: 0, completionRate: 0 },
      // 游标分页信息
      hasNextPage,
      nextCursor,
    }
  }

  async findOne(userId: string, id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // 排除软删除的待办事项
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
        deletedAt: null, // 排除软删除的待办事项
      },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    const updateData: any = {
      ...updateTodoDto,
      version: existingTodo.version + 1, // 版本控制
      updatedAt: new Date(),
    }

    // 处理截止日期
    if (updateTodoDto.dueDate !== undefined) {
      updateData.dueDate = updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : null
    }

    // 处理预估时间（从字符串转换为分钟数）
    if (updateTodoDto.estimatedTime !== undefined) {
      updateData.estimatedTime = updateTodoDto.estimatedTime
        ? this.parseEstimatedTime(updateTodoDto.estimatedTime)
        : null
    }

    // 处理完成状态和完成时间
    if (updateTodoDto.completed !== undefined) {
      updateData.completed = updateTodoDto.completed

      // 如果前端提供了 completedAt，使用前端的值；否则使用默认逻辑
      if (updateTodoDto.completedAt !== undefined) {
        updateData.completedAt = updateTodoDto.completedAt
          ? new Date(updateTodoDto.completedAt)
          : null
      } else {
        // 如果前端没有提供 completedAt，使用默认逻辑
        updateData.completedAt = updateTodoDto.completed ? new Date() : null
      }
    } else if (updateTodoDto.completedAt !== undefined) {
      // 如果只更新 completedAt 而不更新 completed 状态
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
        deletedAt: null, // 排除已软删除的待办事项
      },
    })

    if (!existingTodo) {
      throw new NotFoundException('Todo 不存在')
    }

    // 软删除待办事项
    await this.prisma.todo.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        version: existingTodo.version + 1,
      },
    })
  }

  // 硬删除方法（管理员使用）
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

  /**
   * 批量更新待办事项 - 性能优化版本
   */
  async batchUpdate(
    userId: string,
    todoIds: string[],
    updateData: Partial<UpdateTodoDto>
  ): Promise<void> {
    // 验证输入数据
    if (updateData.title || updateData.priority || updateData.estimatedTime) {
      this.validationService.validateTodoData(updateData)
    }

    // 处理数据类型转换
    const processedUpdateData: any = { ...updateData }

    // 处理预估时间类型转换
    if (updateData.estimatedTime !== undefined) {
      processedUpdateData.estimatedTime = updateData.estimatedTime
        ? this.parseEstimatedTime(updateData.estimatedTime)
        : null
    }

    // 处理截止日期
    if (updateData.dueDate !== undefined) {
      processedUpdateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null
    }

    // 使用事务确保数据一致性
    await this.prisma.$transaction(async (tx) => {
      // 先验证所有 todos 都属于该用户
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

      // 批量更新
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

  /**
   * 批量删除待办事项（软删除）
   */
  async batchDelete(userId: string, todoIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 验证权限
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

      // 批量软删除
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

  // 恢复软删除的待办事项
  async restore(userId: string, id: string): Promise<Todo> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        id,
        userId,
        deletedAt: { not: null }, // 只能恢复已软删除的待办事项
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

        // 执行 AI 分析
        const analysis = await this.performAIAnalysis(todo.title, todo.description || undefined, {
          enablePriorityAnalysis,
          enableTimeEstimation,
        })

        // 创建 AI 分析记录
        // await this.aiAnalysisService.createAnalysis(userId, {
        //   todoId: todo.id,
        //   priority: enablePriorityAnalysis ? analysis.priority : undefined,
        //   estimatedTime: enableTimeEstimation ? analysis.estimatedTime : undefined,
        //   reasoning: analysis.reasoning,
        // })

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
    // 使用缓存优化统计查询
    const cacheKey = CacheKeyGenerator.stats(userId)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 优化：使用单个查询获取所有统计信息
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
        COUNT(*) FILTER (WHERE completed = false AND due_date < NOW()) as overdue,
        COUNT(*) FILTER (WHERE completed = false AND due_date >= ${todayStart} AND due_date <= ${todayEnd}) as due_today,
        COUNT(*) FILTER (WHERE completed = false AND due_date >= NOW() AND due_date <= ${weekEnd}) as due_this_week
      FROM todos
      WHERE user_id = ${userId} AND deleted_at IS NULL
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
      2 * 60 * 1000 // 缓存2分钟
    )
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
    estimatedTime: number | null
    aiAnalyzed: boolean
    userId: string
    dueDate: Date | null
  }): Todo {
    return {
      id: prismaTodo.id,
      title: prismaTodo.title,
      description: prismaTodo.description,
      completed: prismaTodo.completed,
      completedAt: prismaTodo.completedAt?.toISOString(),
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
