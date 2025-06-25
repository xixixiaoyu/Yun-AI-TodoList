/**
 * 存储服务统一导出
 */

export { TodoStorageService } from './TodoStorageService'
export { LocalStorageService } from './LocalStorageService'
export { RemoteStorageService } from './RemoteStorageService'

export type {
  StorageOperationResult,
  BatchOperationResult,
  StorageStatus,
} from './TodoStorageService'
