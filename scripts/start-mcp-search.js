#!/usr/bin/env node

/**
 * MCP 搜索服务启动脚本
 *
 * 这个脚本启动一个简单的 HTTP 服务器，模拟 MCP 搜索服务
 * 在真实环境中，您需要配置真正的 MCP 搜索服务
 */

import http from 'http'
import url from 'url'

const PORT = 3001
const HOST = 'localhost'

// 模拟搜索结果生成器
function generateSearchResults(queries, options = {}) {
  const { limit = 10, locale: _locale = 'zh-CN' } = options

  const searches = queries.map((query) => {
    const results = []

    // 生成更真实的搜索结果
    const searchTemplates = [
      {
        title: `${query} - 百度百科`,
        link: `https://baike.baidu.com/item/${encodeURIComponent(query)}`,
        snippet: `${query}是一个重要概念，在多个领域都有广泛应用。本词条详细介绍了${query}的定义、特点、发展历程等相关内容。`,
      },
      {
        title: `${query}最新资讯 - 新浪网`,
        link: `https://news.sina.com.cn/search/${encodeURIComponent(query)}`,
        snippet: `关于${query}的最新新闻资讯，包括行业动态、市场分析、专家观点等权威信息。`,
      },
      {
        title: `${query}详细解析 - 知乎`,
        link: `https://www.zhihu.com/search?q=${encodeURIComponent(query)}`,
        snippet: `知乎用户对${query}的深度讨论和专业解答，涵盖理论分析、实践经验、案例分享等内容。`,
      },
      {
        title: `${query}官方网站`,
        link: `https://www.${query.toLowerCase().replace(/\s+/g, '')}.com`,
        snippet: `${query}官方网站，提供最权威、最及时的信息和服务，是了解${query}的首选平台。`,
      },
      {
        title: `${query}技术文档 - GitHub`,
        link: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: `GitHub上关于${query}的开源项目、技术文档和代码示例，为开发者提供实用的技术参考。`,
      },
    ]

    // 根据查询内容调整结果
    for (let i = 0; i < Math.min(limit, searchTemplates.length); i++) {
      const template = searchTemplates[i]
      results.push({
        title: template.title,
        link: template.link,
        snippet: template.snippet,
      })
    }

    // 如果需要更多结果，生成额外的结果
    for (let i = searchTemplates.length; i < limit; i++) {
      results.push({
        title: `${query}相关资源 ${i + 1} - 专业网站`,
        link: `https://resource${i}.example.com/${encodeURIComponent(query)}`,
        snippet: `关于${query}的专业资源和深度内容，提供详细的分析报告、行业洞察和实用指南。`,
      })
    }

    return {
      query,
      results: results.slice(0, limit),
    }
  })

  return { searches }
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const parsedUrl = url.parse(req.url, true)

  // 健康检查端点
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'MCP Search Service',
        timestamp: new Date().toISOString(),
      })
    )
    return
  }

  // 搜索端点
  if (req.method === 'POST' && parsedUrl.pathname === '/search') {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        const { queries, limit, timeout: _timeout, locale, debug } = requestData

        if (!queries || !Array.isArray(queries)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'queries 参数必须是数组' }))
          return
        }

        // 模拟网络延迟
        const delay = Math.random() * 1000 + 500 // 500-1500ms

        setTimeout(() => {
          const results = generateSearchResults(queries, { limit, locale })

          if (debug) {
            console.log(`[${new Date().toISOString()}] 搜索请求:`, {
              queries,
              limit,
              locale,
              resultCount: results.searches.reduce((sum, search) => sum + search.results.length, 0),
            })
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(results))
        }, delay)
      } catch (error) {
        console.error('解析请求失败:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '无效的 JSON 数据' }))
      }
    })

    return
  }

  // 404 处理
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: '端点不存在' }))
})

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log(`🔍 MCP 搜索服务已启动`)
  console.log(`📍 地址: http://${HOST}:${PORT}`)
  console.log(`🏥 健康检查: http://${HOST}:${PORT}/health`)
  console.log(`🔎 搜索端点: http://${HOST}:${PORT}/search`)
  console.log(``)
  console.log(`💡 使用说明:`)
  console.log(`   - 这是一个模拟的 MCP 搜索服务`)
  console.log(`   - 在生产环境中，请配置真实的搜索服务`)
  console.log(`   - 按 Ctrl+C 停止服务`)
  console.log(``)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log(`\n🛑 正在关闭 MCP 搜索服务...`)
  server.close(() => {
    console.log(`✅ MCP 搜索服务已关闭`)
    process.exit(0)
  })
})

// 错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`)
    console.log(`💡 请检查是否已有 MCP 搜索服务在运行`)
    console.log(`💡 或者修改 src/services/searchService.ts 中的端口配置`)
  } else {
    console.error(`❌ 服务器错误:`, error)
  }
  process.exit(1)
})
