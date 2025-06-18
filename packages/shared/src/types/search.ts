/**
 * 搜索相关类型定义
 */

export interface SearchQuery {
  query: string
  limit?: number
  offset?: number
  language?: string
  safeSearch?: boolean
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  region?: string
}

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  displayUrl: string
  favicon?: string
  publishedDate?: string
  source?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
  searchTime: number
  suggestions?: string[]
  relatedQueries?: string[]
}

export interface SearchHistoryItem {
  id: string
  query: string
  results: SearchResult[]
  timestamp: string
  userId?: string
  resultCount: number
  searchTime: number
}

export interface SearchSuggestion {
  text: string
  count: number
  category?: string
}

export interface SearchStats {
  totalSearches: number
  averageResultCount: number
  averageSearchTime: number
  topQueries: Array<{
    query: string
    count: number
  }>
  searchesByDate: Array<{
    date: string
    count: number
  }>
}

export interface CreateSearchDto {
  query: string
  limit?: number
  language?: string
  safeSearch?: boolean
}

export interface SearchConfigDto {
  enableRealTimeSearch: boolean
  searchProvider: 'google' | 'bing' | 'duckduckgo'
  maxResults: number
  language: string
  safeSearch: boolean
  cacheResults: boolean
  cacheDuration: number // 缓存时长（分钟）
}
