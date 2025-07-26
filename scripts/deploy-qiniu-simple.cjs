#!/usr/bin/env node

/**
 * 七牛云简化部署脚本
 * 使用 Node.js 直接调用七牛云 API 进行文件上传
 */

const fs = require('fs')
const path = require('path')
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

// 检查环境变量
function checkEnv() {
  const required = ['QINIU_ACCESS_KEY', 'QINIU_SECRET_KEY', 'QINIU_BUCKET']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    log('red', `❌ 缺少环境变量: ${missing.join(', ')}`)
    process.exit(1)
  }

  log('green', '✅ 环境变量检查通过')
}

// Base64 URL Safe 编码
function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// 生成上传凭证
function generateUploadToken(accessKey, secretKey, bucket) {
  const policy = {
    scope: bucket,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1小时过期
  }

  const encodedPolicy = base64urlEscape(Buffer.from(JSON.stringify(policy)).toString('base64'))
  const sign = base64urlEscape(
    crypto.createHmac('sha1', secretKey).update(encodedPolicy).digest('base64')
  )

  return `${accessKey}:${sign}:${encodedPolicy}`
}

// 获取文件列表
function getFileList(dir) {
  const files = []

  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        walkDir(fullPath)
      } else {
        const relativePath = path.relative(dir, fullPath)
        files.push({
          localPath: fullPath,
          key: relativePath.replace(/\\/g, '/'), // 统一使用 / 分隔符
        })
      }
    }
  }

  walkDir(dir)
  return files
}

// 上传单个文件（带超时和重试）
function uploadFile(file, uploadToken, retries = 2) {
  return new Promise((resolve, reject) => {
    const boundary = '----formdata-qiniu-' + Math.random().toString(36)
    const fileContent = fs.readFileSync(file.localPath)

    // 构建表单数据
    let formData = ''
    formData += `--${boundary}\r\n`
    formData += `Content-Disposition: form-data; name="key"\r\n\r\n`
    formData += `${file.key}\r\n`
    formData += `--${boundary}\r\n`
    formData += `Content-Disposition: form-data; name="token"\r\n\r\n`
    formData += `${uploadToken}\r\n`
    formData += `--${boundary}\r\n`
    formData += `Content-Disposition: form-data; name="file"; filename="${path.basename(file.localPath)}"\r\n`
    formData += `Content-Type: application/octet-stream\r\n\r\n`

    const formDataBuffer = Buffer.concat([
      Buffer.from(formData, 'utf8'),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
    ])

    const options = {
      hostname: 'upload.qiniup.com',
      port: 443,
      path: '/',
      method: 'POST',
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length,
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
            resolve({ key: file.key })
          }
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} ${data}`))
        }
      })
    })

    // 设置超时
    req.setTimeout(30000, () => {
      req.destroy()
      if (retries > 0) {
        console.log(`⚠️ 超时重试: ${file.key} (剩余: ${retries})`)
        setTimeout(() => {
          uploadFile(file, uploadToken, retries - 1)
            .then(resolve)
            .catch(reject)
        }, 1000)
      } else {
        reject(new Error(`Upload timeout: ${file.key}`))
      }
    })

    req.on('error', (err) => {
      if (retries > 0) {
        console.log(`⚠️ 错误重试: ${file.key} - ${err.message} (剩余: ${retries})`)
        setTimeout(() => {
          uploadFile(file, uploadToken, retries - 1)
            .then(resolve)
            .catch(reject)
        }, 1000)
      } else {
        reject(err)
      }
    })

    req.write(formDataBuffer)
    req.end()
  })
}

// 主函数
async function main() {
  try {
    log('blue', '🚀 开始七牛云部署...')

    // 检查环境变量
    checkEnv()

    const accessKey = process.env.QINIU_ACCESS_KEY
    const secretKey = process.env.QINIU_SECRET_KEY
    const bucket = process.env.QINIU_BUCKET

    // 检查构建目录
    const distDir = path.join(process.cwd(), 'apps/frontend/dist')
    if (!fs.existsSync(distDir)) {
      log('red', '❌ 构建目录不存在: apps/frontend/dist')
      log('blue', '请先运行: pnpm build')
      process.exit(1)
    }

    // 生成上传凭证
    const uploadToken = generateUploadToken(accessKey, secretKey, bucket)
    log('green', '✅ 上传凭证生成成功')

    // 获取文件列表
    const files = getFileList(distDir)
    log('blue', `📁 找到 ${files.length} 个文件需要上传`)

    // 上传文件（并发控制）
    let successCount = 0
    let failCount = 0
    const concurrency = 3 // 并发数限制

    // 分批上传
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency)
      const promises = batch.map(async (file) => {
        try {
          console.log(`📤 上传: ${file.key}`)
          await uploadFile(file, uploadToken)
          successCount++
          console.log(`✅ 完成: ${file.key}`)
        } catch (error) {
          failCount++
          console.log(`❌ 失败: ${file.key} - ${error.message}`)
        }
      })

      await Promise.all(promises)
      console.log(`📊 进度: ${Math.min(i + concurrency, files.length)}/${files.length}`)
    }

    console.log('') // 换行

    if (failCount === 0) {
      log('green', `🎉 部署成功！共上传 ${successCount} 个文件`)
      log('blue', `🌐 访问地址: http://${bucket}.your-region.qiniucdn.com`)
      log('blue', '💡 请在七牛云控制台查看具体的 CDN 域名')
    } else {
      log('yellow', `⚠️ 部署完成，成功: ${successCount}, 失败: ${failCount}`)
    }
  } catch (error) {
    log('red', `❌ 部署失败: ${error.message}`)
    process.exit(1)
  }
}

// 运行主函数
if (require.main === module) {
  main()
}
