#!/usr/bin/env node

/**
 * 性能测试脚本
 * 包括前端 Bundle 分析和后端 API 响应时间测试
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 性能预算配置
const PERFORMANCE_BUDGET = {
  // Bundle 大小限制 (KB)
  maxBundleSize: 1024, // 1MB
  maxChunkSize: 512, // 512KB
  maxAssetSize: 256, // 256KB

  // API 响应时间限制 (ms)
  maxApiResponseTime: 500,
  maxDbQueryTime: 100,

  // 内存使用限制 (MB)
  maxMemoryUsage: 512,
}

class PerformanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      frontend: {},
      backend: {},
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
      },
    }
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m',
    }

    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`)
  }

  async analyzeFrontendBundle() {
    this.log('分析前端 Bundle 大小...', 'info')

    try {
      // 检查构建文件是否存在
      const distPath = join(rootDir, 'apps/frontend/dist')
      if (!existsSync(distPath)) {
        this.log('前端构建文件不存在，开始构建...', 'warning')
        execSync('pnpm --filter frontend build', {
          cwd: rootDir,
          stdio: 'inherit',
        })
      }

      // 分析 Bundle 大小
      const bundleAnalysis = this.getBundleStats(distPath)
      this.results.frontend.bundle = bundleAnalysis

      // 检查性能预算
      this.checkBundleBudget(bundleAnalysis)

      return bundleAnalysis
    } catch (error) {
      this.log(`前端 Bundle 分析失败: ${error.message}`, 'error')
      this.results.summary.failed++
      return null
    }
  }

  getBundleStats(distPath) {
    const stats = {
      totalSize: 0,
      chunks: [],
      assets: [],
    }

    try {
      // 递归获取所有文件大小
      const getDirectorySize = (dirPath) => {
        let totalSize = 0

        try {
          const files = readdirSync(dirPath)
          for (const file of files) {
            const filePath = join(dirPath, file)
            const stat = statSync(filePath)

            if (stat.isDirectory()) {
              totalSize += getDirectorySize(filePath)
            } else {
              const sizeKB = Math.round(stat.size / 1024)
              totalSize += sizeKB

              if (file.endsWith('.js')) {
                stats.chunks.push({ name: file, size: sizeKB })
              } else {
                stats.assets.push({ name: file, size: sizeKB })
              }
            }
          }
        } catch {
          // 忽略无法访问的目录
        }

        return totalSize
      }

      stats.totalSize = getDirectorySize(distPath)

      // 排序
      stats.chunks.sort((a, b) => b.size - a.size)
      stats.assets.sort((a, b) => b.size - a.size)

      return stats
    } catch (error) {
      this.log(`获取 Bundle 统计信息失败: ${error.message}`, 'error')
      return stats
    }
  }

  checkBundleBudget(bundleStats) {
    const { maxBundleSize, maxChunkSize, maxAssetSize } = PERFORMANCE_BUDGET

    // 检查总 Bundle 大小
    if (bundleStats.totalSize > maxBundleSize) {
      this.log(`Bundle 总大小超出预算: ${bundleStats.totalSize}KB > ${maxBundleSize}KB`, 'error')
      this.results.summary.failed++
    } else {
      this.log(`Bundle 总大小符合预算: ${bundleStats.totalSize}KB`, 'success')
      this.results.summary.passed++
    }

    // 检查单个 chunk 大小
    const oversizedChunks = bundleStats.chunks.filter((chunk) => chunk.size > maxChunkSize)
    if (oversizedChunks.length > 0) {
      this.log(
        `发现超大 chunk: ${oversizedChunks.map((c) => `${c.name}(${c.size}KB)`).join(', ')}`,
        'warning'
      )
      this.results.summary.warnings++
    }

    // 检查资源文件大小
    const oversizedAssets = bundleStats.assets.filter((asset) => asset.size > maxAssetSize)
    if (oversizedAssets.length > 0) {
      this.log(
        `发现超大资源: ${oversizedAssets.map((a) => `${a.name}(${a.size}KB)`).join(', ')}`,
        'warning'
      )
      this.results.summary.warnings++
    }
  }

  async testBackendPerformance() {
    this.log('测试后端 API 性能...', 'info')

    try {
      // 检查后端是否运行
      const isBackendRunning = await this.checkBackendHealth()
      if (!isBackendRunning) {
        this.log('后端服务未运行，跳过 API 性能测试', 'warning')
        return null
      }

      const apiTests = [
        { name: 'Health Check', url: '/api/v1', method: 'GET' },
        { name: 'User Info', url: '/api/v1/auth/me', method: 'GET' },
        { name: 'Todo List', url: '/api/v1/todos', method: 'GET' },
      ]

      const results = []
      for (const test of apiTests) {
        const result = await this.measureApiResponse(test)
        results.push(result)
      }

      this.results.backend.api = results
      this.checkApiPerformance(results)

      return results
    } catch (error) {
      this.log(`后端性能测试失败: ${error.message}`, 'error')
      this.results.summary.failed++
      return null
    }
  }

  async checkBackendHealth() {
    try {
      const response = await fetch('http://localhost:3000/api/v1')
      return response.ok
    } catch {
      return false
    }
  }

  async measureApiResponse(test) {
    const startTime = Date.now()

    try {
      const response = await fetch(`http://localhost:3000${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      return {
        name: test.name,
        url: test.url,
        method: test.method,
        responseTime,
        status: response.status,
        success: response.ok,
      }
    } catch (error) {
      const endTime = Date.now()
      return {
        name: test.name,
        url: test.url,
        method: test.method,
        responseTime: endTime - startTime,
        status: 0,
        success: false,
        error: error.message,
      }
    }
  }

  checkApiPerformance(results) {
    const { maxApiResponseTime } = PERFORMANCE_BUDGET

    for (const result of results) {
      if (result.success && result.responseTime <= maxApiResponseTime) {
        this.log(`${result.name} 响应时间正常: ${result.responseTime}ms`, 'success')
        this.results.summary.passed++
      } else if (result.success) {
        this.log(
          `${result.name} 响应时间超出预算: ${result.responseTime}ms > ${maxApiResponseTime}ms`,
          'warning'
        )
        this.results.summary.warnings++
      } else {
        this.log(`${result.name} 请求失败: ${result.error || 'Unknown error'}`, 'error')
        this.results.summary.failed++
      }
    }
  }

  generateReport() {
    const reportPath = join(rootDir, 'performance-results.json')
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2))

    this.log('\n📊 性能测试报告', 'info')
    this.log(
      `总计: ${this.results.summary.passed + this.results.summary.failed + this.results.summary.warnings} 项测试`,
      'info'
    )
    this.log(`通过: ${this.results.summary.passed}`, 'success')
    this.log(`警告: ${this.results.summary.warnings}`, 'warning')
    this.log(`失败: ${this.results.summary.failed}`, 'error')
    this.log(`\n详细报告已保存到: ${reportPath}`, 'info')

    return this.results.summary.failed === 0
  }

  async run() {
    this.log('🚀 开始性能测试...', 'info')

    await this.analyzeFrontendBundle()
    await this.testBackendPerformance()

    const success = this.generateReport()

    if (success) {
      this.log('\n🎉 性能测试完成！', 'success')
      process.exit(0)
    } else {
      this.log('\n💥 性能测试发现问题！', 'error')
      process.exit(1)
    }
  }
}

// 运行性能测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new PerformanceTest()
  test.run().catch((error) => {
    console.error('性能测试执行失败:', error)
    process.exit(1)
  })
}

export default PerformanceTest
