/**
 * Cloudflare Workers with Assets
 * 使用新的 Workers Assets API 处理静态资源和 SPA 路由
 * 优化版本 - 增强性能、安全性和错误处理
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)
      const pathname = url.pathname

      // 安全检查 - 防止路径遍历攻击
      if (pathname.includes('..') || pathname.includes('//')) {
        return new Response('Bad Request', { status: 400 })
      }

      // 健康检查端点
      if (pathname === '/health' || pathname === '/_health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: env.ENVIRONMENT || 'unknown',
            version: env.APP_VERSION || '1.0.0',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // API 代理（如果需要）
      if (pathname.startsWith('/api/')) {
        return handleApiProxy(request, env)
      }

      // 静态资源检测（更精确的判断）
      const isStaticAsset =
        /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|txt|xml|json)$/i.test(
          pathname
        ) ||
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/static/') ||
        pathname.startsWith('/_nuxt/') ||
        pathname.startsWith('/_vite/')

      // 尝试获取静态资源
      const response = await env.ASSETS.fetch(request)

      if (response && response.status < 400) {
        return addSecurityHeaders(response, isStaticAsset)
      }

      // SPA 路由处理 - 对于非静态资源请求，返回 index.html
      if (!isStaticAsset) {
        const indexRequest = new Request(new URL('/index.html', request.url), {
          method: 'GET',
          headers: request.headers,
        })
        const indexResponse = await env.ASSETS.fetch(indexRequest)

        if (indexResponse && indexResponse.status < 400) {
          return addSecurityHeaders(indexResponse, false)
        }
      }

      // 404 处理
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error) {
      console.error('Worker Error:', error)
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      })
    }
  },
}

/**
 * 处理 API 代理（如果需要）
 */
async function handleApiProxy(request, env) {
  // 如果配置了后端 API URL，可以在这里进行代理
  const apiBaseUrl = env.API_BASE_URL

  if (!apiBaseUrl) {
    return new Response('API not configured', { status: 503 })
  }

  // 这里可以添加 API 代理逻辑
  // 目前返回 404，因为这是前端应用
  return new Response('API endpoint not found', { status: 404 })
}

/**
 * 添加安全头
 */
function addSecurityHeaders(response, isStaticAsset = false) {
  const newResponse = new Response(response.body, response)

  // 基础安全头
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('X-Frame-Options', 'DENY')
  newResponse.headers.set('X-XSS-Protection', '1; mode=block')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CSP 头（针对 HTML 页面）
  if (!isStaticAsset && response.headers.get('content-type')?.includes('text/html')) {
    newResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-ancestors 'none';"
    )
  }

  // 缓存控制
  if (isStaticAsset) {
    // 静态资源长期缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    // HTML 文件短期缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=300, must-revalidate')
  }

  // CORS 头（如果需要）
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return newResponse
}
