export interface Todo {
  id: number
  text: string
  completed: boolean
  completedAt?: string
  tags: string[]
  projectId: number | null
}

export interface Project {
  id: number
  name: string
}

export interface HistoryItem {
  date: string
  todos: Todo[]
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  completionRate: number
}

export interface TodoFilter {
  type: 'all' | 'active' | 'completed'
  projectId: number | null
}

export type TodoSortField = 'createdAt' | 'completedAt' | 'text'
export type SortDirection = 'asc' | 'desc'

export interface TodoSortOptions {
  field: TodoSortField
  direction: SortDirection
}
