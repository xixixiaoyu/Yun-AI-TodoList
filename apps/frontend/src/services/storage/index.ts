/**
 * 存储服务统一导出
 */

export { HybridTodoStorageService } from './HybridTodoStorageService'
export { LocalStorageService } from './LocalStorageService'
export { RemoteStorageService } from './RemoteStorageService'
export { TodoStorageService } from './TodoStorageService'

export type {
  BatchOperationResult,
  StorageOperationResult,
  StorageStatus,
} from './TodoStorageService'
