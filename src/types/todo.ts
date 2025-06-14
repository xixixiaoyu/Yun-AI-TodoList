export interface Todo {
  id: number
  text: string
  completed: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface HistoryItem {
  id: number
  todos: Todo[]
  timestamp: string
  action: string
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
}

export interface TodoFilter {
  type: 'all' | 'active' | 'completed'
}

export type TodoSortField = 'createdAt' | 'completedAt' | 'text'
export type SortDirection = 'asc' | 'desc'

export interface TodoSortOptions {
  field: TodoSortField
  direction: SortDirection
}
