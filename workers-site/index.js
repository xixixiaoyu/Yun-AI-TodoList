/**
 * Cloudflare Workers with Assets
 * 使用新的 Workers Assets API 处理静态资源和 SPA 路由
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      // 处理 SPA 路由 - 对于非静态资源请求，返回 index.html
      if (!url.pathname.includes('.') && !url.pathname.startsWith('/assets/')) {
        // 对于 SPA 路由，重写请求到 index.html
        const indexRequest = new Request(new URL('/index.html', request.url), request)
        const response = await env.ASSETS.fetch(indexRequest)

        if (response) {
          return addSecurityHeaders(response)
        }
      }

      // 尝试获取静态资源
      const response = await env.ASSETS.fetch(request)

      if (response) {
        return addSecurityHeaders(response)
      }

      // 如果找不到资源，返回 index.html（用于 SPA 路由）
      const indexRequest = new Request(new URL('/index.html', request.url), request)
      const indexResponse = await env.ASSETS.fetch(indexRequest)

      if (indexResponse) {
        return addSecurityHeaders(indexResponse)
      }

      // 最后的回退
      return new Response('Not Found', { status: 404 })
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 })
    }
  },
}

/**
 * 添加安全头
 */
function addSecurityHeaders(response) {
  const newResponse = new Response(response.body, response)

  // 添加安全头
  newResponse.headers.set('X-Frame-Options', 'DENY')
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // 添加 CSP 头（根据应用需求调整）
  newResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:;"
  )

  return newResponse
}
