#!/usr/bin/env node

/**
 * 使用七牛云 S3 兼容 API 部署前端项目
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')

// 加载环境变量文件
function loadEnvFile() {
  const envFiles = ['.env.local', '.env']

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8')
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim()
            // 强制使用文件中的值（覆盖系统环境变量）
            process.env[key] = value
          }
        }
      }
      log('green', `✅ 已加载环境变量文件: ${envFile}`)
      return
    }
  }

  log('yellow', '⚠️  未找到环境变量文件 (.env.local 或 .env)')
}

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

// 生成随机字符串
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// AWS Signature V4 签名算法
class AWSV4Signer {
  constructor(accessKey, secretKey, region, service) {
    this.accessKey = accessKey
    this.secretKey = secretKey
    this.region = region
    this.service = service
  }

  sign(method, url, headers, payload) {
    const urlObj = new URL(url)
    const host = urlObj.hostname
    const path = urlObj.pathname

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.substring(0, 8)

    headers['Host'] = host
    headers['X-Amz-Date'] = amzDate

    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map((key) => `${key.toLowerCase()}:${headers[key]}\n`)
      .join('')

    const signedHeaders = Object.keys(headers)
      .sort()
      .map((key) => key.toLowerCase())
      .join(';')

    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex')

    const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, payloadHash].join(
      '\n'
    )

    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretKey}`).update(dateStamp).digest()
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest()
    const kService = crypto.createHmac('sha256', kRegion).update(this.service).digest()
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    return `${algorithm} Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  }
}

// 获取文件 MIME 类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// 获取所有需要上传的文件
function getFileList(distDir) {
  const files = []

  function scanDir(dir, prefix = '') {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDir(fullPath, prefix + item + '/')
      } else {
        const key = prefix + item
        files.push({
          localPath: fullPath,
          key: key,
          size: stat.size,
          mimeType: getMimeType(fullPath),
        })
      }
    }
  }

  scanDir(distDir)
  return files
}

// 上传单个文件（带重试机制）
async function uploadFile(file, signer, bucket, endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFileOnce(file, signer, bucket, endpoint)
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      log('yellow', `⚠️  上传失败，第 ${attempt} 次重试: ${file.key} - ${error.message}`)
      // 等待一段时间后重试
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// 上传单个文件（单次尝试）
async function uploadFileOnce(file, signer, bucket, endpoint) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(file.localPath)
    const url = `https://${endpoint}/${bucket}/${file.key}`

    const headers = {
      'Content-Type': file.mimeType,
      'Content-Length': content.length.toString(),
    }

    // 为 HTML 文件设置缓存控制
    if (file.key.endsWith('.html')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    } else if (file.key.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      headers['Cache-Control'] = 'public, max-age=31536000' // 1年
    }

    const authorization = signer.sign('PUT', url, headers, content)
    headers['Authorization'] = authorization

    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'PUT',
      headers: headers,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true, file: file.key })
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} ${data}`))
        }
      })
    })

    req.on('error', reject)

    // 根据文件大小动态设置超时时间
    const baseTimeout = 60000 // 基础超时 60 秒
    const sizeBasedTimeout = Math.max(baseTimeout, (file.size / 1024) * 100) // 每 KB 100ms，最少 60 秒
    const maxTimeout = 300000 // 最大超时 5 分钟
    const timeout = Math.min(sizeBasedTimeout, maxTimeout)

    req.setTimeout(timeout, () => {
      req.destroy()
      reject(new Error(`Upload timeout after ${timeout / 1000}s`))
    })

    req.write(content)
    req.end()
  })
}

// 检查环境变量
function checkEnv() {
  const required = [
    'QINIU_ACCESS_KEY',
    'QINIU_SECRET_KEY',
    'QINIU_BUCKET',
    'QINIU_REGION',
    'QINIU_ENDPOINT',
  ]

  log('blue', '🔍 检查环境变量...')

  // 显示当前环境变量状态（不显示敏感信息的完整值）
  required.forEach((key) => {
    const value = process.env[key]
    if (value) {
      const maskedValue = key.includes('KEY') ? `${value.substring(0, 8)}...` : value
      log('cyan', `   ✅ ${key}: ${maskedValue}`)
    } else {
      log('red', `   ❌ ${key}: 未设置`)
    }
  })

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    log('red', `❌ 缺少环境变量: ${missing.join(', ')}`)
    log('yellow', '💡 请检查以下配置:')
    log('yellow', '   1. GitHub Secrets 是否已正确设置')
    log('yellow', '   2. 本地 .env.local 文件是否存在')
    log('yellow', '   3. 环境变量名称是否正确')
    log('yellow', '   4. GitHub Actions 工作流是否正确引用了 secrets')
    missing.forEach((key) => {
      log('yellow', `   export ${key}=your_value_here`)
    })
    process.exit(1)
  }

  log('green', '✅ 环境变量检查通过')
}

// 主部署函数
async function deployToQiniu() {
  log('blue', '🚀 开始使用七牛云 S3 API 部署...')
  log('blue', '='.repeat(60))

  // 加载环境变量文件
  loadEnvFile()

  // 检查环境变量
  checkEnv()

  // 从环境变量读取配置信息
  const config = {
    accessKey: process.env.QINIU_ACCESS_KEY,
    secretKey: process.env.QINIU_SECRET_KEY,
    bucket: process.env.QINIU_BUCKET,
    region: process.env.QINIU_REGION || 'cn-east-1',
    endpoint: process.env.QINIU_ENDPOINT || 's3-cn-east-1.qiniucs.com',
    cdnDomain: process.env.QINIU_DOMAIN || 'your-cdn-domain.com',
  }

  const distDir = './apps/frontend/dist'

  log('green', '📋 部署配置:')
  log('cyan', `   AccessKey: ${config.accessKey.substring(0, 8)}...`)
  log('cyan', `   SecretKey: ${config.secretKey.substring(0, 8)}...`)
  log('cyan', `   存储空间: ${config.bucket}`)
  log('cyan', `   区域: ${config.region}`)
  log('cyan', `   端点: ${config.endpoint}`)
  log('cyan', `   CDN域名: ${config.cdnDomain}`)
  log('cyan', `   源目录: ${distDir}`)

  // 检查构建产物
  if (!fs.existsSync(distDir)) {
    log('red', '❌ 构建产物不存在')
    log('yellow', '   请先运行: pnpm build')
    process.exit(1)
  }

  // 获取文件列表
  const files = getFileList(distDir)
  log('blue', `📁 找到 ${files.length} 个文件需要上传`)

  // 创建签名器
  const signer = new AWSV4Signer(config.accessKey, config.secretKey, config.region, 's3')

  // 上传文件
  let successCount = 0
  let failCount = 0

  log('blue', '\n📤 开始上传文件...')

  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const sizeInfo = formatFileSize(file.size)
    try {
      process.stdout.write(`\r上传进度: ${i + 1}/${files.length} - ${file.key} (${sizeInfo})`)
      await uploadFile(file, signer, config.bucket, config.endpoint)
      successCount++
    } catch (error) {
      console.log('') // 换行
      log('red', `❌ 上传失败: ${file.key} (${sizeInfo}) - ${error.message}`)
      failCount++
    }
  }

  console.log('') // 换行

  // 显示结果
  log('blue', '\n📊 部署结果:')
  log('green', `   ✅ 成功: ${successCount} 个文件`)
  if (failCount > 0) {
    log('red', `   ❌ 失败: ${failCount} 个文件`)
  }

  if (successCount > 0) {
    log('blue', '\n🎉 部署完成！')
    log('green', `🌐 访问地址: https://${config.cdnDomain}`)
    log('green', `📋 管理控制台: https://portal.qiniu.com`)
  } else {
    log('red', '\n❌ 部署失败，没有文件上传成功')
    process.exit(1)
  }
}

// 刷新 CDN 缓存
async function refreshCDNCache(signer, config) {
  log('blue', '\n🔄 正在刷新 CDN 缓存...')

  const refreshId = generateRandomString(16)
  const url = `https://${config.endpoint}/2016-09-01/refresh/urls`

  const payload = JSON.stringify({
    urls: [`https://${config.cdnDomain}/`],
    refreshId: refreshId,
  })

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload).toString(),
  }

  const authorization = signer.sign('POST', url, headers, payload)
  headers['Authorization'] = authorization

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: headers,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          log('green', '✅ CDN 缓存刷新请求已提交')
          resolve()
        } else {
          log('red', `❌ CDN 缓存刷新失败: ${res.statusCode} ${data}`)
          reject(new Error(`CDN refresh failed: ${res.statusCode} ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      log('red', `❌ CDN 缓存刷新请求错误: ${error.message}`)
      reject(error)
    })

    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('CDN refresh timeout after 30s'))
    })

    req.write(payload)
    req.end()
  })
}

// 执行部署
if (require.main === module) {
  deployToQiniu().catch((error) => {
    log('red', `❌ 部署过程中发生错误: ${error.message}`)
    process.exit(1)
  })
}
