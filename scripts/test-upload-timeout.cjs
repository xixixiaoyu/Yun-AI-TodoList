#!/usr/bin/env node

/**
 * 测试上传超时配置
 */

// 模拟不同大小的文件，测试超时时间计算
function calculateTimeout(fileSize) {
  const baseTimeout = 60000 // 基础超时 60 秒
  const sizeBasedTimeout = Math.max(baseTimeout, (fileSize / 1024) * 100) // 每 KB 100ms，最少 60 秒
  const maxTimeout = 300000 // 最大超时 5 分钟
  const timeout = Math.min(sizeBasedTimeout, maxTimeout)
  return timeout
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

console.log('📊 上传超时时间测试')
console.log('='.repeat(50))

const testFiles = [
  { name: 'small.js', size: 10 * 1024 }, // 10 KB
  { name: 'medium.css', size: 100 * 1024 }, // 100 KB
  { name: 'large.js', size: 1024 * 1024 }, // 1 MB
  { name: 'font.ttf', size: 2 * 1024 * 1024 }, // 2 MB
  { name: 'huge.js', size: 5 * 1024 * 1024 }, // 5 MB
  { name: 'massive.woff2', size: 10 * 1024 * 1024 }, // 10 MB
]

testFiles.forEach((file) => {
  const timeout = calculateTimeout(file.size)
  const timeoutSeconds = timeout / 1000
  console.log(
    `📁 ${file.name.padEnd(15)} | ${formatFileSize(file.size).padEnd(8)} | ${timeoutSeconds}s`
  )
})

console.log('\n💡 超时时间计算规则:')
console.log('   - 基础超时: 60 秒')
console.log('   - 大小超时: 每 KB 100ms')
console.log('   - 最大超时: 300 秒 (5 分钟)')
console.log('   - 重试次数: 3 次')
