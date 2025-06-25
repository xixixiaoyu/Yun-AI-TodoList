/**
 * 数据转换工具
 * 处理本地数据格式与服务器数据格式之间的转换
 */

import type { Todo as ServerTodo } from '@shared/types'
import type { CreateTodoDto, Todo as LocalTodo, UpdateTodoDto } from '../types/todo'

/**
 * 生成 UUID
 * @deprecated Not used anywhere, consider removing if not needed for future features.
 */
// function generateUUID(): string {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//     const r = (Math.random() * 16) | 0
//     const v = c === 'x' ? r : (r & 0x3) | 0x8
//     return v.toString(16)
//   })
// }

/**
 * 将本地 Todo 转换为服务器格式
 */
export function localToServerTodo(localTodo: LocalTodo): CreateTodoDto | UpdateTodoDto {
  const serverTodo: CreateTodoDto = {
    title: localTodo.title,
    priority: localTodo.priority,
    estimatedTime: localTodo.estimatedTime || undefined,
    dueDate: localTodo.dueDate,
    description: localTodo.description,
  }

  return serverTodo
}

/**
 * 将服务器 Todo 转换为本地格式
 */
export function serverToLocalTodo(serverTodo: ServerTodo): LocalTodo {
  const localTodo: LocalTodo = {
    id: serverTodo.id, // ID is now a string
    title: serverTodo.title,
    completed: serverTodo.completed,
    createdAt: serverTodo.createdAt,
    updatedAt: serverTodo.updatedAt,
    order: serverTodo.order || 0,
    priority: serverTodo.priority,
    estimatedTime: serverTodo.estimatedTime || undefined,
    aiAnalyzed: serverTodo.aiAnalyzed,
    completedAt: serverTodo.completedAt,
    dueDate: serverTodo.dueDate,
    description: serverTodo.description,
  }

  return localTodo
}

/**
 * 批量转换本地 Todo 列表为服务器格式
 */
export function localTodosToServer(localTodos: LocalTodo[]): CreateTodoDto[] {
  return localTodos.map(localToServerTodo)
}

/**
 * 批量转换服务器 Todo 列表为本地格式
 */
export function serverTodosToLocal(serverTodos: ServerTodo[]): LocalTodo[] {
  return serverTodos.map(serverToLocalTodo)
}

/**
 * 创建本地 Todo 的服务器更新数据
 */
export function createUpdateTodoDto(localTodo: LocalTodo): UpdateTodoDto {
  return {
    title: localTodo.title,
    completed: localTodo.completed,
    priority: localTodo.priority,
    estimatedTime: localTodo.estimatedTime,
    order: localTodo.order,
    dueDate: localTodo.dueDate,
    description: localTodo.description,
  }
}

/**
 * 数据合并策略
 */
export interface MergeStrategy {
  // 冲突解决策略
  conflictResolution: 'local' | 'server' | 'latest' | 'manual'
  // 是否保留本地未同步的数据
  preserveLocalChanges: boolean
  // 是否删除服务器上不存在的本地数据
  deleteLocalOrphans: boolean
}

/**
 * 默认合并策略
 */
export const DEFAULT_MERGE_STRATEGY: MergeStrategy = {
  conflictResolution: 'latest',
  preserveLocalChanges: true,
  deleteLocalOrphans: false,
}

/**
 * 合并本地和服务器的 Todo 数据
 */
