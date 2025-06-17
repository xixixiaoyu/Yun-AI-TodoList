import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

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
 * MCP 客户端服务类
 * 负责与 g-search-mcp 服务器通信
 */
export class MCPClientService {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

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
      // 正在连接到 google-search-mcp 服务器...

      // 创建 stdio 传输，让它自动启动 google-search-mcp 服务器
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['google-search/dist/src/mcp-server.js'],
      })

      // 创建客户端
      this.client = new Client({
        name: 'todo-app-search-client',
        version: '1.0.0',
      })

      // 连接到服务器
      await this.client.connect(this.transport)

      // 获取服务器信息
      const _serverInfo = this.client.getServerCapabilities()
      // MCP 服务器连接成功

      this.isConnected = true
    } catch (error) {
      console.error('连接 MCP 服务器失败:', error)
      this.isConnected = false
      this.client = null
      this.transport = null
      this.connectionPromise = null
      throw error
    }
  }

  /**
   * 断开与 MCP 服务器的连接
   */
  async disconnect(): Promise<void> {
    if (this.client && this.transport) {
      try {
        await this.client.close()
      } catch (error) {
        console.error('关闭 MCP 客户端时出错:', error)
      }
    }

    this.client = null
    this.transport = null
    this.isConnected = false
    this.connectionPromise = null
  }

  /**
   * 执行搜索
   */
  async search(queries: string[], options: MCPSearchOptions = {}): Promise<MCPSearchResponse> {
    if (!this.isConnected || !this.client) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error('MCP 客户端未连接')
    }

    try {
      // 执行 MCP 搜索

      // 调用 google-search 工具
      const result = await this.client.callTool({
        name: 'google-search',
        arguments: {
          query: queries.join(' '),
          limit: options.limit || 10,
        },
      })

      // MCP 搜索结果

      // 解析结果
      if (result.content && Array.isArray(result.content)) {
        const textContent = result.content.find((item) => item.type === 'text')
        if (textContent && 'text' in textContent) {
          try {
            // google-search 返回的文本可能包含警告信息，需要提取 JSON 部分
            const text = textContent.text
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsedResult = JSON.parse(jsonMatch[0])
              // 转换为 MCPSearchResponse 格式
              return {
                searches: [
                  {
                    query: parsedResult.query,
                    results: parsedResult.results,
                  },
                ],
              } as MCPSearchResponse
            }
            throw new Error('未找到有效的 JSON 数据')
          } catch (parseError) {
            console.error('解析 MCP 搜索结果失败:', parseError)
            throw new Error('解析搜索结果失败')
          }
        }
      }

      throw new Error('无效的搜索结果格式')
    } catch (error) {
      console.error('MCP 搜索失败:', error)
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
   * 获取可用工具列表
   */
  async getAvailableTools(): Promise<unknown[]> {
    if (!this.isConnected || !this.client) {
      await this.connect()
    }

    if (!this.client) {
      throw new Error('MCP 客户端未连接')
    }

    try {
      const tools = await this.client.listTools()
      return tools.tools || []
    } catch (error) {
      console.error('获取 MCP 工具列表失败:', error)
      return []
    }
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
