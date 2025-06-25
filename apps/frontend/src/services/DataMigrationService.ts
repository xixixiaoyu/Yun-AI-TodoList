/**
 * 数据迁移服务
 * 处理本地存储和远程存储之间的数据迁移
 */

import type { Todo, DataMigrationOptions } from '@shared/types'
import { LocalStorageService } from './storage/LocalStorageService'
import { RemoteStorageService } from './storage/RemoteStorageService'

export interface MigrationProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  currentOperation: string
  errors: Array<{ id: string; error: string }>
}

export interface MigrationResult {
  success: boolean
  migratedCount: number
  conflictCount: number
  errorCount: number
  conflicts: Array<{
    local: Todo
    remote: Todo
    reason: string
  }>
  errors: Array<{ id: string; error: string }>
}

export interface ConflictResolution {
  todoId: string
  resolution: 'local' | 'remote' | 'merge'
  mergedData?: Partial<Todo>
}

export class DataMigrationService {
  private localService: LocalStorageService
  private remoteService: RemoteStorageService
  private progressCallback?: (progress: MigrationProgress) => void

  constructor(localService: LocalStorageService, remoteService: RemoteStorageService) {
    this.localService = localService
    this.remoteService = remoteService
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: (progress: MigrationProgress) => void): void {
    this.progressCallback = callback
  }

