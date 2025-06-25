/**
 * DataMigrationService 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataMigrationService } from '../../services/DataMigrationService'
import { LocalStorageService } from '../../services/storage/LocalStorageService'
import { RemoteStorageService } from '../../services/storage/RemoteStorageService'
import type { Todo } from '@shared/types'

// Mock services
vi.mock('../../services/storage/LocalStorageService')
vi.mock('../../services/storage/RemoteStorageService')

describe('DataMigrationService', () => {
  let migrationService: DataMigrationService
  let mockLocalService: vi.Mocked<LocalStorageService>
  let mockRemoteService: vi.Mocked<RemoteStorageService>

  beforeEach(() => {
    mockLocalService = new LocalStorageService() as vi.Mocked<LocalStorageService>
    mockRemoteService = new RemoteStorageService() as vi.Mocked<RemoteStorageService>
    migrationService = new DataMigrationService(mockLocalService, mockRemoteService)
  })

  describe('migrateLocalToRemote', () => {
    it('should migrate local todos to remote successfully', async () => {
      const localTodos: Todo[] = [
        {
          id: '1',
          title: 'Local Todo 1',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
        {
          id: '2',
          title: 'Local Todo 2',
          completed: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 1,
        },
      ]

      const remoteTodos: Todo[] = []

      mockLocalService.getTodos.mockResolvedValue({
        success: true,
        data: localTodos,
      })

      mockRemoteService.getTodos.mockResolvedValue({
        success: true,
        data: remoteTodos,
      })

      mockRemoteService.createTodo.mockResolvedValue({
        success: true,
        data: localTodos[0],
      })

      const result = await migrationService.migrateLocalToRemote()

      expect(result.success).toBe(true)
      expect(result.migratedCount).toBe(2)
      expect(result.conflictCount).toBe(0)
      expect(result.errorCount).toBe(0)
      expect(mockRemoteService.createTodo).toHaveBeenCalledTimes(2)
    })

    it('should handle conflicts during migration', async () => {
      const localTodos: Todo[] = [
        {
          id: '1',
          title: 'Conflicting Todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]

      const remoteTodos: Todo[] = [
        {
          id: '2',
          title: 'Conflicting Todo',
          completed: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]

      mockLocalService.getTodos.mockResolvedValue({
        success: true,
        data: localTodos,
      })

      mockRemoteService.getTodos.mockResolvedValue({
        success: true,
        data: remoteTodos,
      })

      const result = await migrationService.migrateLocalToRemote()

      expect(result.conflictCount).toBe(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].reason).toBe('数据内容不一致')
    })

    it('should handle errors during migration', async () => {
      const localTodos: Todo[] = [
        {
          id: '1',
          title: 'Todo with Error',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]

      mockLocalService.getTodos.mockResolvedValue({
        success: true,
        data: localTodos,
      })

      mockRemoteService.getTodos.mockResolvedValue({
        success: true,
        data: [],
      })

      mockRemoteService.createTodo.mockResolvedValue({
        success: false,
        error: 'Network error',
      })

      const result = await migrationService.migrateLocalToRemote()

      expect(result.success).toBe(false)
      expect(result.errorCount).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('Network error')
    })
  })

  describe('migrateRemoteToLocal', () => {
    it('should migrate remote todos to local successfully', async () => {
      const remoteTodos: Todo[] = [
        {
          id: '1',
          title: 'Remote Todo 1',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]

      const localTodos: Todo[] = []

      mockRemoteService.getTodos.mockResolvedValue({
        success: true,
        data: remoteTodos,
      })

      mockLocalService.getTodos.mockResolvedValue({
        success: true,
        data: localTodos,
      })

      mockLocalService.createTodo.mockResolvedValue({
        success: true,
        data: remoteTodos[0],
      })

      const result = await migrationService.migrateRemoteToLocal()

      expect(result.success).toBe(true)
      expect(result.migratedCount).toBe(1)
      expect(mockLocalService.createTodo).toHaveBeenCalledTimes(1)
    })
  })

  describe('resolveConflicts', () => {
    it('should resolve conflicts using local version', async () => {
      const conflicts = [
        {
          local: {
            id: '1',
            title: 'Local Version',
            completed: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            order: 0,
          },
          remote: {
            id: '2',
            title: 'Remote Version',
            completed: true,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            order: 0,
          },
          reason: 'Data conflict',
        },
      ]

      const resolutions = [
        {
          todoId: '1',
          resolution: 'local' as const,
        },
      ]

      mockRemoteService.updateTodo.mockResolvedValue({
        success: true,
        data: conflicts[0].local,
      })

      const result = await migrationService.resolveConflicts(conflicts, resolutions)

      expect(result.success).toBe(true)
      expect(result.migratedCount).toBe(1)
      expect(mockRemoteService.updateTodo).toHaveBeenCalledWith('2', {
        title: 'Local Version',
        description: undefined,
        completed: false,
        priority: undefined,
        estimatedTime: undefined,
        dueDate: undefined,
        order: 0,
      })
    })

    it('should resolve conflicts using remote version', async () => {
      const conflicts = [
        {
          local: {
            id: '1',
            title: 'Local Version',
            completed: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            order: 0,
          },
          remote: {
            id: '2',
            title: 'Remote Version',
            completed: true,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            order: 0,
          },
          reason: 'Data conflict',
        },
      ]

      const resolutions = [
        {
          todoId: '1',
          resolution: 'remote' as const,
        },
      ]

      mockLocalService.updateTodo.mockResolvedValue({
        success: true,
        data: conflicts[0].remote,
      })

      const result = await migrationService.resolveConflicts(conflicts, resolutions)

      expect(result.success).toBe(true)
      expect(result.migratedCount).toBe(1)
      expect(mockLocalService.updateTodo).toHaveBeenCalledWith('1', {
        title: 'Remote Version',
        description: undefined,
        completed: true,
        priority: undefined,
        estimatedTime: undefined,
        dueDate: undefined,
        order: 0,
      })
    })
  })
})
