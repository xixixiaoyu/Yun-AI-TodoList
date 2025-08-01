// 优化后的查询服务示例
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class OptimizedTodosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 使用全文搜索优化的查询
   */
  async searchTodosFullText(userId: string, searchQuery: string, limit = 20) {
    // 使用 PostgreSQL 全文搜索
    const todos = await this.prisma.$queryRaw`
      SELECT id, title, description, completed, priority, "createdAt"
      FROM todos
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
        AND (
          to_tsvector('english', title) @@ plainto_tsquery('english', ${searchQuery})
          OR to_tsvector('english', COALESCE(description, '')) @@ plainto_tsquery('english', ${searchQuery})
        )
      ORDER BY
        ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')),
                plainto_tsquery('english', ${searchQuery})) DESC,
        created_at DESC
      LIMIT ${limit}
    `

    return todos
  }

  /**
   * 使用游标分页优化大数据量查询
   */
  async getTodosCursorPagination(userId: string, cursor?: string, limit = 20, completed?: boolean) {
    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
    }

    if (completed !== undefined) {
      where.completed = completed
    }

    if (cursor) {
      where.createdAt = {
        lt: new Date(cursor),
      }
    }

    const todos = await this.prisma.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // 多取一个用于判断是否有下一页
    })

    const hasNextPage = todos.length > limit
    const items = hasNextPage ? todos.slice(0, -1) : todos
    const nextCursor = hasNextPage ? items[items.length - 1].createdAt.toISOString() : null

    return {
      items,
      nextCursor,
      hasNextPage,
    }
  }

  /**
   * 批量操作优化
   */
  async batchUpdateTodos(userId: string, todoIds: string[], updateData: Record<string, unknown>) {
    // 使用事务和批量更新
    return this.prisma.$transaction(async (tx) => {
      // 先验证所有 todos 都属于该用户
      const count = await tx.todo.count({
        where: {
          id: { in: todoIds },
          userId,
          deletedAt: null,
        },
      })

      if (count !== todoIds.length) {
        throw new Error('Some todos not found or not accessible')
      }

      // 批量更新
      return tx.todo.updateMany({
        where: {
          id: { in: todoIds },
          userId,
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
    })
  }

  /**
   * 统计查询优化
   */
  async getTodoStatsOptimized(userId: string) {
    // 使用单个查询获取所有统计信息
    const stats = await this.prisma.$queryRaw<
      Array<{
        total: bigint
        active: bigint
        completed: bigint
        high_priority: bigint
        overdue: bigint
      }>
    >`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = false) as active,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) FILTER (WHERE priority >= 4) as high_priority,
        COUNT(*) FILTER (WHERE due_date < NOW() AND completed = false) as overdue
      FROM todos
      WHERE user_id = ${userId} AND deleted_at IS NULL
    `

    const result = stats[0]
    return {
      total: Number(result.total),
      active: Number(result.active),
      completed: Number(result.completed),
      highPriority: Number(result.high_priority),
      overdue: Number(result.overdue),
    }
  }
}
