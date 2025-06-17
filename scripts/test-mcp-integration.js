#!/usr/bin/env node

/**
 * MCP 集成测试脚本
 *
 * 测试 g-search-mcp 服务器是否能正常工作
 */

// 由于这是一个简单的测试脚本，我们直接使用 MCP SDK
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

async function testMCPIntegration() {
  console.log('🧪 开始测试 MCP 集成...')

  let client = null
  let transport = null

  try {
    // 创建 stdio 传输，让它自动启动 google-search-mcp 服务器
    console.log('1. 创建 MCP 传输并启动服务器...')
    transport = new StdioClientTransport({
      command: 'node',
      args: ['google-search/dist/src/mcp-server.js'],
    })

    // 创建客户端
    console.log('2. 创建 MCP 客户端...')
    client = new Client({
      name: 'test-search-client',
      version: '1.0.0',
    })

    // 连接到服务器
    console.log('3. 连接到 MCP 服务器...')
    await client.connect(transport)
    console.log('✅ MCP 服务器连接成功')

    // 获取可用工具
    console.log('4. 获取可用工具...')
    const tools = await client.listTools()
    console.log('✅ 可用工具:', tools)

    // 测试搜索功能
    console.log('5. 测试搜索功能...')
    const searchResult = await client.callTool({
      name: 'google-search',
      arguments: {
        query: 'Vue 3',
        limit: 3,
      },
    })
    console.log('✅ 搜索结果:', JSON.stringify(searchResult, null, 2))

    console.log('🎉 MCP 集成测试成功！')
  } catch (error) {
    console.error('❌ MCP 集成测试失败:', error)
  } finally {
    // 清理资源
    if (client) {
      try {
        await client.close()
      } catch (e) {
        console.error('关闭客户端时出错:', e)
      }
    }
  }
}

// 运行测试
testMCPIntegration()
