#!/usr/bin/env node

/**
 * 七牛云配置验证脚本
 */

const crypto = require('crypto')
const https = require('https')

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(level, message) {
  const color = colors[level] || colors.reset
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

// Base64 URL Safe 编码
function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// 生成管理凭证
function generateAccessToken(accessKey, secretKey, url, body = '') {
  const urlObj = new URL(url)
  const data = `${urlObj.pathname}${urlObj.search}\n${body}`
  const sign = base64urlEscape(crypto.createHmac('sha1', secretKey).update(data).digest('base64'))
  return `QBox ${accessKey}:${sign}`
}

// 获取存储空间列表
function getBuckets(accessKey, secretKey) {
  return new Promise((resolve, reject) => {
    const url = 'https://rs.qiniu.com/buckets'
    const token = generateAccessToken(accessKey, secretKey, url)

    const options = {
      hostname: 'rs.qiniu.com',
      port: 443,
      path: '/buckets',
      method: 'GET',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(data)
          }
        } else {
          reject(new Error(`Request failed: ${res.statusCode} ${data}`))
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.end()
  })
}

// 主函数
async function main() {
  try {
    log('blue', '🔍 开始验证七牛云配置...')

    const accessKey = process.env.QINIU_ACCESS_KEY
    const secretKey = process.env.QINIU_SECRET_KEY
    const bucket = process.env.QINIU_BUCKET

    if (!accessKey || !secretKey || !bucket) {
      log('red', '❌ 请设置环境变量: QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET')
      process.exit(1)
    }

    log('blue', `📋 配置信息:`)
    log('blue', `   AccessKey: ${accessKey.substring(0, 10)}...`)
    log('blue', `   Bucket: ${bucket}`)

    // 获取存储空间列表
    log('blue', '🔍 获取存储空间列表...')
    const buckets = await getBuckets(accessKey, secretKey)

    if (Array.isArray(buckets)) {
      log('green', `✅ 成功获取存储空间列表，共 ${buckets.length} 个:`)
      buckets.forEach((b) => {
        if (b === bucket) {
          log('green', `   ✅ ${b} (目标存储空间)`)
        } else {
          log('blue', `   📁 ${b}`)
        }
      })

      if (buckets.includes(bucket)) {
        log('green', `🎉 验证成功！存储空间 "${bucket}" 存在且可访问`)
        log('blue', '💡 建议检查存储空间的访问权限设置')
      } else {
        log('red', `❌ 存储空间 "${bucket}" 不存在`)
        log('yellow', '💡 请在七牛云控制台创建该存储空间')
      }
    } else {
      log('yellow', `⚠️ 获取到的数据格式异常: ${buckets}`)
    }
  } catch (error) {
    log('red', `❌ 验证失败: ${error.message}`)

    if (error.message.includes('401')) {
      log('yellow', '💡 可能的原因:')
      log('yellow', '   1. AccessKey 或 SecretKey 错误')
      log('yellow', '   2. 密钥权限不足')
    } else if (error.message.includes('403')) {
      log('yellow', '💡 可能的原因:')
      log('yellow', '   1. 密钥权限不足')
      log('yellow', '   2. 存储空间访问权限设置问题')
    }
  }
}

// 运行主函数
if (require.main === module) {
  main()
}
