/**
 * 重复数据清理工具
 * 专门用于清理数据库中的重复Todo记录
 */

import type { Todo } from '@shared/types'
import { logger } from './logger'

export interface DuplicateCleanupResult {
  originalCount: number
  cleanedCount: number
  removedCount: number
  removedItems: Todo[]
  conflicts: Array<{
    title: string
    duplicates: Todo[]
    kept: Todo
    removed: Todo[]
  }>
}

export interface CleanupOptions {
  dryRun?: boolean // 是否只是模拟运行，不实际删除
  preferUUID?: boolean // 是否优先保留UUID格式的ID
  preferEarlier?: boolean // 是否优先保留创建时间较早的记录
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export class DuplicateDataCleaner {
  private defaultOptions: CleanupOptions = {
    dryRun: false,
    preferUUID: true,
    preferEarlier: true,
    logLevel: 'info',
  }

  /**
   * 清理重复的Todo数据
   */
  async cleanupDuplicates(
    todos: Todo[],
    options: CleanupOptions = {}
  ): Promise<DuplicateCleanupResult> {
    const opts = { ...this.defaultOptions, ...options }

    logger.info(
      'Starting duplicate cleanup',
      {
        totalTodos: todos.length,
        options: opts,
      },
      'DuplicateDataCleaner'
    )

    const result: DuplicateCleanupResult = {
      originalCount: todos.length,
      cleanedCount: 0,
      removedCount: 0,
      removedItems: [],
      conflicts: [],
    }

    // 1. 按标题分组检测重复
    const titleGroups = this.groupByTitle(todos)

    // 2. 找出重复组
    const duplicateGroups = Object.entries(titleGroups)
      .filter(([_, todos]) => todos.length > 1)
      .map(([title, todos]) => ({ title, todos }))

    if (duplicateGroups.length === 0) {
      logger.info('No duplicates found', {}, 'DuplicateDataCleaner')
      result.cleanedCount = todos.length
      return result
    }

    logger.warn(
      `Found ${duplicateGroups.length} duplicate groups`,
      {
        groups: duplicateGroups.map((g) => ({ title: g.title, count: g.todos.length })),
      },
      'DuplicateDataCleaner'
    )

    // 3. 处理每个重复组
    const cleanedTodos: Todo[] = []
    const processedIds = new Set<string>()

    for (const group of duplicateGroups) {
      const conflict = this.resolveDuplicateGroup(group.todos, opts)
      result.conflicts.push({
        title: group.title,
        duplicates: group.todos,
        kept: conflict.kept,
        removed: conflict.removed,
      })

      // 标记已处理的ID
      group.todos.forEach((todo) => processedIds.add(todo.id))

      // 添加保留的记录
      cleanedTodos.push(conflict.kept)

      // 记录移除的记录
      result.removedItems.push(...conflict.removed)
    }

    // 4. 添加非重复的记录
    todos.forEach((todo) => {
      if (!processedIds.has(todo.id)) {
        cleanedTodos.push(todo)
      }
    })

    result.cleanedCount = cleanedTodos.length
    result.removedCount = result.originalCount - result.cleanedCount

    logger.info(
      'Duplicate cleanup completed',
      {
        originalCount: result.originalCount,
        cleanedCount: result.cleanedCount,
        removedCount: result.removedCount,
        conflictsResolved: result.conflicts.length,
      },
      'DuplicateDataCleaner'
    )

    return result
  }

  /**
   * 按标题分组
   */
  private groupByTitle(todos: Todo[]): Record<string, Todo[]> {
    const groups: Record<string, Todo[]> = {}

    todos.forEach((todo) => {
      const titleKey = this.normalizeTitle(todo.title)
      if (!groups[titleKey]) {
        groups[titleKey] = []
      }
      groups[titleKey].push(todo)
    })

    return groups
  }

  /**
   * 标准化标题（用于比较）
   */
  private normalizeTitle(title: string): string {
    return title.toLowerCase().trim()
  }

  /**
   * 解决重复组冲突
   */
  private resolveDuplicateGroup(
    duplicates: Todo[],
    options: CleanupOptions
  ): { kept: Todo; removed: Todo[] } {
    if (duplicates.length <= 1) {
      return { kept: duplicates[0], removed: [] }
    }

    // 排序规则：
    // 1. 优先保留UUID格式的ID（如果启用）
    // 2. 优先保留创建时间较早的
    // 3. 优先保留更完整的数据（有描述、优先级等）
    const sorted = [...duplicates].sort((a, b) => {
      // 规则1: UUID格式优先
      if (options.preferUUID) {
        const aIsUUID = this.isUUID(a.id)
        const bIsUUID = this.isUUID(b.id)
        if (aIsUUID && !bIsUUID) return -1
        if (!aIsUUID && bIsUUID) return 1
      }

      // 规则2: 创建时间较早优先
      if (options.preferEarlier) {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        if (aTime !== bTime) return aTime - bTime
      }

      // 规则3: 数据完整性
      const aCompleteness = this.calculateCompleteness(a)
      const bCompleteness = this.calculateCompleteness(b)
      if (aCompleteness !== bCompleteness) {
        return bCompleteness - aCompleteness
      }

      // 规则4: ID字典序
      return a.id.localeCompare(b.id)
    })

    const kept = sorted[0]
    const removed = sorted.slice(1)

    logger.debug(
      'Resolved duplicate group',
      {
        title: kept.title,
        kept: { id: kept.id, createdAt: kept.createdAt },
        removed: removed.map((r) => ({ id: r.id, createdAt: r.createdAt })),
      },
      'DuplicateDataCleaner'
    )

    return { kept, removed }
  }

  /**
   * 检查是否为UUID格式
   */
  private isUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  /**
   * 计算数据完整性评分
   */
  private calculateCompleteness(todo: Todo): number {
    let score = 0

    if (todo.title && todo.title.trim()) score += 10
    if (todo.description && todo.description.trim()) score += 5
    if (todo.priority && todo.priority > 0) score += 3
    if (todo.estimatedTime) score += 2
    if (todo.dueDate) score += 2
    if (todo.aiAnalyzed) score += 1

    return score
  }

  /**
   * 生成清理报告
   */
  generateCleanupReport(result: DuplicateCleanupResult): string {
    const report = [
      '# 重复数据清理报告',
      '',
      `**清理时间**: ${new Date().toLocaleString()}`,
      `**原始记录数**: ${result.originalCount}`,
      `**清理后记录数**: ${result.cleanedCount}`,
      `**移除记录数**: ${result.removedCount}`,
      `**解决冲突数**: ${result.conflicts.length}`,
      '',
      '## 冲突解决详情',
      '',
    ]

    result.conflicts.forEach((conflict, index) => {
      report.push(`### 冲突 ${index + 1}: "${conflict.title}"`)
      report.push(
        `- **保留记录**: ${conflict.kept.id} (创建于 ${new Date(conflict.kept.createdAt).toLocaleString()})`
      )
      report.push(`- **移除记录**:`)
      conflict.removed.forEach((removed) => {
        report.push(`  - ${removed.id} (创建于 ${new Date(removed.createdAt).toLocaleString()})`)
      })
      report.push('')
    })

    if (result.removedItems.length > 0) {
      report.push('## 移除的记录详情')
      report.push('')
      result.removedItems.forEach((item, index) => {
        report.push(`${index + 1}. **ID**: ${item.id}`)
        report.push(`   **标题**: ${item.title}`)
        report.push(`   **创建时间**: ${new Date(item.createdAt).toLocaleString()}`)
        report.push('')
      })
    }

    return report.join('\n')
  }

  /**
   * 验证清理结果
   */
  validateCleanupResult(
    originalTodos: Todo[],
    cleanedTodos: Todo[]
  ): {
    isValid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // 检查是否还有重复
    const titleGroups = this.groupByTitle(cleanedTodos)
    const remainingDuplicates = Object.entries(titleGroups).filter(([_, todos]) => todos.length > 1)

    if (remainingDuplicates.length > 0) {
      issues.push(`仍存在 ${remainingDuplicates.length} 组重复数据`)
    }

    // 检查数据完整性
    const originalTitles = new Set(originalTodos.map((t) => this.normalizeTitle(t.title)))
    const cleanedTitles = new Set(cleanedTodos.map((t) => this.normalizeTitle(t.title)))

    originalTitles.forEach((title) => {
      if (!cleanedTitles.has(title)) {
        issues.push(`丢失了标题为 "${title}" 的数据`)
      }
    })

    return {
      isValid: issues.length === 0,
      issues,
    }
  }
}

// 导出单例实例
export const duplicateDataCleaner = new DuplicateDataCleaner()
