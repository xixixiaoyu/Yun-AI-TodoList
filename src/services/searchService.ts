import { computed, ref } from 'vue'

// 搜索选项接口
export interface SearchOptions {
  limit?: number
  timeout?: number
  locale?: string
  debug?: boolean
}

// 搜索结果接口
export interface SearchResult {
  title: string
  link: string
  snippet: string
}

// 搜索响应接口
export interface SearchResponse {
  query: string
  results: SearchResult[]
}

// 多搜索响应接口
export interface MultiSearchResponse {
  searches: SearchResponse[]
}

// 搜索状态
export const searchState = ref({
  isSearching: false,
  error: null as string | null,
  results: [] as SearchResponse[],
})

/**
 * Google 搜索服务类
 * 提供 Google 搜索功能，支持模拟和真实搜索
 */
export class GoogleSearchService {
  private isInitialized = false
  private useMockData = false // 默认使用真实搜索

  /**
   * 初始化搜索服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 在实际部署时，可以配置为调用真实的 MCP 服务
      this.isInitialized = true
    } catch (error) {
      console.error('初始化搜索服务失败:', error)
      throw error
    }
  }

  /**
   * 执行 Google 搜索
   * @param queries 搜索查询数组
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async search(queries: string[], options: SearchOptions = {}): Promise<MultiSearchResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    searchState.value.isSearching = true
    searchState.value.error = null

    try {
      // 始终尝试调用真实的 MCP 服务
      const results: MultiSearchResponse = await this.callMCPService(queries, options)

      searchState.value.results = results.searches
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索失败'
      searchState.value.error = errorMessage
      console.error('搜索错误:', error)
      throw error
    } finally {
      searchState.value.isSearching = false
    }
  }

  /**
   * 获取模拟搜索结果
   */
  private async getMockSearchResults(
    queries: string[],
    options: SearchOptions
  ): Promise<MultiSearchResponse> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const limit = options.limit || 10
    const searches: SearchResponse[] = queries.map((query) => ({
      query,
      results: this.generateMockResults(query, limit),
    }))

    return { searches }
  }

  /**
   * 生成模拟搜索结果
   */
  private generateMockResults(query: string, limit: number): SearchResult[] {
    const mockResults: SearchResult[] = [
      {
        title: `${query} - 维基百科`,
        link: `https://zh.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `${query}是一个重要的概念，在多个领域都有应用。本文详细介绍了${query}的定义、特点、应用场景等相关内容。`,
      },
      {
        title: `${query}的最新发展趋势 - 技术博客`,
        link: `https://blog.example.com/${query}`,
        snippet: `深入分析${query}的最新发展趋势，包括技术创新、市场应用、未来前景等方面的详细解读。`,
      },
      {
        title: `如何学习${query} - 教程指南`,
        link: `https://tutorial.example.com/${query}`,
        snippet: `完整的${query}学习指南，从基础概念到高级应用，帮助您快速掌握${query}的核心知识和实践技能。`,
      },
      {
        title: `${query}工具推荐 - 实用资源`,
        link: `https://tools.example.com/${query}`,
        snippet: `精选${query}相关的实用工具和资源，提高工作效率，解决实际问题。包含免费和付费选项。`,
      },
      {
        title: `${query}案例分析 - 成功实践`,
        link: `https://case.example.com/${query}`,
        snippet: `真实的${query}应用案例分析，展示成功的实践经验，为您的项目提供参考和启发。`,
      },
    ]

    // 根据查询内容生成更多相关结果
    const additionalResults: SearchResult[] = []
    for (let i = 5; i < limit; i++) {
      additionalResults.push({
        title: `${query}相关资源 ${i + 1} - 专业网站`,
        link: `https://resource${i}.example.com/${query}`,
        snippet: `关于${query}的专业资源和深度内容，提供详细的技术文档、最佳实践和行业洞察。`,
      })
    }

    return [...mockResults, ...additionalResults].slice(0, limit)
  }

  /**
   * 调用真实的 MCP 服务
   */
  private async callMCPService(
    queries: string[],
    options: SearchOptions
  ): Promise<MultiSearchResponse> {
    // 这里可以实现真实的 MCP 服务调用
    // 例如通过 HTTP API 或 WebSocket 连接到运行中的 g-search-mcp 服务
    const mcpEndpoint = 'http://localhost:3001/search'

    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries,
        limit: options.limit || 10,
        timeout: options.timeout || 60000,
        locale: options.locale || 'zh-CN',
        debug: options.debug || false,
      }),
    })

    if (!response.ok) {
      throw new Error(`MCP 服务请求失败: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 设置是否使用模拟数据
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false
  }
}

// 创建全局搜索服务实例
export const googleSearchService = new GoogleSearchService()

/**
 * 搜索 Composable
 * 提供响应式的搜索功能
 */
export function useGoogleSearch() {
  /**
   * 执行搜索
   */
  const search = async (queries: string | string[], options: SearchOptions = {}) => {
    const queryArray = Array.isArray(queries) ? queries : [queries]
    return await googleSearchService.search(queryArray, options)
  }

  /**
   * 清理搜索状态
   */
  const clearResults = () => {
    searchState.value.results = []
    searchState.value.error = null
  }

  /**
   * 设置使用模拟数据
   */
  const setUseMockData = (useMock: boolean) => {
    googleSearchService.setUseMockData(useMock)
  }

  return {
    // 状态
    isSearching: computed(() => searchState.value.isSearching),
    error: computed(() => searchState.value.error),
    results: computed(() => searchState.value.results),

    // 方法
    search,
    clearResults,
    setUseMockData,
  }
}

// 在应用卸载时清理资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    googleSearchService.cleanup()
  })
}
