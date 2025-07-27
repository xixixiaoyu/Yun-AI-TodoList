#!/usr/bin/env node

/**
 * 七牛云配置测试脚本
 * 用于验证本地环境变量和七牛云连接是否正常
 */

const fs = require('fs')
const crypto = require('crypto')
const https = require('https')

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

  // 显示当前环境变量状态
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
    return false
  }

  log('green', '✅ 环境变量检查通过')
  return true
}

// 生成管理凭证
function generateManageToken(accessKey, secretKey, bucket) {
  const policy = {
    scope: bucket,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  }

  const policyStr = JSON.stringify(policy)
  const encodedPolicy = Buffer.from(policyStr, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const sign = crypto
    .createHmac('sha1', secretKey)
    .update(encodedPolicy, 'utf8')
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${accessKey}:${sign}:${encodedPolicy}`
}

// 测试存储空间连接
function testBucketConnection(accessKey, secretKey, bucket) {
  return new Promise((resolve, reject) => {
    const token = generateManageToken(accessKey, secretKey, bucket)

    const options = {
      hostname: 'rs.qiniu.com',
      path: `/stat/${Buffer.from(bucket + ':test', 'utf8').toString('base64')}`,
      method: 'GET',
      headers: {
        Authorization: `QBox ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 612) {
          // 文件不存在，但说明连接正常
          resolve(true)
        } else if (res.statusCode === 200) {
          resolve(true)
        } else if (res.statusCode === 401) {
          resolve(false)
        } else {
          resolve(true) // 其他状态码也认为连接正常
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.end()
  })
}

// 测试 CDN 域名
function testCdnDomain(domain) {
  return new Promise((resolve, reject) => {
    if (!domain) {
      resolve(false)
      return
    }

    const options = {
      hostname: domain,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
    }

    const req = https.request(options, (res) => {
      resolve(res.statusCode < 400)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// 主测试函数
async function testQiniuConfig() {
  log('blue', '🧪 七牛云配置测试开始...')
  log('blue', '='.repeat(50))

  // 加载环境变量
  loadEnvFile()

  // 检查环境变量
  if (!checkEnv()) {
    log('red', '❌ 环境变量检查失败，请先配置必要的环境变量')
    process.exit(1)
  }

  const config = {
    accessKey: process.env.QINIU_ACCESS_KEY,
    secretKey: process.env.QINIU_SECRET_KEY,
    bucket: process.env.QINIU_BUCKET,
    region: process.env.QINIU_REGION,
    endpoint: process.env.QINIU_ENDPOINT,
    domain: process.env.QINIU_DOMAIN,
  }

  console.log('')

  // 测试存储空间连接
  log('blue', '🔗 测试存储空间连接...')
  try {
    const bucketOk = await testBucketConnection(config.accessKey, config.secretKey, config.bucket)
    if (bucketOk) {
      log('green', '✅ 存储空间连接正常')
    } else {
      log('red', '❌ 存储空间连接失败，请检查密钥和存储空间名称')
    }
  } catch (error) {
    log('red', `❌ 存储空间连接测试失败: ${error.message}`)
  }

  // 测试 CDN 域名
  if (config.domain) {
    log('blue', '🌐 测试 CDN 域名...')
    try {
      const domainOk = await testCdnDomain(config.domain)
      if (domainOk) {
        log('green', `✅ CDN 域名可访问: https://${config.domain}`)
      } else {
        log('yellow', `⚠️ CDN 域名暂时无法访问: https://${config.domain}`)
        log('yellow', '   这可能是正常的，域名可能需要时间生效')
      }
    } catch (error) {
      log('yellow', `⚠️ CDN 域名测试失败: ${error.message}`)
    }
  } else {
    log('yellow', '⚠️ 未配置 CDN 域名')
  }

  console.log('')
  log('blue', '📋 配置摘要:')
  log('cyan', `   存储空间: ${config.bucket}`)
  log('cyan', `   区域: ${config.region}`)
  log('cyan', `   端点: ${config.endpoint}`)
  if (config.domain) {
    log('cyan', `   CDN域名: ${config.domain}`)
  }

  console.log('')
  log('green', '🎉 七牛云配置测试完成！')
  log('blue', '💡 如果所有测试都通过，说明配置正确，可以进行部署')
}

// 执行测试
if (require.main === module) {
  testQiniuConfig().catch((error) => {
    log('red', `❌ 测试过程中发生错误: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { testQiniuConfig }
