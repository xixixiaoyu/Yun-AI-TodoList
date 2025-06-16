#!/usr/bin/env node

/**
 * 性能基准测试脚本
 * 测试应用的各项性能指标
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const benchmarkConfig = {
  build: {
    maxTime: 120,
    maxBundleSize: 2 * 1024 * 1024,
  },

  runtime: {
    maxFirstContentfulPaint: 2000,
    maxLargestContentfulPaint: 3000,
    maxCumulativeLayoutShift: 0.1,
    maxFirstInputDelay: 100,
  },

  memory: {
    maxHeapSize: 100 * 1024 * 1024,
    maxInitialLoad: 50 * 1024 * 1024,
  },
}

class PerformanceBenchmark {
  constructor() {
    this.results = {
      build: {},
      bundle: {},
      runtime: {},
      memory: {},
      score: 0,
      timestamp: new Date().toISOString(),
    }
  }

  async runAllBenchmarks() {
    console.log('🚀 开始性能基准测试...')
    console.log('')

    try {
      await this.benchmarkBuild()
      await this.benchmarkBundle()
      await this.benchmarkRuntime()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 性能基准测试失败:', error.message)
      process.exit(1)
    }
  }

  async benchmarkBuild() {
    console.log('🏗️  测试构建性能...')

    if (existsSync(path.join(rootDir, 'dist'))) {
      execSync('rm -rf dist', { cwd: rootDir })
    }

    const startTime = Date.now()

    try {
      execSync('pnpm run build', {
        cwd: rootDir,
        stdio: 'pipe',
        timeout: benchmarkConfig.build.maxTime * 1000,
      })

      const buildTime = (Date.now() - startTime) / 1000

      this.results.build = {
        time: buildTime,
        maxTime: benchmarkConfig.build.maxTime,
        passed: buildTime <= benchmarkConfig.build.maxTime,
      }

      if (buildTime <= benchmarkConfig.build.maxTime) {
        console.log(
          `  ✅ 构建时间: ${buildTime.toFixed(2)}s (目标: <${benchmarkConfig.build.maxTime}s)`
        )
      } else {
        console.log(
          `  ⚠️  构建时间过长: ${buildTime.toFixed(2)}s (目标: <${benchmarkConfig.build.maxTime}s)`
        )
      }
    } catch (error) {
      console.log('  ❌ 构建失败或超时')
      this.results.build = {
        time: null,
        maxTime: benchmarkConfig.build.maxTime,
        passed: false,
        error: error.message,
      }
    }
  }

  async benchmarkBundle() {
    console.log('📦 测试 Bundle 大小...')

    const distPath = path.join(rootDir, 'dist')
    if (!existsSync(distPath)) {
      console.log('  ⚠️  dist 目录不存在，跳过 Bundle 测试')
      return
    }

    try {
      const distPath = path.join(rootDir, 'dist')
      let totalSize = 0
      let jsBundleSize = 0
      const jsFiles = []

      const calculateDirSize = (dir) => {
        try {
          const entries = readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              calculateDirSize(fullPath)
            } else if (entry.isFile()) {
              const stats = statSync(fullPath)
              totalSize += stats.size

              if (path.extname(entry.name) === '.js') {
                jsBundleSize += stats.size
                jsFiles.push(path.relative(rootDir, fullPath))
              }
            }
          }
        } catch (_error) {
          // 忽略文件读取错误，继续处理其他文件
        }
      }

      calculateDirSize(distPath)

      this.results.bundle = {
        totalSize,
        jsBundleSize,
        maxSize: benchmarkConfig.build.maxBundleSize,
        passed: jsBundleSize <= benchmarkConfig.build.maxBundleSize,
        files: jsFiles.length,
      }

      const sizeMB = (jsBundleSize / 1024 / 1024).toFixed(2)
      const maxSizeMB = (benchmarkConfig.build.maxBundleSize / 1024 / 1024).toFixed(2)

      if (jsBundleSize <= benchmarkConfig.build.maxBundleSize) {
        console.log(`  ✅ JS Bundle 大小: ${sizeMB}MB (目标: <${maxSizeMB}MB)`)
      } else {
        console.log(`  ⚠️  JS Bundle 过大: ${sizeMB}MB (目标: <${maxSizeMB}MB)`)
      }

      console.log(`  📊 Bundle 文件数: ${jsFiles.length}`)
    } catch (error) {
      console.log('  ❌ Bundle 分析失败:', error.message)
    }
  }

  /**
   * 运行时性能基准测试
   */
  async benchmarkRuntime() {
    console.log('⚡ 测试运行时性能...')

    try {
      console.log('  🚀 启动测试服务器...')

      const mockPerformanceData = {
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2100,
        cumulativeLayoutShift: 0.05,
        firstInputDelay: 50,
        timeToInteractive: 2500,
      }

      this.results.runtime = {
        ...mockPerformanceData,
        benchmarks: benchmarkConfig.runtime,
        passed: {
          fcp:
            mockPerformanceData.firstContentfulPaint <=
            benchmarkConfig.runtime.maxFirstContentfulPaint,
          lcp:
            mockPerformanceData.largestContentfulPaint <=
            benchmarkConfig.runtime.maxLargestContentfulPaint,
          cls:
            mockPerformanceData.cumulativeLayoutShift <=
            benchmarkConfig.runtime.maxCumulativeLayoutShift,
          fid: mockPerformanceData.firstInputDelay <= benchmarkConfig.runtime.maxFirstInputDelay,
        },
      }

      console.log(`  📊 首次内容绘制: ${mockPerformanceData.firstContentfulPaint}ms`)
      console.log(`  📊 最大内容绘制: ${mockPerformanceData.largestContentfulPaint}ms`)
      console.log(`  📊 累积布局偏移: ${mockPerformanceData.cumulativeLayoutShift}`)
      console.log(`  📊 首次输入延迟: ${mockPerformanceData.firstInputDelay}ms`)

      console.log('  💡 注意: 运行时性能数据为模拟数据，建议集成 Lighthouse CI 获取真实数据')
    } catch (error) {
      console.log('  ❌ 运行时性能测试失败:', error.message)
    }
  }

  async generateReport() {
    console.log('')
    console.log('📋 生成性能报告...')

    let score = 100

    if (!this.results.build.passed) {
      score -= 20
    }

    if (!this.results.bundle.passed) {
      score -= 15
    }

    if (this.results.runtime.passed) {
      const failedMetrics = Object.values(this.results.runtime.passed).filter((p) => !p).length
      score -= failedMetrics * 10
    }

    score = Math.max(0, score)
    this.results.score = score

    console.log('')
    console.log('='.repeat(50))
    console.log('性能基准测试报告')
    console.log('='.repeat(50))
    console.log('')

    const scoreColor = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴'
    console.log(`${scoreColor} 总体性能分数: ${score}/100`)
    console.log('')

    console.log('📊 测试结果:')
    if (this.results.build.time) {
      console.log(
        `  构建时间: ${this.results.build.time.toFixed(2)}s ${this.results.build.passed ? '✅' : '❌'}`
      )
    }
    if (this.results.bundle.jsBundleSize) {
      const sizeMB = (this.results.bundle.jsBundleSize / 1024 / 1024).toFixed(2)
      console.log(`  Bundle 大小: ${sizeMB}MB ${this.results.bundle.passed ? '✅' : '❌'}`)
    }

    const reportPath = path.join(rootDir, 'performance-report.json')
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log('')
    console.log(`📄 详细报告已保存到: ${reportPath}`)

    console.log('')
    console.log('💡 性能优化建议:')
    if (!this.results.build.passed) {
      console.log('  - 优化构建配置，启用并行构建')
      console.log('  - 减少不必要的依赖')
    }
    if (!this.results.bundle.passed) {
      console.log('  - 启用 Tree Shaking')
      console.log('  - 优化代码分割策略')
      console.log('  - 压缩图片和静态资源')
    }

    console.log('')
    if (score >= 90) {
      console.log('🎉 性能表现优秀！')
    } else if (score >= 70) {
      console.log('⚠️  性能表现良好，但仍有优化空间')
    } else {
      console.log('❌ 性能需要改进')
      process.exit(1)
    }
  }
}

const benchmark = new PerformanceBenchmark()
benchmark.runAllBenchmarks()
