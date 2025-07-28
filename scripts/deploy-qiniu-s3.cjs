#!/usr/bin/env node

/**
 * 使用七牛云 S3 兼容 API 部署前端项目
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')
const { refreshCDNCache } = require('./refresh-qiniu-cache.cjs')

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

  if (!process.env.CI) {
    log('yellow', '⚠️  未找到环境变量文件 (.env.local 或 .env)')
  }
}

// 检查环境变量颜色输出
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
    console.log(`[DEBUG] AWSV4Signer.sign url: ${url}, protocol: ${urlObj.protocol}`)
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
async function uploadFile(file, signer, bucket, endpoint, retries = 8) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFileOnce(file, signer, bucket, endpoint)
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      log('yellow', `⚠️  上传失败，第 ${attempt} 次重试: ${file.key} - ${error.message}`)
      // 增加重试间隔时间，特别是对于大文件
      const baseDelay = 2000 * attempt
      // 对于大文件增加更长的重试间隔时间
      let sizeBasedDelay
      if (file.size > 15 * 1024 * 1024) {
        // 大于 15MB 的文件
        // 每 MB 增加 3 秒，最多 120 秒
        sizeBasedDelay = Math.min(120000, (file.size / 1024 / 1024) * 3000)
      } else {
        // 每 MB 增加 1 秒，最多 30 秒
        sizeBasedDelay = Math.min(30000, (file.size / 1024 / 1024) * 1000)
      }
      const delay = Math.max(baseDelay, sizeBasedDelay)
      // 等待一段时间后重试
      await new Promise((resolve) => setTimeout(resolve, delay))
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

    // 为不同类型的文件设置不同的缓存控制
    if (file.key.endsWith('.html')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    } else if (file.key.match(/\.(css|js)$/)) {
      headers['Cache-Control'] = 'public, max-age=31536000' // 1年
    } else if (file.key.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
      headers['Cache-Control'] = 'public, max-age=2592000' // 1个月
    } else if (file.key.match(/\.(woff|woff2|ttf|eot)$/)) {
      headers['Cache-Control'] = 'public, max-age=31536000' // 1年
    } else {
      headers['Cache-Control'] = 'public, max-age=86400' // 1天
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

    const req = https.request(options)

    // 添加连接超时处理
    const connectionTimeout = 60000 // 60秒连接超时
    const connectionTimer = setTimeout(() => {
      req.destroy()
      reject(new Error(`Connection timeout after ${connectionTimeout / 1000}s for ${file.key}`))
    }, connectionTimeout)

    req.on('socket', (socket) => {
      socket.on('connect', () => {
        clearTimeout(connectionTimer)
        // 连接建立后设置数据传输超时
        const baseTimeout = 120000 // 基础超时 120 秒
        // 对于大文件调整超时时间计算公式
        let sizeBasedTimeout
        if (file.size > 15 * 1024 * 1024) {
          // 大于 15MB 的文件
          // 每 MB 3 秒，最少 120 秒
          sizeBasedTimeout = Math.max(baseTimeout, (file.size / (1024 * 1024)) * 3000)
        } else {
          // 每 KB 200ms，最少 120 秒
          sizeBasedTimeout = Math.max(baseTimeout, (file.size / 1024) * 200)
        }
        const maxTimeout = 900000 // 最大超时 15 分钟
        const timeout = Math.min(sizeBasedTimeout, maxTimeout)

        // 增加超时时间，特别是对于大文件
        const extendedTimeout = Math.min(maxTimeout, timeout * 2) // 增加 100% 的超时时间

        req.setTimeout(extendedTimeout, () => {
          req.destroy()
          reject(new Error(`Upload timeout after ${extendedTimeout / 1000}s for ${file.key}`))
        })
      })
    })

    req.on('error', (error) => {
      clearTimeout(connectionTimer)
      reject(new Error(`Upload error for ${file.key}: ${error.message}`))
    })

    req.on('response', (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true, file: file.key, statusCode: res.statusCode })
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode} for ${file.key}: ${data}`))
        }
      })
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

// 验证构建产物
function verifyBuildArtifacts(distDir) {
  log('blue', '🔍 验证构建产物...')

  // 检查关键文件
  const criticalFiles = ['index.html']
  for (const file of criticalFiles) {
    const filePath = path.join(distDir, file)
    if (!fs.existsSync(filePath)) {
      log('red', `❌ 关键文件缺失: ${file}`)
      process.exit(1)
    }

    // 检查文件修改时间
    const stats = fs.statSync(filePath)
    const now = new Date()
    const fileTime = new Date(stats.mtime)
    const diffMinutes = (now - fileTime) / (1000 * 60)

    // 如果文件超过1小时未更新，发出警告
    if (diffMinutes > 60) {
      log('yellow', `⚠️  文件可能不是最新的: ${file} (${Math.round(diffMinutes)} 分钟前修改)`)
    } else {
      log('green', `✅ 关键文件验证通过: ${file}`)
    }
  }

  log('green', '✅ 构建产物验证通过')
}

// 验证部署结果
async function verifyDeployment(config, testFileKey) {
  return new Promise((resolve, reject) => {
    // 构造验证 URL，确保使用正确的 CDN 域名而不是 S3 端点
    const url = `https://${config.cdnDomain}/${testFileKey}?timestamp=${Date.now()}`

    log('blue', `🔍 验证部署结果: ${url}`)

    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      rejectUnauthorized: false, // 跳过证书验证
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('green', '✅ 部署验证通过')
          resolve(true)
        } else {
          log('red', `❌ 部署验证失败，状态码: ${res.statusCode}`)
          reject(new Error(`Deployment verification failed with status ${res.statusCode}`))
        }
      })
    })

    req.on('error', (error) => {
      log('red', `❌ 部署验证请求失败: ${error.message}`)
      reject(error)
    })

    req.setTimeout(30000, () => {
      req.destroy()
      log('red', '❌ 部署验证超时')
      reject(new Error('Deployment verification timeout'))
    })

    req.end()
  })
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

  // 验证构建产物
  verifyBuildArtifacts(distDir)

  // 获取文件列表
  let files = getFileList(distDir)

  // 过滤掉需要跳过的文件
  const skipFiles = ['LXGWWenKai-Medium.ttf', 'pdf.worker.min.mjs']
  files = files.filter((file) => !skipFiles.includes(path.basename(file.key)))

  log('blue', `📁 找到 ${files.length} 个文件需要上传 (已跳过 ${skipFiles.length} 个文件)`)

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

  // 并行上传文件，控制并发数
  // 根据文件大小动态调整并发数，优先上传小文件
  const sortedFiles = [...files].sort((a, b) => a.size - b.size)
  // 对于大文件减少并发数以提高成功率
  const largeFiles = sortedFiles.filter((file) => file.size > 15 * 1024 * 1024)
  const concurrency = largeFiles.length > 5 ? 2 : largeFiles.length > 0 ? 3 : 5
  const results = []

  // 显示上传进度
  function showProgress(completed, total) {
    const percentage = Math.round((completed / total) * 100)
    process.stdout.write(`\r上传进度: ${completed}/${total} (${percentage}%)`)
  }

  // 分批处理文件上传
  for (let i = 0; i < sortedFiles.length; i += concurrency) {
    const batch = sortedFiles.slice(i, i + concurrency)
    const batchPromises = batch.map((file) => {
      return uploadFile(file, signer, config.bucket, config.endpoint)
        .then((result) => {
          successCount++
          showProgress(successCount + failCount, files.length)
          return result
        })
        .catch((error) => {
          failCount++
          showProgress(successCount + failCount, files.length)
          log('red', `❌ 上传失败: ${file.key} (${formatFileSize(file.size)}) - ${error.message}`)
          // 提供更详细的错误信息
          if (error.code) {
            log('red', `   错误代码: ${error.code}`)
          }
          if (error.statusCode) {
            log('red', `   HTTP状态码: ${error.statusCode}`)
          }
          return null
        })
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  console.log('') // 换行

  // 显示结果
  log('blue', '\n📊 部署结果:')
  log('green', `   ✅ 成功: ${successCount} 个文件`)
  if (failCount > 0) {
    log('red', `   ❌ 失败: ${failCount} 个文件`)
  }

  if (successCount > 0) {
    // 验证部署
    if (config.cdnDomain) {
      log('blue', '🔍 验证部署...')
      const verificationResult = await verifyDeployment(config, 'index.html')
      if (!verificationResult) {
        // 可选：如果验证失败，可以决定是否抛出错误
        // throw new Error('Deployment verification failed.')
      }
    }

    log('blue', '\n🎉 部署完成！')
    log('green', `🌐 访问地址: https://${config.cdnDomain}`)
    log('green', `📋 管理控制台: https://portal.qiniu.com`)
  } else {
    log('red', '\n❌ 部署失败，没有文件上传成功')
    process.exit(1)
  }
}

// 执行部署
if (require.main === module) {
  deployToQiniu()
    .then(() => {
      log('green', '✅ 部署完成，已跳过CDN缓存刷新')
    })
    .catch((error) => {
      log('red', `❌ 部署过程中发生错误: ${error.message}`)
      process.exit(1)
    })
}
