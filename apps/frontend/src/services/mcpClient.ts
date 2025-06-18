// 注意：在浏览器环境中，我们不能直接使用 stdio 传输
// 这里我们将实现一个基于 HTTP 的替代方案
// import { Client } from '@modelcontextprotocol/sdk/client/index.js'
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

/**
 * MCP 搜索结果接口
 */
export interface MCPSearchResult {
  title: string
  link: string
  snippet: string
}

/**
 * MCP 搜索响应接口
 */
export interface MCPSearchResponse {
  searches: Array<{
    query: string
    results: MCPSearchResult[]
  }>
}

/**
 * MCP 搜索选项
 */
export interface MCPSearchOptions {
  limit?: number
  timeout?: number
  locale?: string
  debug?: boolean
  noSaveState?: boolean
}

/**
 * 浏览器兼容的 MCP 客户端服务类
 * 由于浏览器环境限制，我们使用 HTTP API 替代 stdio 传输
 */
export class MCPClientService {
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private baseUrl = '/api/mcp' // 通过后端代理访问 MCP 服务

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this._connect()
    return this.connectionPromise
  }

  private async _connect(): Promise<void> {
    try {
      // 在浏览器环境中，我们通过 HTTP API 检查连接状态
      // 由于 MCP stdio 传输无法在浏览器中使用，我们直接标记为已连接
      // 实际的搜索将通过现有的 googleSearchService 进行

      console.log('浏览器环境：使用备用搜索服务替代 MCP')
      this.isConnected = true
    } catch (error) {
      console.error('连接 MCP 服务器失败:', error)
      this.isConnected = false
      this.connectionPromise = null
      // 在浏览器环境中，我们允许继续工作
      console.warn('MCP 服务不可用，将使用备用搜索服务')
      this.isConnected = true // 允许继续工作
    }
  }

  /**
   * 断开与 MCP 服务器的连接
   */
  async disconnect(): Promise<void> {
    this.isConnected = false
    this.connectionPromise = null
    console.log('MCP 客户端已断开连接')
  }

  /**
   * 执行搜索（浏览器兼容版本）
   */
  async search(queries: string[], options: MCPSearchOptions = {}): Promise<MCPSearchResponse> {
    if (!this.isConnected) {
      await this.connect()
    }

    try {
      // 在浏览器环境中，我们使用现有的 googleSearchService
      // 动态导入以避免构建时的依赖问题
      const { googleSearchService } = await import('./searchService')

      const searchOptions = {
        limit: options.limit || 10,
        timeout: options.timeout || 10000,
        locale: options.locale || 'zh-CN',
      }

      const result = await googleSearchService.search(queries, searchOptions)

      // 转换为 MCPSearchResponse 格式
      return {
        searches: result.searches.map((search) => ({
          query: search.query,
          results: search.results.map((result) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
          })),
        })),
      } as MCPSearchResponse
    } catch (error) {
      console.error('搜索失败:', error)
      throw error
    }
  }

  /**
   * 获取连接状态
   */
  isClientConnected(): boolean {
    return this.isConnected
  }

  /**
   * 获取可用工具列表（浏览器兼容版本）
   */
  async getAvailableTools(): Promise<unknown[]> {
    if (!this.isConnected) {
      await this.connect()
    }

    // 返回模拟的工具列表
    return [
      {
        name: 'google-search',
        description: '执行 Google 搜索',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' },
            limit: { type: 'number', description: '结果数量限制' },
          },
          required: ['query'],
        },
      },
    ]
  }
}

// 创建单例实例
export const mcpClientService = new MCPClientService()

/**
 * MCP 客户端 Composable
 * 为 Vue 组件提供 MCP 客户端功能
 */
export function useMCPClient() {
  const connect = async () => {
    return await mcpClientService.connect()
  }

  const disconnect = async () => {
    return await mcpClientService.disconnect()
  }

  const search = async (queries: string[], options: MCPSearchOptions = {}) => {
    return await mcpClientService.search(queries, options)
  }

  const isConnected = () => {
    return mcpClientService.isClientConnected()
  }

  const getAvailableTools = async () => {
    return await mcpClientService.getAvailableTools()
  }

  return {
    connect,
    disconnect,
    search,
    isConnected,
    getAvailableTools,
  }
}