  /**
   * 从本地迁移到远程
   */
  async migrateLocalToRemote(_options: DataMigrationOptions = {}): Promise<MigrationResult> {
    // 选项参数暂时未使用但保留接口兼容性

    try {
      // 获取本地数据
      const localResult = await this.localService.getTodos()
      if (!localResult.success) {
        throw new Error(`获取本地数据失败: ${localResult.error}`)
      }

      const localTodos = localResult.data || []
      if (localTodos.length === 0) {
        return {
          success: true,
          migratedCount: 0,
          conflictCount: 0,
          errorCount: 0,
          conflicts: [],
          errors: [],
        }
      }

      // 获取远程数据
      const remoteResult = await this.remoteService.getTodos()
      if (!remoteResult.success) {
        throw new Error(`获取远程数据失败: ${remoteResult.error}`)
      }

      const remoteTodos = remoteResult.data || []

      // 检测冲突
      const { toCreate, toUpdate, conflicts } = this.detectConflicts(localTodos, remoteTodos)

      this.updateProgress({
        total: toCreate.length + toUpdate.length,
        completed: 0,
        failed: 0,
        percentage: 0,
        currentOperation: '开始迁移数据...',
        errors: [],
      })

      const errors: Array<{ id: string; error: string }> = []
      let completed = 0

      // 创建新的 Todo
      for (const todo of toCreate) {
        try {
          this.updateProgress({
            total: toCreate.length + toUpdate.length,
            completed,
            failed: errors.length,
            percentage: Math.round((completed / (toCreate.length + toUpdate.length)) * 100),
            currentOperation: `创建: ${todo.title}`,
            errors,
          })

          const createResult = await this.remoteService.createTodo({
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            estimatedTime: todo.estimatedTime,
            dueDate: todo.dueDate,
          })

          if (!createResult.success) {
            errors.push({ id: todo.id, error: createResult.error || '创建失败' })
          } else {
            completed++
          }
        } catch (error) {
          errors.push({ id: todo.id, error: `创建失败: ${error}` })
        }
      }

      // 更新现有的 Todo
      for (const { local, remote } of toUpdate) {
        try {
          this.updateProgress({
            total: toCreate.length + toUpdate.length,
            completed,
            failed: errors.length,
            percentage: Math.round((completed / (toCreate.length + toUpdate.length)) * 100),
            currentOperation: `更新: ${local.title}`,
            errors,
          })

          const updateResult = await this.remoteService.updateTodo(remote.id, {
            title: local.title,
            description: local.description,
            completed: local.completed,
            priority: local.priority,
            estimatedTime: local.estimatedTime,
            dueDate: local.dueDate,
            order: local.order,
          })

          if (!updateResult.success) {
            errors.push({ id: local.id, error: updateResult.error || '更新失败' })
          } else {
            completed++
          }
        } catch (error) {
          errors.push({ id: local.id, error: `更新失败: ${error}` })
        }
      }

      this.updateProgress({
        total: toCreate.length + toUpdate.length,
        completed,
        failed: errors.length,
        percentage: 100,
        currentOperation: '迁移完成',
        errors,
      })

      return {
        success: errors.length === 0,
        migratedCount: completed,
        conflictCount: conflicts.length,
        errorCount: errors.length,
        conflicts,
        errors,
      }
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  /**
   * 从远程迁移到本地
   */
  async migrateRemoteToLocal(_options: DataMigrationOptions = {}): Promise<MigrationResult> {
    // 选项参数暂时未使用但保留接口兼容性

    try {
      // 获取远程数据
      const remoteResult = await this.remoteService.getTodos()
      if (!remoteResult.success) {
        throw new Error(`获取远程数据失败: ${remoteResult.error}`)
      }

      const remoteTodos = remoteResult.data || []
      if (remoteTodos.length === 0) {
        return {
          success: true,
          migratedCount: 0,
          conflictCount: 0,
          errorCount: 0,
          conflicts: [],
          errors: [],
        }
      }

      // 获取本地数据
      const localResult = await this.localService.getTodos()
      if (!localResult.success) {
        throw new Error(`获取本地数据失败: ${localResult.error}`)
      }

      const localTodos = localResult.data || []

      // 检测冲突（反向）
      const { toCreate, toUpdate, conflicts } = this.detectConflicts(remoteTodos, localTodos)

      this.updateProgress({
        total: toCreate.length + toUpdate.length,
        completed: 0,
        failed: 0,
        percentage: 0,
        currentOperation: '开始下载数据...',
        errors: [],
      })

      const errors: Array<{ id: string; error: string }> = []
      let completed = 0

      // 创建新的 Todo
      for (const todo of toCreate) {
        try {
          this.updateProgress({
            total: toCreate.length + toUpdate.length,
            completed,
            failed: errors.length,
            percentage: Math.round((completed / (toCreate.length + toUpdate.length)) * 100),
            currentOperation: `下载: ${todo.title}`,
            errors,
          })

          const createResult = await this.localService.createTodo({
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            estimatedTime: todo.estimatedTime,
            dueDate: todo.dueDate,
          })

          if (!createResult.success) {
            errors.push({ id: todo.id, error: createResult.error || '创建失败' })
          } else {
            completed++
          }
        } catch (error) {
          errors.push({ id: todo.id, error: `创建失败: ${error}` })
        }
      }

      // 更新现有的 Todo
      for (const { local: remote, remote: local } of toUpdate) {
        try {
          this.updateProgress({
            total: toCreate.length + toUpdate.length,
            completed,
            failed: errors.length,
            percentage: Math.round((completed / (toCreate.length + toUpdate.length)) * 100),
            currentOperation: `更新: ${remote.title}`,
            errors,
          })

          const updateResult = await this.localService.updateTodo(local.id, {
            title: remote.title,
            description: remote.description,
            completed: remote.completed,
            priority: remote.priority,
            estimatedTime: remote.estimatedTime,
            dueDate: remote.dueDate,
            order: remote.order,
          })

          if (!updateResult.success) {
            errors.push({ id: remote.id, error: updateResult.error || '更新失败' })
          } else {
            completed++
          }
        } catch (error) {
          errors.push({ id: remote.id, error: `更新失败: ${error}` })
        }
      }

      this.updateProgress({
        total: toCreate.length + toUpdate.length,
        completed,
        failed: errors.length,
        percentage: 100,
        currentOperation: '下载完成',
        errors,
      })

      return {
        success: errors.length === 0,
        migratedCount: completed,
        conflictCount: conflicts.length,
        errorCount: errors.length,
        conflicts,
        errors,
      }
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  /**
   * 检测数据冲突
   */
  private detectConflicts(
    sourceTodos: Todo[],
    targetTodos: Todo[]
  ): {
    toCreate: Todo[]
    toUpdate: Array<{ local: Todo; remote: Todo }>
    conflicts: Array<{ local: Todo; remote: Todo; reason: string }>
  } {
    const toCreate: Todo[] = []
    const toUpdate: Array<{ local: Todo; remote: Todo }> = []
    const conflicts: Array<{ local: Todo; remote: Todo; reason: string }> = []

    // 创建目标数据的映射（按标题匹配）
    const targetMap = new Map<string, Todo>()
    targetTodos.forEach((todo) => {
      targetMap.set(todo.title.toLowerCase(), todo)
    })

    for (const sourceTodo of sourceTodos) {
      const targetTodo = targetMap.get(sourceTodo.title.toLowerCase())

      if (!targetTodo) {
        // 目标中不存在，需要创建
        toCreate.push(sourceTodo)
      } else {
        // 目标中存在，检查是否有冲突
        const hasConflict = this.hasDataConflict(sourceTodo, targetTodo)

        if (hasConflict) {
          conflicts.push({
            local: sourceTodo,
            remote: targetTodo,
            reason: '数据内容不一致',
          })
        } else {
          // 无冲突，可以更新
          toUpdate.push({ local: sourceTodo, remote: targetTodo })
        }
      }
    }

    return { toCreate, toUpdate, conflicts }
  }

  /**
   * 检查两个 Todo 是否有数据冲突
   */
  private hasDataConflict(todo1: Todo, todo2: Todo): boolean {
    // 比较关键字段
    return (
      todo1.completed !== todo2.completed ||
      todo1.priority !== todo2.priority ||
      todo1.estimatedTime !== todo2.estimatedTime ||
      todo1.description !== todo2.description
    )
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: MigrationProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(
    conflicts: Array<{ local: Todo; remote: Todo; reason: string }>,
    resolutions: ConflictResolution[]
  ): Promise<MigrationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let resolved = 0

    for (const resolution of resolutions) {
      const conflict = conflicts.find(
        (c) => c.local.id === resolution.todoId || c.remote.id === resolution.todoId
      )
      if (!conflict) {
        errors.push({ id: resolution.todoId, error: '冲突不存在' })
        continue
      }

      try {
        switch (resolution.resolution) {
          case 'local':
            // 使用本地版本更新远程
            await this.remoteService.updateTodo(conflict.remote.id, {
              title: conflict.local.title,
              description: conflict.local.description,
              completed: conflict.local.completed,
              priority: conflict.local.priority,
              estimatedTime: conflict.local.estimatedTime,
              dueDate: conflict.local.dueDate,
              order: conflict.local.order,
            })
            break

          case 'remote':
            // 使用远程版本更新本地
            await this.localService.updateTodo(conflict.local.id, {
              title: conflict.remote.title,
              description: conflict.remote.description,
              completed: conflict.remote.completed,
              priority: conflict.remote.priority,
              estimatedTime: conflict.remote.estimatedTime,
              dueDate: conflict.remote.dueDate,
              order: conflict.remote.order,
            })
            break

          case 'merge':
            // 使用合并后的数据
            if (resolution.mergedData) {
              await this.remoteService.updateTodo(conflict.remote.id, resolution.mergedData)
              await this.localService.updateTodo(conflict.local.id, resolution.mergedData)
            }
            break
        }

        resolved++
      } catch (error) {
        errors.push({ id: resolution.todoId, error: `解决冲突失败: ${error}` })
      }
    }

    return {
      success: errors.length === 0,
      migratedCount: resolved,
      conflictCount: 0,
      errorCount: errors.length,
      conflicts: [],
      errors,
    }
  }
}
