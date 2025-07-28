#!/usr/bin/env node

/**
 * 七牛云冗余文件清理脚本
 * 该脚本会列出并删除七牛云存储空间中带哈希值且上传时间超过指定天数的文件
 */

import path from 'path'

// 配置信息
const CONFIG = {
  accessKey: process.env.QINIU_ACCESS_KEY,
  secretKey: process.env.QINIU_SECRET_KEY,
  bucket: process.env.QINIU_BUCKET,
  domain: process.env.QINIU_DOMAIN,
  // 保留最近7天的文件
  retentionDays: parseInt(process.env.QINIU_RETENTION_DAYS || '7'),
}

// 检查环境变量
function checkEnv() {
  const requiredEnvVars = ['QINIU_ACCESS_KEY', 'QINIU_SECRET_KEY', 'QINIU_BUCKET']
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missingEnvVars.join(', '))
    process.exit(1)
  }
}

// 获取七牛云存储中的文件列表
async function listQiniuFiles() {
  const qiniu = await import('qiniu')
  const mac = new qiniu.auth.digest.Mac(CONFIG.accessKey, CONFIG.secretKey)
  const config = new qiniu.conf.Config()
  const bucketManager = new qiniu.rs.BucketManager(mac, config)

  const files = []
  let marker = null

  do {
    const resp = await new Promise((resolve, reject) => {
      bucketManager.listPrefix(
        CONFIG.bucket,
        { marker, limit: 1000 },
        (err, respBody, respInfo) => {
          if (err) {
            reject(err)
          } else if (respInfo.statusCode === 200) {
            resolve(respBody)
          } else {
            reject(new Error(`获取文件列表失败: ${respInfo.statusCode}`))
          }
        }
      )
    })

    files.push(...resp.items)
    marker = resp.marker
  } while (marker)

  return files
}

// 判断文件是否带哈希值
function isHashedFile(filename) {
  // 简单判断文件名中是否包含哈希值（例如：main.a1b2c3d4.js）
  return /\.[a-f0-9]{8,}\.[^.]+$/.test(filename)
}

// 删除七牛云上的文件
async function deleteQiniuFiles(files) {
  const qiniu = await import('qiniu')
  const mac = new qiniu.auth.digest.Mac(CONFIG.accessKey, CONFIG.secretKey)
  const config = new qiniu.conf.Config()
  const bucketManager = new qiniu.rs.BucketManager(mac, config)

  // 分批删除，每批最多1000个文件
  const batchSize = 1000
  let totalSuccessCount = 0
  let totalFailedCount = 0

  for (let i = 0; i < files.length; i += batchSize) {
    const batchFiles = files.slice(i, i + batchSize)
    const deleteOperations = batchFiles.map((file) => qiniu.rs.deleteOp(CONFIG.bucket, file))

    const resp = await new Promise((resolve, reject) => {
      bucketManager.batch(deleteOperations, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else if (respInfo.statusCode === 200) {
          resolve(respBody)
        } else {
          reject(new Error(`批量删除失败: ${respInfo.statusCode}`))
        }
      })
    })

    const successCount = resp.filter((item) => item.code === 200).length
    const failedCount = resp.filter((item) => item.code !== 200).length

    totalSuccessCount += successCount
    totalFailedCount += failedCount

    console.log(`✅ 成功删除 ${successCount} 个文件, 失败 ${failedCount} 个文件`)

    if (failedCount > 0) {
      resp.forEach((item, index) => {
        if (item.code !== 200) {
          console.log(`  - ${batchFiles[index]}: ${item.data.error}`)
        }
      })
    }
  }

  return { successCount: totalSuccessCount, failedCount: totalFailedCount }
}

// 主函数
async function main() {
  try {
    console.log('🔍 开始清理七牛云冗余文件...')

    // 检查环境变量
    checkEnv()

    // 获取七牛云上的所有文件
    const qiniuFiles = await listQiniuFiles()
    console.log(`☁️ 七牛云存储包含 ${qiniuFiles.length} 个文件`)

    // 计算截止时间
    const cutoffTime = Date.now() / 1000 - CONFIG.retentionDays * 24 * 60 * 60

    // 筛选出带哈希值且上传时间早于截止时间的文件
    const redundantFiles = qiniuFiles
      .filter((file) => isHashedFile(file.key))
      .filter((file) => file.putTime / 10000 < cutoffTime) // putTime 是以 100 纳秒为单位的时间戳
      .map((file) => file.key)

    console.log(
      `🗑️ 发现 ${redundantFiles.length} 个冗余文件 (上传时间早于 ${new Date(cutoffTime * 1000).toLocaleString()})`
    )

    if (redundantFiles.length === 0) {
      console.log('🎉 没有发现冗余文件，无需清理')
      return
    }

    // 显示将要删除的文件
    console.log('📄 将要删除的文件:')
    redundantFiles.forEach((file) => console.log(`  - ${file}`))

    // 执行删除
    const result = await deleteQiniuFiles(redundantFiles)
    console.log(
      `\n✅ 清理完成: 成功删除 ${result.successCount} 个文件, 失败 ${result.failedCount} 个文件`
    )
  } catch (err) {
    console.error('❌ 清理过程中出现错误:', err.message)
    process.exit(1)
  }
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

module.exports = {
  checkEnv,
  listQiniuFiles,
  isHashedFile,
  deleteQiniuFiles,
  main,
}
