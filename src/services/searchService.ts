import { computed, ref } from 'vue'
import { mcpClientService, type MCPSearchOptions } from './mcpClient'

// 搜索选项接口
export interface SearchOptions {
  limit?: number
  timeout?: number
  locale?: string
  debug?: boolean
  noSaveState?: boolean
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
      // 检查是否在浏览器环境中
      if (typeof window !== 'undefined') {
        console.warn('检测到浏览器环境，MCP 客户端无法在浏览器中运行，将使用模拟数据')
        this.useMockData = true
        this.isInitialized = true
        return
      }

      // 连接到 MCP 服务器
      await mcpClientService.connect()
      // MCP 搜索服务初始化成功
      this.isInitialized = true
    } catch (error) {
      console.error('初始化搜索服务失败，回退到模拟数据:', error)
      this.useMockData = true
      this.isInitialized = true
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
      let results: MultiSearchResponse

      if (this.useMockData) {
        console.warn('使用模拟搜索数据:', { queries, options })
        results = await this.getMockSearchResults(queries, options)
      } else {
        // 尝试调用真实的 MCP 服务
        results = await this.callMCPService(queries, options)
      }

      searchState.value.results = results.searches
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索失败'
      searchState.value.error = errorMessage
      console.error('搜索错误:', error)

      // 如果真实搜索失败，尝试使用模拟数据作为回退
      if (!this.useMockData) {
        console.warn('真实搜索失败，回退到模拟数据')
        try {
          const mockResults = await this.getMockSearchResults(queries, options)
          searchState.value.results = mockResults.searches
          searchState.value.error = null
          return mockResults
        } catch (mockError) {
          console.error('模拟搜索也失败了:', mockError)
        }
      }

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
    // 根据查询内容生成更相关的模拟结果
    const isNewsQuery = /新闻|消息|动态|事件|最新|最近|今天|昨天/.test(query)
    const isTechQuery = /技术|科技|AI|人工智能|编程|开发/.test(query)

    let mockResults: SearchResult[] = []

    if (isNewsQuery) {
      // 新闻类查询的模拟结果
      mockResults = [
        {
          title: '今日头条 - 最新新闻资讯',
          link: 'https://www.toutiao.com/',
          snippet: '提供最新的新闻资讯，包括国内外重要新闻、科技动态、财经资讯等热点内容。',
        },
        {
          title: '新浪新闻 - 实时新闻报道',
          link: 'https://news.sina.com.cn/',
          snippet: '新浪新闻中心，为您提供最新最快的新闻资讯，涵盖国内外重大新闻事件。',
        },
        {
          title: '腾讯新闻 - 热点新闻',
          link: 'https://news.qq.com/',
          snippet: '腾讯新闻，事实派。为您提供今日最新新闻，热点资讯，深度报道。',
        },
        {
          title: '央视新闻 - 权威新闻发布',
          link: 'https://news.cctv.com/',
          snippet: '央视新闻官方网站，提供权威、及时、准确的新闻资讯和深度报道。',
        },
        {
          title: '澎湃新闻 - 专业新闻报道',
          link: 'https://www.thepaper.cn/',
          snippet: '澎湃新闻，专注时政与思想的新闻平台，提供深度新闻报道和评论分析。',
        },
      ]
    } else if (isTechQuery) {
      // 技术类查询的模拟结果
      mockResults = [
        {
          title: `${query} - 技术文档`,
          link: `https://docs.example.com/${encodeURIComponent(query)}`,
          snippet: `${query}的官方技术文档，包含详细的API参考、使用指南和最佳实践。`,
        },
        {
          title: `${query}教程 - 开发者指南`,
          link: `https://tutorial.dev/${encodeURIComponent(query)}`,
          snippet: `从零开始学习${query}，包含基础概念、实战项目和进阶技巧的完整教程。`,
        },
        {
          title: `${query}开源项目 - GitHub`,
          link: `https://github.com/search?q=${encodeURIComponent(query)}`,
          snippet: `GitHub上关于${query}的优秀开源项目，包含源码、文档和社区讨论。`,
        },
      ]
    } else {
      // 通用查询的模拟结果
      mockResults = [
        {
          title: `${query} - 百度百科`,
          link: `https://baike.baidu.com/item/${encodeURIComponent(query)}`,
          snippet: `${query}的详细介绍，包含定义、特点、应用场景等相关内容。`,
        },
        {
          title: `${query} - 维基百科`,
          link: `https://zh.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          snippet: `${query}是一个重要的概念，在多个领域都有应用。本文详细介绍了相关内容。`,
        },
        {
          title: `${query}的最新发展 - 专业分析`,
          link: `https://analysis.example.com/${encodeURIComponent(query)}`,
          snippet: `深入分析${query}的最新发展趋势，包括技术创新、市场应用、未来前景等。`,
        },
      ]
    }

    // 根据需要生成更多结果
    const additionalResults: SearchResult[] = []
    for (let i = mockResults.length; i < limit; i++) {
      additionalResults.push({
        title: `${query}相关资源 ${i + 1} - 专业网站`,
        link: `https://resource${i}.example.com/${encodeURIComponent(query)}`,
        snippet: `关于${query}的专业资源和深度内容，提供详细的文档、最佳实践和行业洞察。`,
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
    try {
      console.warn('调用 MCP 搜索服务:', { queries, options })

      // 使用 MCP 客户端进行搜索
      const mcpOptions: MCPSearchOptions = {
        limit: options.limit || 10,
        timeout: options.timeout || 60000,
        locale: options.locale || 'zh-CN',
        debug: options.debug || false,
        noSaveState: options.noSaveState || false,
      }

      const mcpResponse = await mcpClientService.search(queries, mcpOptions)

      // 转换 MCP 响应格式为本地格式
      const result: MultiSearchResponse = {
        searches: mcpResponse.searches.map((search) => ({
          query: search.query,
          results: search.results.map((result) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
          })),
        })),
      }

      console.warn('MCP 搜索成功:', result)
      return result
    } catch (error) {
      console.error('MCP 搜索失败:', error)
      throw new Error(
        `MCP 搜索服务调用失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
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
    try {
      await mcpClientService.disconnect()
      console.warn('MCP 搜索服务已断开连接')
    } catch (error) {
      console.error('断开 MCP 连接时出错:', error)
    }
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