export function mergeTodoData(
  localTodos: LocalTodo[],
  serverTodos: ServerTodo[],
  strategy: MergeStrategy = DEFAULT_MERGE_STRATEGY
): {
  merged: LocalTodo[]
  conflicts: Array<{
    local: LocalTodo
    server: ServerTodo
    reason: string
  }>
  toUpload: LocalTodo[]
  toDelete: LocalTodo[]
} {
  const merged: LocalTodo[] = []
  const conflicts: Array<{ local: LocalTodo; server: ServerTodo; reason: string }> = []
  const toUpload: LocalTodo[] = []
  const toDelete: LocalTodo[] = []

  // 将服务器数据转换为本地格式
  const convertedServerTodos = serverTodosToLocal(serverTodos)

  // 创建服务器数据的映射（使用 title 作为匹配键，因为 ID 格式不同）
  const serverTodoMap = new Map<string, LocalTodo>()
  convertedServerTodos.forEach((todo) => {
    serverTodoMap.set(todo.id, todo)
  })

  // 创建本地数据的映射
  const localTodoMap = new Map<string, LocalTodo>()
  localTodos.forEach((todo) => {
    localTodoMap.set(todo.id, todo)
  })

  // 处理本地数据
  for (const localTodo of localTodos) {
    const serverTodo = serverTodoMap.get(localTodo.id)

    if (!serverTodo) {
      // 本地独有的数据，需要上传到服务器
      toUpload.push(localTodo)
      merged.push(localTodo)
    } else {
      // 存在于两端的数据，需要合并
      const mergedTodo = resolveTodoConflict(localTodo, serverTodo, strategy)

      if (mergedTodo.conflict) {
        conflicts.push({
          local: localTodo,
          server: serverTodo,
          reason: mergedTodo.reason || 'Data conflict detected',
        })
        // 冲突时根据策略选择数据
        merged.push(mergedTodo.result)
      } else {
        merged.push(mergedTodo.result)
      }
    }
  }

  // 处理服务器独有的数据
  for (const serverTodo of convertedServerTodos) {
    if (!localTodoMap.has(serverTodo.id)) {
      // 服务器独有的数据，直接添加到本地
      merged.push(serverTodo)
    }
  }

  // 处理删除逻辑
  if (strategy.deleteLocalOrphans) {
    for (const localTodo of localTodos) {
      if (!serverTodoMap.has(localTodo.id)) {
        toDelete.push(localTodo)
      }
    }
  }

  return {
    merged,
    conflicts,
    toUpload,
    toDelete,
  }
}

/**
 * 解决单个 Todo 的冲突
 */
function resolveTodoConflict(
  localTodo: LocalTodo,
  serverTodo: LocalTodo,
  strategy: MergeStrategy
): {
  result: LocalTodo
  conflict: boolean
  reason?: string
} {
  // 检查是否有冲突
  const hasConflict =
    localTodo.completed !== serverTodo.completed ||
    localTodo.priority !== serverTodo.priority ||
    localTodo.estimatedTime !== serverTodo.estimatedTime

  if (!hasConflict) {
    // 没有冲突，合并非冲突字段
    return {
      result: {
        ...localTodo,
        createdAt: serverTodo.createdAt, // 使用服务器的创建时间
        updatedAt: serverTodo.updatedAt, // 使用服务器的更新时间
      },
      conflict: false,
    }
  }

  // 有冲突，根据策略解决
  let result: LocalTodo

  switch (strategy.conflictResolution) {
    case 'local':
      result = localTodo
      break
    case 'server':
      result = serverTodo
      break
    case 'latest': {
      // 比较更新时间
      const localTime = new Date(localTodo.updatedAt || localTodo.createdAt).getTime()
      const serverTime = new Date(serverTodo.updatedAt || serverTodo.createdAt).getTime()
      result = serverTime > localTime ? serverTodo : localTodo
      break
    }
    case 'manual':
    default:
      // 手动解决，暂时使用本地数据
      result = localTodo
      break
  }

  return {
    result,
    conflict: true,
    reason: `Conflict in todo "${localTodo.title}": different values for completion status, priority, or other fields`,
  }
}

/**
 * 生成同步摘要
 */
export function generateSyncSummary(mergeResult: ReturnType<typeof mergeTodoData>): {
  totalItems: number
  newFromServer: number
  toUpload: number
  conflicts: number
  toDelete: number
} {
  // 这里需要传入原始数据来计算，暂时返回基础统计
  return {
    totalItems: mergeResult.merged.length,
    newFromServer: 0, // 需要额外计算
    toUpload: mergeResult.toUpload.length,
    conflicts: mergeResult.conflicts.length,
    toDelete: mergeResult.toDelete.length,
  }
}
