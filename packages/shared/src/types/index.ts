/**
 * 共享类型定义入口文件
 */

// Todo 相关类型
export * from './todo'

// 用户相关类型
export * from './user'

// 搜索相关类型
export * from './search'

// API 相关类型
export * from './api'

// 通用类型
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface TimestampEntity {
  createdAt: string
  updatedAt: string
}

export interface SoftDeleteEntity extends TimestampEntity {
  deletedAt?: string
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Nullable<T> = T | null

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]
