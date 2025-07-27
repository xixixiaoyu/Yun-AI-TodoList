#!/usr/bin/env node

/**
 * 刷新七牛云CDN缓存
 */

const https = require('https')
const crypto = require('crypto')

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

function log(level, message) {
  const color = colors[level] || colors.reset
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

// 检查环境变量
function checkEnv() {
  log('blue', '🔍 检查环境变量...')

  const requiredEnvVars = ['QINIU_ACCESS_KEY', 'QINIU_SECRET_KEY', 'QINIU_DOMAIN']
  const missingEnvVars = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar)
    }
  }

  if (missingEnvVars.length > 0) {
    log('red', `❌ 缺少环境变量: ${missingEnvVars.join(', ')}`)
    process.exit(1)
  }

  log('green', '✅ 环境变量检查通过')
}

// 生成管理凭证
function generateAccessToken(url, body) {
  const u = new URL(url)
  const path = u.pathname + u.search
  let data = path
  if (body) {
    data += '\n' + body
  }

  const hmac = crypto.createHmac('sha1', process.env.QINIU_SECRET_KEY)
  hmac.update(data)
  const digest = hmac.digest('base64')
  return `QBox ${process.env.QINIU_ACCESS_KEY}:${digest}`
}

// 刷新CDN缓存
async function refreshCDNCache() {
  const url = 'http://fusion.qiniuapi.com/v2/tune/refresh'
  const body = JSON.stringify({
    urls: [`https://${process.env.QINIU_DOMAIN}/index.html`],
    dirs: [`https://${process.env.QINIU_DOMAIN}/`],
  })

  const token = generateAccessToken(url, body)

  const options = {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('green', '✅ CDN缓存刷新成功')
          resolve(JSON.parse(data))
        } else {
          log('red', `❌ CDN缓存刷新失败: ${res.statusCode}`)
          log('red', data)
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      log('red', `❌ 请求失败: ${error.message}`)
      reject(error)
    })

    req.write(body)
    req.end()
  })
}

// 主函数
async function main() {
  try {
    checkEnv()
    log('blue', '🚀 开始刷新CDN缓存...')
    await refreshCDNCache()
    log('green', '🎉 CDN缓存刷新完成')
  } catch (error) {
    log('red', `❌ 执行失败: ${error.message}`)
    process.exit(1)
  }
}

// 执行主函数
if (require.main === module) {
  main()
}

module.exports = {
  refreshCDNCache,
}
