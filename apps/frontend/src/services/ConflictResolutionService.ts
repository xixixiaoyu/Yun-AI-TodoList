/**
 * 冲突解决服务
 * 处理数据同步过程中的各种冲突场景
 */

import type { Todo } from '@shared/types'
import { IdGenerator } from '../utils/idGenerator'

export interface ConflictInfo {
  id: string
  type: 'id_format' | 'concurrent_modification' | 'data_inconsistency' | 'merge_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  localData: Todo
  remoteData: Todo
  conflictFields: string[]
  timestamp: string
  resolution?: ConflictResolution
}

export interface ConflictResolution {
  strategy: 'use_local' | 'use_remote' | 'merge' | 'manual' | 'create_both'
  resolvedData: Todo
  reason: string
  confidence: number // 0-1, 解决方案的置信度
}

export interface ConflictResolutionOptions {
  preferLocal: boolean
  preferRecent: boolean
  autoMerge: boolean
  preserveUserChanges: boolean
  conflictThreshold: number // 冲突严重程度阈值
}

export class ConflictResolutionService {
  private defaultOptions: ConflictResolutionOptions = {
    preferLocal: false,
    preferRecent: true,
    autoMerge: true,
    preserveUserChanges: true,
    conflictThreshold: 0.7,
  }

  /**
   * 检测两个Todo之间的冲突
   */
  detectConflict(localTodo: Todo, remoteTodo: Todo): ConflictInfo | null {
    const conflictFields: string[] = []
    let conflictType: ConflictInfo['type'] = 'data_inconsistency'
    let severity: ConflictInfo['severity'] = 'low'

    // 检查ID格式冲突
    const localIdType = IdGenerator.getIdType(localTodo.id)
    const remoteIdType = IdGenerator.getIdType(remoteTodo.id)

    if (
      localIdType !== remoteIdType &&
      localTodo.title.toLowerCase().trim() === remoteTodo.title.toLowerCase().trim()
    ) {
      conflictType = 'id_format'
      severity = 'high'
      conflictFields.push('id')
    }

    // 检查并发修改冲突
    const localTime = new Date(localTodo.updatedAt).getTime()
    const remoteTime = new Date(remoteTodo.updatedAt).getTime()
    const timeDiff = Math.abs(localTime - remoteTime)

    if (timeDiff < 60000) {
      // 1分钟内的修改认为是并发的
      conflictType = 'concurrent_modification'
      severity = 'medium'
    }

    // 检查具体字段冲突
    const fieldsToCheck = [
      'title',
      'description',
      'completed',
      'priority',
      'estimatedTime',
      'dueDate',
    ]

    fieldsToCheck.forEach((field) => {
      if (localTodo[field as keyof Todo] !== remoteTodo[field as keyof Todo]) {
        conflictFields.push(field)
      }
    })

    // 如果没有实质性冲突，返回null
    if (
      conflictFields.length === 0 ||
      (conflictFields.length === 1 && conflictFields[0] === 'updatedAt')
    ) {
      return null
    }

    // 根据冲突字段数量调整严重程度
    if (conflictFields.length > 3) {
      severity = 'critical'
    } else if (conflictFields.length > 1) {
      severity = 'high'
    }

    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: conflictType,
      severity,
      localData: localTodo,
      remoteData: remoteTodo,
      conflictFields,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 自动解决冲突
   */
  resolveConflict(
    conflict: ConflictInfo,
    options?: Partial<ConflictResolutionOptions>
  ): ConflictResolution {
    const opts = { ...this.defaultOptions, ...options }
    const { localData, remoteData, type, conflictFields } = conflict

    switch (type) {
      case 'id_format':
        return this.resolveIdFormatConflict(localData, remoteData, opts)

      case 'concurrent_modification':
        return this.resolveConcurrentModification(localData, remoteData, opts)

      case 'data_inconsistency':
        return this.resolveDataInconsistency(localData, remoteData, conflictFields, opts)

      default:
        return this.resolveMergeConflict(localData, remoteData, conflictFields, opts)
    }
  }

  /**
   * 解决ID格式冲突
   */
  private resolveIdFormatConflict(
    localData: Todo,
    remoteData: Todo,
    _options: ConflictResolutionOptions
  ): ConflictResolution {
    // 优先使用UUID格式的ID
    const localIsUUID = IdGenerator.isUUID(localData.id)
    const remoteIsUUID = IdGenerator.isUUID(remoteData.id)

    if (remoteIsUUID && !localIsUUID) {
      // 使用远程的UUID，但保留本地的数据修改
      return {
        strategy: 'merge',
        resolvedData: {
          ...localData,
          id: remoteData.id, // 使用远程的UUID
          synced: true,
          lastSyncTime: new Date().toISOString(),
        },
        reason: '使用远程UUID格式ID，保留本地数据修改',
        confidence: 0.9,
      }
    } else if (localIsUUID && !remoteIsUUID) {
      // 保留本地的UUID
      return {
        strategy: 'use_local',
        resolvedData: {
          ...localData,
          synced: true,
          lastSyncTime: new Date().toISOString(),
        },
        reason: '保留本地UUID格式ID',
        confidence: 0.8,
      }
    } else {
      // 都是UUID或都不是UUID，按时间选择
      const localTime = new Date(localData.createdAt).getTime()
      const remoteTime = new Date(remoteData.createdAt).getTime()

      if (remoteTime < localTime) {
        return {
          strategy: 'use_remote',
          resolvedData: remoteData,
          reason: '使用创建时间较早的版本',
          confidence: 0.7,
        }
      } else {
        return {
          strategy: 'use_local',
          resolvedData: localData,
          reason: '使用创建时间较早的版本',
          confidence: 0.7,
        }
      }
    }
  }

  /**
   * 解决并发修改冲突
   */
  private resolveConcurrentModification(
    localData: Todo,
    remoteData: Todo,
    options: ConflictResolutionOptions
  ): ConflictResolution {
    if (options.preferRecent) {
      const localTime = new Date(localData.updatedAt).getTime()
      const remoteTime = new Date(remoteData.updatedAt).getTime()

      if (remoteTime > localTime) {
        return {
          strategy: 'use_remote',
          resolvedData: remoteData,
          reason: '使用最近修改的版本',
          confidence: 0.8,
        }
      } else {
        return {
          strategy: 'use_local',
          resolvedData: localData,
          reason: '使用最近修改的版本',
          confidence: 0.8,
        }
      }
    }

    // 智能合并策略
    return this.performIntelligentMerge(localData, remoteData, options)
  }

  /**
   * 解决数据不一致
   */
  private resolveDataInconsistency(
    localData: Todo,
    remoteData: Todo,
    conflictFields: string[],
    options: ConflictResolutionOptions
  ): ConflictResolution {
    if (options.autoMerge && conflictFields.length <= 2) {
      return this.performIntelligentMerge(localData, remoteData, options)
    }

    // 冲突太多，需要手动处理
    return {
      strategy: 'manual',
      resolvedData: localData, // 临时使用本地数据
      reason: `冲突字段过多(${conflictFields.length})，需要手动解决`,
      confidence: 0.3,
    }
  }

  /**
   * 解决合并冲突
   */
  private resolveMergeConflict(
    localData: Todo,
    remoteData: Todo,
    conflictFields: string[],
    options: ConflictResolutionOptions
  ): ConflictResolution {
    return this.performIntelligentMerge(localData, remoteData, options)
  }

  /**
   * 执行智能合并
   */
  private performIntelligentMerge(
    localData: Todo,
    remoteData: Todo,
    _options: ConflictResolutionOptions
  ): ConflictResolution {
    const merged: Todo = { ...localData }

    // 合并策略：
    // 1. 保留较新的时间戳
    // 2. 对于重要字段（title, description），优先保留非空值
    // 3. 对于状态字段（completed），优先保留true值
    // 4. 对于优先级，选择较高的值

    const localTime = new Date(localData.updatedAt).getTime()
    const remoteTime = new Date(remoteData.updatedAt).getTime()
    const useRemoteAsBase = remoteTime > localTime

    if (useRemoteAsBase) {
      Object.assign(merged, remoteData)
    }

    // 智能字段合并
    if (
      localData.title &&
      (!remoteData.title || localData.title.length > remoteData.title.length)
    ) {
      merged.title = localData.title
    }

    if (
      localData.description &&
      (!remoteData.description || localData.description.length > remoteData.description.length)
    ) {
      merged.description = localData.description
    }

    // 状态合并：已完成状态优先
    if (localData.completed || remoteData.completed) {
      merged.completed = true
      merged.completedAt = localData.completed ? localData.completedAt : remoteData.completedAt
    }

    // 优先级：选择较高的
    if (localData.priority && remoteData.priority) {
      merged.priority = Math.max(localData.priority, remoteData.priority)
    } else {
      merged.priority = localData.priority || remoteData.priority
    }

    // 更新同步信息
    merged.synced = true
    merged.lastSyncTime = new Date().toISOString()
    merged.updatedAt = new Date().toISOString()

    return {
      strategy: 'merge',
      resolvedData: merged,
      reason: '执行智能合并，保留最佳字段值',
      confidence: 0.75,
    }
  }

  /**
   * 批量解决冲突
   */
  resolveBatchConflicts(
    conflicts: ConflictInfo[],
    options?: Partial<ConflictResolutionOptions>
  ): ConflictResolution[] {
    return conflicts.map((conflict) => this.resolveConflict(conflict, options))
  }

  /**
   * 获取冲突统计信息
   */
  getConflictStats(conflicts: ConflictInfo[]) {
    const stats = {
      total: conflicts.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      avgFieldsPerConflict: 0,
    }

    let totalFields = 0

    conflicts.forEach((conflict) => {
      stats.byType[conflict.type] = (stats.byType[conflict.type] || 0) + 1
      stats.bySeverity[conflict.severity] = (stats.bySeverity[conflict.severity] || 0) + 1
      totalFields += conflict.conflictFields.length
    })

    stats.avgFieldsPerConflict = conflicts.length > 0 ? totalFields / conflicts.length : 0

    return stats
  }
}
